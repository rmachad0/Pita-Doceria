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
  const base = {
    numero_pedido:   numeroPedido,
    nome_cliente:    pedido.clientName,
    telefone:        pedido.phone,
    produto:         pedido.product,
    quantidade:      pedido.qty,
    valor_total:     (parseFloat(pedido.unitPrice) || 0) * (pedido.qty || 1),
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
    'Entrega':     r.data_entrega ? new Date(r.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
    'Status':      r.status,
    'Pagamento':   r.forma_pagamento || 'Pix',
    'Observações': r.observacoes || '',
    'Canal':       r.canal || 'direto',
  }))
}
