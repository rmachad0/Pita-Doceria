/**
 * PiTa® × n8n — Módulo de Integração Completo
 * Arquivo: src/services/n8n-integration.js
 *
 * Google Sheets é o "banco de dados" — tudo salvo e lido via n8n webhooks.
 *
 * Imports no App.jsx:
 *   import { salvarPrecificacao, alertarMargemPerigosa, registrarPedido,
 *            carregarHistorico, carregarPedidos } from './services/n8n-integration'
 */

// ── Configuração ──────────────────────────────────────────────────────────────
const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'http://localhost:5678'

export const WEBHOOKS = {
  salvarPrecificacao: `${N8N_BASE_URL}/webhook/pita-salvar-precificacao`,
  alertarMargem:     `${N8N_BASE_URL}/webhook/pita-alerta-margem`,
  novoPedido:        `${N8N_BASE_URL}/webhook/pita-novo-pedido`,
  lerDados:          `${N8N_BASE_URL}/webhook/pita-ler-dados`,
}

// ── Helper POST ───────────────────────────────────────────────────────────────
async function postWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`n8n respondeu com status ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('[PiTa×n8n] Erro POST:', err.message)
    return null
  }
}

// ── Helper GET ────────────────────────────────────────────────────────────────
async function getWebhook(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
    if (!res.ok) throw new Error(`n8n respondeu com status ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('[PiTa×n8n] Erro GET:', err.message)
    return null
  }
}

// ── Workflow 1 — Salvar Precificação no Google Sheets ─────────────────────────
/**
 * Salva a precificação atual no Google Sheets.
 * @param {object} state — { prodName, baseUnit, sugPrice, custNum, netPct, margin, tax, channel, prepTime, recipeQty, ings }
 */
export async function salvarPrecificacao(state) {
  return postWebhook(WEBHOOKS.salvarPrecificacao, {
    productName:    state.prodName,
    baseUnitCost:   state.baseUnit,
    suggestedPrice: state.sugPrice,
    customPrice:    state.custNum > 0 ? state.custNum : null,
    netMarginPct:   state.netPct,
    margin:         state.margin,
    tax:            state.tax,
    channel:        state.channel,
    prepTime:       state.prepTime,
    recipeQty:      state.recipeQty,
    ingredients:    state.ings,
    timestamp:      new Date().toISOString(),
  })
}

// ── Workflow 2 — Alerta de Margem Perigosa ────────────────────────────────────
/**
 * Dispara alerta WhatsApp quando netPct < 10.
 * Use em useEffect({ deps: [netPct] }) no App.jsx.
 */
export async function alertarMargemPerigosa(state) {
  if (state.netPct >= 10 || state.netPct <= 0 || state.baseUnit <= 0) return null
  return postWebhook(WEBHOOKS.alertarMargem, {
    productName:    state.prodName,
    netMarginPct:   state.netPct,
    baseUnitCost:   state.baseUnit,
    suggestedPrice: state.sugPrice,
    customPrice:    state.custNum > 0 ? state.custNum : null,
    margin:         state.margin,
    tax:            state.tax,
    channel:        state.channel,
  })
}

// ── Workflow 4 — Registrar Novo Pedido ────────────────────────────────────────
/**
 * Registra pedido no Sheets + envia WhatsApp de confirmação ao cliente e à equipe.
 * @param {object} pedido — { clientName, phone, product, qty, unitPrice, deliveryDate, notes, payment }
 */
export async function registrarPedido(pedido) {
  return postWebhook(WEBHOOKS.novoPedido, pedido)
}

// ── Workflow 5 — Carregar Histórico de Precificações ─────────────────────────
/**
 * Lê todas as precificações salvas no Google Sheets.
 * @returns {Array} lista de registros ordenada por data (mais recente primeiro)
 */
export async function carregarHistorico() {
  const result = await getWebhook(`${WEBHOOKS.lerDados}?tipo=precificacoes`)
  return result?.data || []
}

// ── Workflow 5 — Carregar Pedidos ─────────────────────────────────────────────
/**
 * Lê todos os pedidos salvos no Google Sheets.
 * @returns {Array} lista de pedidos
 */
export async function carregarPedidos() {
  const result = await getWebhook(`${WEBHOOKS.lerDados}?tipo=pedidos`)
  return result?.data || []
}
