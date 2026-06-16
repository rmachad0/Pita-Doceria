import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function salvarPrecificacao(state) {
  const { error } = await supabase.from('precificacoes').insert([{
    produto:         state.prodName,
    custo_base:      state.baseUnit,
    preco_final:     state.custNum > 0 ? state.custNum : state.sugPrice,
    margem_liquida:  state.netPct,
    saude:           state.netPct >= 25 ? 'Saudável' : state.netPct >= 11 ? 'Alerta' : 'Perigosa',
    canal:           state.channel,
    margem_desejada: state.margin,
    imposto_nf:      state.tax,
    ingredientes: {
      ings:       state.ings,
      packaging:  state.packaging,
      recipeQty:  state.recipeQty,
      prepTime:   state.prepTime,
    },
  }])
  return error ? null : true
}

export async function alertarMargemPerigosa(state) {
  if (state.netPct >= 10 || state.netPct <= 0 || state.baseUnit <= 0) return null
  await supabase.from('alertas_margem').insert([{
    produto:    state.prodName,
    margem:     state.netPct,
    custo_base: state.baseUnit,
  }])
  return { alerted: true }
}

export async function registrarPedido(pedido) {
  const numeroPedido = `PED-${Date.now()}`

  // Suporte a múltiplos itens. Se vier o array `itens` usa ele;
  // caso contrário constrói um array de 1 item (compatibilidade legada).
  const itens = pedido.itens && pedido.itens.length > 0
    ? pedido.itens
    : [{ produto: pedido.product, qty: pedido.qty || 1, unitPrice: parseFloat(pedido.unitPrice) || 0 }]

  const valorTotal = itens.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.qty) || 1), 0)
  const qtdTotal   = itens.reduce((s, i) => s + (parseInt(i.qty) || 1), 0)
  const resumoProd = itens.length === 1
    ? itens[0].produto
    : `${itens[0].produto} + ${itens.length - 1} item${itens.length - 1 > 1 ? 'ns' : ''}`

  const base = {
    numero_pedido:   numeroPedido,
    nome_cliente:    pedido.clientName,
    telefone:        pedido.phone,
    produto:         resumoProd,
    quantidade:      qtdTotal,
    valor_total:     valorTotal,
    itens:           itens,
    data_entrega:    pedido.deliveryDate || null,
    forma_pagamento: pedido.payment,
    observacoes:     pedido.notes,
    status:          'Recebido',
    canal:           pedido.canal || 'direto',
  }
  let { error } = await supabase.from('pedidos').insert([base])
  // Coluna canal pode não existir ainda (migration pendente) — retenta sem ela
  if (error && error.code === '42703') {
    const { canal: _drop, ...semCanal } = base
    ;({ error } = await supabase.from('pedidos').insert([semCanal]))
  }
  // Coluna itens pode não existir ainda — retenta sem ela
  if (error && error.code === '42703') {
    const { itens: _i, ...semItens } = base
    ;({ error } = await supabase.from('pedidos').insert([semItens]))
  }
  return error ? null : { success: true, numeroPedido }
}

