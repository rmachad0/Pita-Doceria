/**
 * ifood-integration.js
 * Integração nativa com a Merchant API do iFood.
 *
 * Fluxo:
 *   1. Admin salva client_id + client_secret + merchant_id no painel
 *   2. Sistema autentica via OAuth 2.0 (client_credentials)
 *   3. Polling a cada 30s busca novos pedidos
 *   4. Pedidos são inseridos automaticamente na aba Pedidos do Itza Gestão
 *
 * Docs oficiais: https://developer.ifood.com.br/docs/guides/getting-started
 */

import { createClient } from '@supabase/supabase-js'
import { processarDescontoEstoquePedido } from './estoque-integration.js'

const IFOOD_BASE  = 'https://merchant-api.ifood.com.br'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

/** Carrega configurações do iFood do banco */
export async function loadIfoodConfig() {
  const sb = getSupabase()
  const { data } = await sb
    .from('configuracoes')
    .select('ifood_client_id, ifood_client_secret, ifood_merchant_id, ifood_token, ifood_token_expires, ifood_polling_active')
    .eq('id', 1)
    .single()
  return data || {}
}

/** Salva configurações do iFood */
export async function saveIfoodConfig({ clientId, clientSecret, merchantId }) {
  const sb = getSupabase()
  const { error } = await sb
    .from('configuracoes')
    .update({
      ifood_client_id:    clientId,
      ifood_client_secret: clientSecret,
      ifood_merchant_id:  merchantId,
      ifood_token:        null,
      ifood_token_expires: null,
    })
    .eq('id', 1)
  return error ? { error: error.message } : { success: true }
}

/** Ativa/desativa polling */
export async function toggleIfoodPolling(active) {
  const sb = getSupabase()
  const { error } = await sb
    .from('configuracoes')
    .update({ ifood_polling_active: active })
    .eq('id', 1)
  return error ? { error: error.message } : { success: true }
}

// ── OAuth 2.0 ─────────────────────────────────────────────────────────────────

/**
 * Autentica com o iFood via client_credentials.
 * Retorna o access_token ou { error }.
 */
