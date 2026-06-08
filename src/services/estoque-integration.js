/**
 * estoque-integration.js
 * CRUD para estoque, fichas técnicas e movimentações.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function sb() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

// ── Estoque ───────────────────────────────────────────────────────────────────

export async function listarEstoque() {
  const { data, error } = await sb().from('estoque').select('*').order('nome')
  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function criarIngrediente(item) {
  const { data, error } = await sb().from('estoque').insert([item]).select().single()
  if (error) return { error: error.message }
  return { data }
}

export async function atualizarIngrediente(id, updates) {
  const { error } = await sb().from('estoque').update(updates).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function excluirIngrediente(id) {
  const { error } = await sb().from('estoque').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Fichas Técnicas ───────────────────────────────────────────────────────────

export async function listarFichas() {
  const { data, error } = await sb()
    .from('fichas_tecnicas')
    .select('*, ficha_ingredientes(*, estoque(nome, unidade))')
    .order('produto')
  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function criarFicha(ficha, ingredientes) {
  const client = sb()
  // Insert ficha
  const { data: fichaData, error: fichaErr } = await client
    .from('fichas_tecnicas')
    .insert([ficha])
    .select()
    .single()
  if (fichaErr) return { error: fichaErr.message }

  // Insert ingredientes
  if (ingredientes && ingredientes.length > 0) {
    const rows = ingredientes.map(i => ({ ...i, ficha_id: fichaData.id }))
    const { error: ingErr } = await client.from('ficha_ingredientes').insert(rows)
    if (ingErr) return { error: ingErr.message }
  }

  return { data: fichaData }
}

export async function atualizarFicha(id, ficha, ingredientes) {
  const client = sb()
  const { error: fichaErr } = await client.from('fichas_tecnicas').update(ficha).eq('id', id)
  if (fichaErr) return { error: fichaErr.message }

  // Replace ingredients: delete then re-insert
  await client.from('ficha_ingredientes').delete().eq('ficha_id', id)
  if (ingredientes && ingredientes.length > 0) {
    const rows = ingredientes.map(i => ({ ...i, ficha_id: id }))
    const { error: ingErr } = await client.from('ficha_ingredientes').insert(rows)
    if (ingErr) return { error: ingErr.message }
  }

  return { success: true }
}

export async function excluirFicha(id) {
  const { error } = await sb().from('fichas_tecnicas').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Movimentações ─────────────────────────────────────────────────────────────

export async function listarMovimentacoes(limit = 200) {
  const { data, error } = await sb()
    .from('movimentacoes_estoque')
    .select('*, estoque(nome, unidade)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

/**
 * Registra uma movimentação e atualiza o saldo do ingrediente.
 * tipo: 'entrada' | 'saida' | 'ajuste' | 'desperdicio'
 */
export async function registrarMovimentacao({ estoque_id, tipo, quantidade, motivo, pedido_ref }) {
  const client = sb()

  // Busca saldo atual
  const { data: ing, error: ingErr } = await client
    .from('estoque')
    .select('quantidade, nome')
    .eq('id', estoque_id)
    .single()
  if (ingErr) return { error: ingErr.message }

  const delta = tipo === 'saida' || tipo === 'desperdicio' ? -quantidade : quantidade
  const novoSaldo = Math.max(0, (ing.quantidade || 0) + delta)

  // Atualiza saldo
  const { error: updErr } = await client
    .from('estoque')
    .update({ quantidade: novoSaldo })
    .eq('id', estoque_id)
  if (updErr) return { error: updErr.message }

  // Insere movimentação
  const { error: movErr } = await client.from('movimentacoes_estoque').insert([{
    estoque_id,
    tipo,
    quantidade,
    saldo_apos: novoSaldo,
    motivo,
    pedido_ref,
  }])
  if (movErr) return { error: movErr.message }

  return { success: true, novoSaldo }
}

// ── Desconto automático por ficha técnica ─────────────────────────────────────

/**
 * Busca a ficha técnica de um produto pelo nome (match parcial, case-insensitive).
 */