export async function carregarHistorico() {
  const { data, error } = await supabase
    .from('precificacoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return []
  return data.map(r => ({
    id:                r.id,
    'Data/Hora':       new Date(r.created_at).toLocaleString('pt-BR'),
    'Produto':         r.produto,
    'Custo Base (R$)': r.custo_base,
    'Preço Final (R$)':r.preco_final,
    'Margem Líq. (%)': r.margem_liquida,
    'Saúde':           r.saude,
    'Canal':           r.canal === 'ifood' ? 'iFood' : 'Direta',
    ingredientes:      r.ingredientes || null,
  }))
}

export async function atualizarPrecificacao(id, {
  produto, precoFinal, canal,
  ings, packaging, recipeQty, prepTime, cph,
  custoBaseExistente,
}) {
  let custoBase
  if (ings && ings.length > 0) {
    const totalIngBatch = ings.reduce(
      (s, i) => s + (i.pkgWeight > 0 ? (i.pkgPrice / i.pkgWeight) * i.used : 0), 0
    )
    const structBatch = ((parseFloat(prepTime) || 0) / 60) * (parseFloat(cph) || 0)
    const qty = parseFloat(recipeQty) || 1
    const ingUnit    = totalIngBatch / qty
    const pkgUnit    = parseFloat(packaging) || 0
    const structUnit = structBatch / qty
    custoBase = ingUnit + pkgUnit + structUnit
  } else {
    custoBase = parseFloat(custoBaseExistente) || 0
  }

  const margemLiquida = precoFinal > 0
    ? ((precoFinal - custoBase) / precoFinal) * 100
    : 0
  const saude   = margemLiquida >= 25 ? 'Saudável' : margemLiquida >= 11 ? 'Alerta' : 'Perigosa'
  const canalDb = canal === 'iFood' ? 'ifood' : 'direto'

  const payload = {
    produto,
    custo_base:     custoBase,
    preco_final:    precoFinal,
    margem_liquida: margemLiquida,
    saude,
    canal:          canalDb,
  }
  if (ings !== undefined) {
    payload.ingredientes = { ings, packaging: parseFloat(packaging) || 0, recipeQty, prepTime }
  }

  const { error } = await supabase
    .from('precificacoes')
    .update(payload)
    .eq('id', id)
  return error ? null : { custoBase, margemLiquida, saude }
}

export async function atualizarStatusPedido(numeroPedido, novoStatus) {
  const { error } = await supabase
    .from('pedidos')
    .update({ status: novoStatus })
    .eq('numero_pedido', numeroPedido)
  return error ? null : true
}

export async function excluirPedido(numeroPedido) {
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('numero_pedido', numeroPedido)
  return error ? null : true
}

// ── Gastos Extras ─────────────────────────────────────────────────────────────

export async function salvarGastoExtra({ descricao, valor, data }) {
  const { error } = await supabase.from('gastos_extras').insert([{
    descricao,
    valor:  parseFloat(valor),
    data:   data || new Date().toISOString().split('T')[0],
  }])
  return error ? null : true
}

export async function carregarGastosExtras(mes, ano) {
  const inicio = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const fim    = `${ano}-${String(mes + 1).padStart(2, '0')}-31`
  const { data, error } = await supabase
    .from('gastos_extras')
    .select('*')
    .gte('data', inicio)
    .lte('data', fim)
    .order('data', { ascending: false })
  if (error) return []
  return data.map(r => ({
    id:        r.id,
    descricao: r.descricao,
    valor:     parseFloat(r.valor),
    data:      r.data,
  }))
}

export async function excluirGastoExtra(id) {
  const { error } = await supabase
    .from('gastos_extras')
    .delete()
    .eq('id', id)
  return error ? null : true
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { error: error.message } : { user: data.user }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data ? { ...data, email: user.email } : { id: user.id, email: user.email, role: 'user' }
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: true })
  return error ? [] : data
}

export async function createUser(email, password) {
  const { error } = await supabase.auth.signUp({ email, password })
  return error ? { error: error.message } : { success: true }
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return error ? { error: error.message } : { success: true }
}

export async function sendPasswordRecovery(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
  })
  return error ? { error: error.message } : { success: true }
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return subscription
}

// ── Configurações / Logo ──────────────────────────────────────────────────────

export async function loadConfiguracoes() {
  const { data } = await supabase.from('configuracoes').select('*').eq('id', 1).single()
  return data || null
}

export async function saveLogoData(logoData) {
  const { error } = await supabase
    .from('configuracoes')
    .upsert({ id: 1, logo_data: logoData, updated_at: new Date().toISOString() })
  return error ? { error: error.message } : { success: true }
}

