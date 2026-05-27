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
  const { error } = await supabase.from('pedidos').insert([{
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
  }])
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
    'Data/Hora':       new Date(r.created_at).toLocaleString('pt-BR'),
    'Produto':         r.produto,
    'Custo Base (R$)': r.custo_base,
    'Preço Final (R$)':r.preco_final,
    'Margem Líq. (%)': r.margem_liquida,
    'Saúde':           r.saude,
    'Canal':           r.canal === 'ifood' ? 'iFood' : 'Direta',
  }))
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