async function getAccessToken(clientId, clientSecret) {
  try {
    const res = await fetch(`${IFOOD_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grantType:    'client_credentials',
        clientId,
        clientSecret,
      }),
    })
    if (!res.ok) {
      const txt = await res.text()
      return { error: `Auth iFood falhou (${res.status}): ${txt}` }
    }
    const data = await res.json()
    return {
      token:   data.accessToken,
      expires: new Date(Date.now() + (data.expiresIn || 21600) * 1000).toISOString(),
    }
  } catch (e) {
    return { error: `Erro de rede: ${e.message}` }
  }
}

/**
 * Retorna token válido (renova se expirado).
 */
export async function getValidToken() {
  const sb     = getSupabase()
  const config = await loadIfoodConfig()

  if (!config.ifood_client_id || !config.ifood_client_secret) {
    return { error: 'Credenciais iFood não configuradas.' }
  }

  // Reutiliza token se ainda válido (com 5min de margem)
  if (config.ifood_token && config.ifood_token_expires) {
    const expiresAt = new Date(config.ifood_token_expires).getTime()
    if (Date.now() < expiresAt - 300_000) {
      return { token: config.ifood_token }
    }
  }

  // Renova
  const auth = await getAccessToken(config.ifood_client_id, config.ifood_client_secret)
  if (auth.error) return auth

  await sb.from('configuracoes').update({
    ifood_token:         auth.token,
    ifood_token_expires: auth.expires,
  }).eq('id', 1)

  return { token: auth.token }
}

// ── Polling de pedidos ────────────────────────────────────────────────────────

/**
 * Busca eventos pendentes do iFood (novos pedidos, cancelamentos, etc.)
 */
async function fetchPendingEvents(token) {
  const res = await fetch(`${IFOOD_BASE}/v1.0/events:polling`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { error: `Polling falhou (${res.status})`, events: [] }
  const events = await res.json()
  return { events: Array.isArray(events) ? events : [] }
}

/**
 * Confirma recebimento dos eventos para o iFood parar de reenviá-los.
 */
async function acknowledgeEvents(token, eventIds) {
  if (!eventIds.length) return
  await fetch(`${IFOOD_BASE}/v1.0/events/acknowledgment`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventIds.map(id => ({ id }))),
  })
}

/**
 * Busca detalhes completos de um pedido pelo ID.
 */
async function fetchOrderDetails(token, orderId) {
  const res = await fetch(`${IFOOD_BASE}/v2.0/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

// ── Conversão iFood → Itza Gestão ─────────────────────────────────────────────

function ifoodOrderToItza(order) {
  const items    = order.items || []
  const itemDesc = items.map(i => `${i.quantity}x ${i.name}`).join(', ')
  const total    = order.totalPrice || order.total?.orderAmount || 0

  return {
    numero_pedido:   `IFOOD-${order.id?.slice(0, 8)?.toUpperCase()}`,
    nome_cliente:    order.customer?.name || 'Cliente iFood',
    telefone:        order.customer?.phone?.number || '',
    produto:         itemDesc || 'Pedido iFood',
    quantidade:      items.reduce((s, i) => s + (i.quantity || 1), 0) || 1,
    valor_total:     total,
    data_entrega:    null,
    forma_pagamento: order.payments?.methods?.[0]?.method || 'iFood',
    observacoes:     order.notes || '',
    status:          'Recebido',
    canal:           'ifood',
    ifood_order_id:  order.id,
  }
}

/**
 * Insere pedido no Supabase (ignora se já existe pelo ifood_order_id).
 */
async function saveIfoodOrder(orderData) {
  const sb = getSupabase()

  // Verifica duplicata
  const { data: existing } = await sb
    .from('pedidos')
    .select('id')
    .eq('numero_pedido', orderData.numero_pedido)
    .maybeSingle()

  if (existing) return { skipped: true }

  const { error } = await sb.from('pedidos').insert([orderData])
  if (error) return { error: error.message }

  // Desconta estoque automaticamente após inserção bem-sucedida
  await processarDescontoEstoquePedido(
    orderData.produto,
    orderData.quantidade,
    orderData.numero_pedido,
  )

  return { inserted: true }
}

// ── Ciclo de polling ──────────────────────────────────────────────────────────

let _pollingTimer = null

/**
 * Executa um ciclo de polling: busca eventos → processa → acknowledges.
 * Retorna { imported, errors }.
 */
export async function runPollingCycle() {
  const tokenRes = await getValidToken()
  if (tokenRes.error) return { imported: 0, errors: [tokenRes.error] }

  const { token } = tokenRes
  const { events, error: evErr } = await fetchPendingEvents(token)
  if (evErr) return { imported: 0, errors: [evErr] }

  const newOrderEvents = events.filter(e =>
    e.code === 'PLC' ||           // Placed — novo pedido
    e.code === 'NEW_ORDER' ||
    e.fullCode === 'ORDER_PLACED'
  )

  let imported = 0
  const errors = []
  const toAck  = events.map(e => e.id).filter(Boolean)

  for (const event of newOrderEvents) {
    const orderId = event.orderId || event.id
    const details = await fetchOrderDetails(token, orderId)
    if (!details) { errors.push(`Não encontrou pedido ${orderId}`); continue }

    const itzaOrder = ifoodOrderToItza(details)
    const result    = await saveIfoodOrder(itzaOrder)
    if (result.inserted) imported++
    if (result.error)    errors.push(result.error)
  }

  // Acknowledge todos os eventos (incluindo os que não são pedidos novos)
  await acknowledgeEvents(token, toAck)

  return { imported, errors, total: events.length }
}

/**
 * Inicia polling automático a cada 30 segundos.
 * Retorna função para parar.
 */
export function startPolling(onCycle) {
  if (_pollingTimer) return () => stopPolling()

  const run = async () => {
    const result = await runPollingCycle()
    onCycle?.(result)
  }

  run() // executa imediatamente
  _pollingTimer = setInterval(run, 30_000)

  return () => stopPolling()
}

export function stopPolling() {
  if (_pollingTimer) {
    clearInterval(_pollingTimer)
    _pollingTimer = null
  }
}

export function isPollingActive() {
  return _pollingTimer !== null
}

// ── Teste de conexão ──────────────────────────────────────────────────────────

/**
 * Testa se as credenciais são válidas.
 */
export async function testIfoodConnection(clientId, clientSecret) {
  const auth = await getAccessToken(clientId, clientSecret)
  if (auth.error) return { ok: false, message: auth.error }
  return { ok: true, message: 'Conexão com iFood estabelecida com sucesso!' }
}