export async function updateProfileRole(userId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  return error ? { error: error.message } : { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function carregarPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return []
  return data.map(r => ({
    'Nº Pedido':   r.numero_pedido,
    'Data/Hora':   new Date(r.created_at).toLocaleString('pt-BR'),
    'Cliente':     r.nome_cliente,
    'Produto':     r.produto,
    'Quantidade':  r.quantidade,
    'Valor Total': r.valor_total,
    'Itens':       r.itens || null,
    'Entrega':     r.data_entrega ? new Date(r.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    'Status':      r.status,
    'Pagamento':   r.forma_pagamento || 'Pix',
    'Observações': r.observacoes || '',
    'Canal':       r.canal || 'direto',
  }))
}

// ── Produtos (Cardápio) ────────────────────────────────────────────────────────

// Produtos padrão usados como fallback enquanto a tabela 'produtos' não está disponível na API
const PRODUTOS_FALLBACK = [
  { id: 1,  nome: 'Torta de Limão',     categoria: 'Tortas',  preco: 79.90, descricao: 'Torta cremosa de limão com base crocante e merengue dourado', foto_url: '', ativo: true, ordem: 1 },
  { id: 2,  nome: 'Torta de Morango',   categoria: 'Tortas',  preco: 85.00, descricao: 'Torta com creme de baunilha e morangos frescos',              foto_url: '', ativo: true, ordem: 2 },
  { id: 3,  nome: 'Torta de Chocolate', categoria: 'Tortas',  preco: 89.90, descricao: 'Torta intensa de chocolate belga com ganache',                foto_url: '', ativo: true, ordem: 3 },
  { id: 4,  nome: 'Brigadeiro Gourmet', categoria: 'Doces',   preco:  5.50, descricao: 'Brigadeiro artesanal com chocolate belga e granulado crocante', foto_url: '', ativo: true, ordem: 1 },
  { id: 5,  nome: 'Beijinho',           categoria: 'Doces',   preco:  5.00, descricao: 'Docinho de coco com cravo',                                   foto_url: '', ativo: true, ordem: 2 },
  { id: 6,  nome: 'Trufa de Chocolate', categoria: 'Doces',   preco:  7.00, descricao: 'Trufa recheada com ganache de chocolate meio amargo',          foto_url: '', ativo: true, ordem: 3 },
  { id: 7,  nome: 'Pão de Mel',         categoria: 'Doces',   preco:  8.00, descricao: 'Pão de mel recheado com doce de leite e coberto com chocolate', foto_url: '', ativo: true, ordem: 4 },
  { id: 8,  nome: 'Coxinha',            categoria: 'Lanche',  preco:  9.00, descricao: 'Coxinha de frango com catupiry em massa especial',             foto_url: '', ativo: true, ordem: 1 },
  { id: 9,  nome: 'Mini Salgados',      categoria: 'Lanche',  preco:  6.50, descricao: 'Mini salgados sortidos para festas e eventos',                 foto_url: '', ativo: true, ordem: 2 },
  { id: 10, nome: 'Suco Natural',       categoria: 'Bebidas', preco: 12.00, descricao: 'Suco de frutas frescas da estação',                            foto_url: '', ativo: true, ordem: 1 },
  { id: 11, nome: 'Refrigerante',       categoria: 'Bebidas', preco:  6.00, descricao: 'Lata 350ml',                                                   foto_url: '', ativo: true, ordem: 2 },
  { id: 12, nome: 'Água',              categoria: 'Bebidas', preco:  3.00, descricao: 'Garrafa 500ml',                                                foto_url: '', ativo: true, ordem: 3 },
]

export async function listarProdutos({ apenasAtivos = false } = {}) {
  let q = supabase.from('produtos').select('*').order('categoria').order('ordem').order('nome')
  if (apenasAtivos) q = q.eq('ativo', true)
  const { data, error } = await q
  if (error) {
    // Fallback enquanto PostgREST recarrega o schema
    const fb = apenasAtivos ? PRODUTOS_FALLBACK.filter(p => p.ativo) : PRODUTOS_FALLBACK
    return fb
  }
  return data
}

export async function salvarProduto({ id, nome, descricao, preco, categoria, foto_url, ativo, ordem }) {
  const payload = { nome, descricao, preco: parseFloat(preco) || 0, categoria, foto_url, ativo: ativo ?? true, ordem: parseInt(ordem) || 0, updated_at: new Date().toISOString() }
  if (id) {
    const { error } = await supabase.from('produtos').update(payload).eq('id', id)
    return error ? { error: error.message } : { success: true }
  }
  const { error } = await supabase.from('produtos').insert([payload])
  return error ? { error: error.message } : { success: true }
}

export async function excluirProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  return error ? { error: error.message } : { success: true }
}

export async function uploadFotoProduto(file) {
  const ext  = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('produtos').upload(path, file, { upsert: true })
  if (error) return { error: error.message }
  const { data } = supabase.storage.from('produtos').getPublicUrl(path)
  return { url: data.publicUrl }
}