export async function buscarFichaPorProduto(nomeProduto) {
  const { data, error } = await sb()
    .from('fichas_tecnicas')
    .select('*, ficha_ingredientes(*, estoque(*))')
    .ilike('produto', `%${nomeProduto}%`)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

/**
 * Desconta do estoque todos os ingredientes de uma ficha técnica
 * proporcional à quantidade de unidades produzidas (qtdVendida).
 *
 * Ex: ficha rende 6 bolos, vendeu 3 → desconta 50% de cada ingrediente.
 */
export async function descontarEstoquePorFicha(ficha, qtdVendida, pedidoRef) {
  if (!ficha || !ficha.ficha_ingredientes?.length) return { skipped: true }

  const fator = qtdVendida / (ficha.rendimento || 1)
  const erros = []

  for (const ing of ficha.ficha_ingredientes) {
    if (!ing.estoque_id) continue // ingrediente sem vínculo no estoque, pula

    const qtd = parseFloat(ing.quantidade) * fator
    const res = await registrarMovimentacao({
      estoque_id: ing.estoque_id,
      tipo: 'saida',
      quantidade: qtd,
      motivo: `Venda — ${ficha.produto}`,
      pedido_ref: pedidoRef,
    })
    if (res.error) erros.push(`${ing.nome_ingrediente}: ${res.error}`)
  }

  return erros.length ? { errors: erros } : { success: true }
}

/**
 * Tenta encontrar ficha e descontar estoque quando um pedido é registrado.
 * produto: string com nome do produto (pode ter "2x Bolo de Chocolate, 1x Cookie")
 */
export async function processarDescontoEstoquePedido(produto, quantidade, pedidoRef) {
  // Extrai nome do primeiro item (simplificado)
  const nomeProduto = produto.replace(/^\d+x\s*/i, '').split(',')[0].trim()
  const ficha = await buscarFichaPorProduto(nomeProduto)
  if (!ficha) return { skipped: true, reason: 'Sem ficha técnica vinculada' }
  return descontarEstoquePorFicha(ficha, quantidade, pedidoRef)
}

// ── Sincronização de pedidos ──────────────────────────────────────────────────

/**
 * Verifica se um pedido já teve estoque descontado
 * (existe alguma movimentação com pedido_ref = numeroPedido)
 */
export async function pedidoJaSincronizado(numeroPedido) {
  const { data } = await sb()
    .from('movimentacoes_estoque')
    .select('id')
    .eq('pedido_ref', numeroPedido)
    .limit(1)
    .maybeSingle()
  return !!data
}

/**
 * Retorna resumo de sincronização:
 * - total de pedidos
 * - quantos já sincronizados (têm movimentação)
 * - quantos pendentes (sem movimentação)
 * - lista dos pendentes [{numero_pedido, produto, quantidade, canal, created_at}]
 */
export async function resumoSincronizacao() {
  const client = sb()

  // Busca todos os pedidos (últimos 500)
  const { data: pedidos, error } = await client
    .from('pedidos')
    .select('numero_pedido, produto, quantidade, canal, created_at, status')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return { error: error.message }

  // Busca pedidos que já têm movimentação
  const { data: movs } = await client
    .from('movimentacoes_estoque')
    .select('pedido_ref')
    .not('pedido_ref', 'is', null)

  const sincronizados = new Set((movs || []).map(m => m.pedido_ref))
  const pendentes = (pedidos || []).filter(p => !sincronizados.has(p.numero_pedido))
  const jaSync    = (pedidos || []).filter(p =>  sincronizados.has(p.numero_pedido))

  return {
    total:       (pedidos || []).length,
    sincronizados: jaSync.length,
    pendentes:   pendentes.length,
    listaPendentes: pendentes,
    listaSincronizados: jaSync,
  }
}

/**
 * Sincroniza um lote de pedidos pendentes:
 * para cada pedido, tenta encontrar ficha técnica e descontar estoque.
 * Retorna { processados, erros, semFicha }
 */
export async function sincronizarPedidosPendentes(pedidos) {
  let processados = 0, erros = [], semFicha = 0

  for (const ped of pedidos) {
    const res = await processarDescontoEstoquePedido(
      ped.produto,
      ped.quantidade || 1,
      ped.numero_pedido
    )
    if (res.skipped)       semFicha++
    else if (res.success)  processados++
    else if (res.errors)   erros.push(...res.errors)
  }

  return { processados, erros, semFicha }
}
