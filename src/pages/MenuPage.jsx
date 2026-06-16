import { useState, useMemo, useEffect } from 'react'
import { registrarPedido, listarProdutos } from '../services/supabase-integration'

// ── Configuração da loja ────────────────────────────────────────────────────
const WHATSAPP = '5566996799565'
const TAXA_ENTREGA = 7.99   // R$ fixo para entrega em domicílio

const CORES = {
  feldgrau:  '#525F54',
  peach:     '#FABD97',
  asparagus: '#6CAE75',
  offwhite:  '#F5F0EB',
  danger:    '#E05C5C',
}

const EMOJI_CAT = { Tortas: '🎂', Doces: '🍪', Lanche: '🥐', Bebidas: '🥤', Outros: '🍽️' }

const fmt = (v) => {
  const n = Number(v)
  if (v == null || isNaN(n)) return 'R$ 0,00'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const maskPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return v
}

// ── Busca CEP via ViaCEP ─────────────────────────────────────────────────────
async function buscarCep(cep) {
  const c = cep.replace(/\D/g, '')
  if (c.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    const d = await r.json()
    if (d.erro) return null
    return d
  } catch { return null }
}

// ── Geocodificação reversa (browser geolocation + Nominatim) ─────────────────
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    )
    const d = await r.json()
    return d
  } catch { return null }
}

// ════════════════════════════════════════════════════════════════════════════
//  COMPONENTES DE PRODUTO
// ════════════════════════════════════════════════════════════════════════════

function ProductDetailDrawer({ item, qty, onAdd, onRemove, onClose }) {
  const [obs, setObs] = useState('')
  const [localQty, setLocalQty] = useState(qty || 1)

  const handleAdicionar = () => {
    for (let i = 0; i < localQty; i++) onAdd({ ...item, obs })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 18px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{
            width: 180, height: 180, borderRadius: 12, overflow: 'hidden',
            background: '#f3ede7', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.foto
              ? <img src={item.foto} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 36 }}>🍰</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: CORES.feldgrau, lineHeight: 1.3 }}>{item.nome}</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: CORES.asparagus, marginTop: 4 }}>{fmt(item.preco)}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: '#f0f0f0', border: 'none', color: CORES.feldgrau, fontSize: 16,
            cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 0' }}>
          {item.descricao && (
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{item.descricao}</div>
          )}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
              💬 Alguma observação?
            </label>
            <textarea
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Ex: sem amendoas, ponto da carne, sabor preferido..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 14,
                resize: 'none', height: 80, fontFamily: 'inherit', color: CORES.feldgrau, outline: 'none',
              }}
            />
          </div>
        </div>
        <div style={{ padding: '16px 20px 28px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: CORES.offwhite, borderRadius: 12, padding: '6px 12px' }}>
              <button onClick={() => setLocalQty(q => Math.max(1, q - 1))} style={{
                width: 30, height: 30, borderRadius: 8, border: `2px solid ${CORES.peach}`,
                background: 'white', fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, minWidth: 24, textAlign: 'center', color: CORES.feldgrau }}>{localQty}</span>
              <button onClick={() => setLocalQty(q => q + 1)} style={{
                width: 30, height: 30, borderRadius: 8, background: CORES.peach,
                border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              }}>+</button>
            </div>
            <button onClick={handleAdicionar} style={{
              flex: 1, background: CORES.feldgrau, color: CORES.peach,
              border: 'none', borderRadius: 12, padding: '13px 0',
              fontWeight: 800, fontSize: 16, cursor: 'pointer',
            }}>
              Adicionar · {fmt(item.preco * localQty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ item, qty, onAdd, onRemove, onOpenDetail }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div onClick={() => onOpenDetail(item)} style={{
        background: item.foto ? 'transparent' : '#f3ede7', height: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
      }}>
        {item.foto
          ? <img src={item.foto} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ textAlign: 'center', color: '#bbb' }}><div style={{ fontSize: 40 }}>🍰</div><div style={{ fontSize: 11, marginTop: 4 }}>sem foto</div></div>
        }
        <div style={{
          position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.35)',
          borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600,
        }}>ver mais</div>
      </div>
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: CORES.feldgrau, lineHeight: 1.3 }}>{item.nome}</div>
        {item.descricao && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.descricao}
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 17, color: CORES.asparagus, marginTop: 8 }}>{fmt(item.preco)}</div>
      </div>
      <div style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {qty === 0 ? (
          <button onClick={() => onOpenDetail(item)} style={{
            flex: 1, background: CORES.peach, color: CORES.feldgrau,
            border: 'none', borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>+ Adicionar</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <button onClick={() => onRemove(item)} style={{
              width: 34, height: 34, borderRadius: 10, border: `2px solid ${CORES.peach}`, background: 'white',
              fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: 'center', color: CORES.feldgrau }}>{qty}</span>
            <button onClick={() => onAdd(item)} style={{
              width: 34, height: 34, borderRadius: 10, background: CORES.peach, border: 'none',
              fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CartDrawer({ cart, products, onAdd, onRemove, onClose, onCheckout }) {
  const total = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const p = products.find(x => String(x.id) === String(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, products])

  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const p = products.find(x => String(x.id) === String(id))
      return p ? { ...p, qty } : null
    })
    .filter(Boolean)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        background: CORES.offwhite, borderRadius: '20px 20px 0 0', padding: '20px 20px 0',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: CORES.feldgrau }}>🛒 Seu Carrinho</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1.5px solid ${CORES.feldgrau}`, borderRadius: 10,
            padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: CORES.feldgrau,
          }}>← Continuar comprando</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 10,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: CORES.feldgrau }}>{item.nome}</div>
                <div style={{ fontSize: 13, color: CORES.asparagus, fontWeight: 700 }}>{fmt(item.preco)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onRemove(item)} style={{
                  width: 28, height: 28, borderRadius: 8, border: `2px solid ${CORES.peach}`,
                  background: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', color: CORES.feldgrau,
                }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center', color: CORES.feldgrau }}>{item.qty}</span>
                <button onClick={() => onAdd(item)} style={{
                  width: 28, height: 28, borderRadius: 8, background: CORES.peach, border: 'none',
                  fontWeight: 700, fontSize: 16, cursor: 'pointer', color: CORES.feldgrau,
                }}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, minWidth: 60, textAlign: 'right' }}>
                {fmt(item.preco * item.qty)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: 16, marginTop: 8, paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: CORES.feldgrau }}>Subtotal</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: CORES.asparagus }}>{fmt(total)}</span>
          </div>
          <button onClick={onCheckout} style={{
            width: '100%', background: CORES.feldgrau, color: CORES.peach,
            border: 'none', borderRadius: 14, padding: '14px 0',
            fontWeight: 800, fontSize: 16, cursor: 'pointer', letterSpacing: 0.3, marginBottom: 10,
          }}>Finalizar Pedido →</button>
          <button onClick={onClose} style={{
            width: '100%', background: 'transparent', color: CORES.feldgrau,
            border: `1.5px solid ${CORES.feldgrau}`, borderRadius: 14, padding: '12px 0',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>← Continuar comprando</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  FLUXO DE CHECKOUT — STEP COMPONENTS (top-level, never nested)
// ════════════════════════════════════════════════════════════════════════════

function StepDelivery({ itens, subtotal, onBack, onSelect }) {
  const opcoes = [
    {
      key: 'delivery',
      icon: '🏠',
      titulo: 'Receber em casa',
      sub: `Taxa de entrega · ${fmt(TAXA_ENTREGA)}`,
      badge: null,
    },
    {
      key: 'pickup',
      icon: '🛍️',
      titulo: 'Retirar no local',
      sub: 'Grátis',
      badge: null,
    },
    {
      key: 'local',
      icon: '🍽️',
      titulo: 'Consumir no local',
      sub: null,
      badge: null,
    },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: CORES.offwhite, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: CORES.feldgrau, padding: '0 0 1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: CORES.peach }}>←</button>
          <div style={{ fontWeight: 800, fontSize: 18, color: CORES.peach }}>Finalizar pedido</div>
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* Resumo rápido */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Resumo
          </div>
          {itens.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4, color: CORES.feldgrau }}>
              <span>{it.qty}× {it.produto}</span>
              <span style={{ fontWeight: 600 }}>{fmt(it.unitPrice * it.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: CORES.feldgrau }}>Subtotal</span>
            <span style={{ fontWeight: 800, color: CORES.asparagus }}>{fmt(subtotal)}</span>
          </div>
        </div>

        {/* Escolha de entrega */}
        <div style={{ fontWeight: 800, fontSize: 16, color: CORES.feldgrau, marginBottom: 14 }}>
          Escolha como receber o pedido
        </div>

        <div style={{
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          {opcoes.map((op, idx) => (
            <button
              key={op.key}
              onClick={() => onSelect(op.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: idx < opcoes.length - 1 ? '1px solid #f0f0f0' : 'none',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>{op.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: CORES.feldgrau }}>{op.titulo}</div>
                {op.sub && (
                  <div style={{ fontSize: 13, color: op.key === 'pickup' ? CORES.asparagus : '#888', marginTop: 2, fontWeight: op.key === 'pickup' ? 700 : 400 }}>
                    {op.sub}
                  </div>
                )}
              </div>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepAddress({ onBack, onFound }) {
  const [inputLocal, setInputLocal] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erroLocal, setErroLocal] = useState('')
  const [buscandoGeo, setBuscandoGeo] = useState(false)

  const handleBuscar = async () => {
    const val = inputLocal.trim()
    if (!val) return
    setBuscando(true)
    setErroLocal('')
    // Tenta CEP
    const cepResult = await buscarCep(val)
    if (cepResult) {
      setBuscando(false)
      onFound({
        logradouro: cepResult.logradouro || val,
        numero: '', complemento: '', referencia: '', label: '',
      })
      return
    }
    // Trata como endereço livre
    setBuscando(false)
    onFound({ logradouro: val, numero: '', complemento: '', referencia: '', label: '' })
  }

  const handleGeolocalizacao = async () => {
    if (!navigator.geolocation) { setErroLocal('Geolocalização não disponível.'); return }
    setBuscandoGeo(true)
    setErroLocal('')
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      setBuscandoGeo(false)
      if (geo && geo.address) {
        const a = geo.address
        const rua = a.road || a.pedestrian || a.footway || ''
        const bairro = a.suburb || a.neighbourhood || a.village || ''
        const cidade = a.city || a.town || a.municipality || 'Sinop'
        const estado = a.state_code || a.state || 'MT'
        const cep = (a.postcode || '').replace(/\D/g, '')
        onFound({
          logradouro: rua || geo.display_name?.split(',')[0] || '',
          numero: a.house_number || '',
          complemento: bairro ? `${bairro}` : '',
          referencia: '',
          label: '',
          cidade, estado, cep,
        })
      } else {
        setErroLocal('Não foi possível obter o endereço. Tente digitar manualmente.')
      }
    }, () => {
      setBuscandoGeo(false)
      setErroLocal('Permissão de localização negada.')
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#fff', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: CORES.feldgrau }}>←</button>
        <div style={{ fontWeight: 800, fontSize: 18, color: CORES.feldgrau }}>Novo Endereço</div>
      </div>

      <div style={{ padding: '28px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: CORES.feldgrau, marginBottom: 20 }}>
          Em qual endereço você deseja receber seu pedido?
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: '#888', display: 'block', marginBottom: 8 }}>
            Insira seu endereço ou CEP
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inputLocal}
              onChange={e => setInputLocal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              placeholder="Ex.: Rua São João, 134 ou 78550-000"
              style={{
                flex: 1, padding: '13px 16px', borderRadius: 10,
                border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none',
                fontFamily: 'inherit', color: CORES.feldgrau,
              }}
            />
            <button onClick={handleBuscar} disabled={buscando} style={{
              background: CORES.feldgrau, color: CORES.peach, border: 'none',
              borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>{buscando ? '...' : 'Buscar'}</button>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginBottom: 16 }}>ou</div>

        <button onClick={handleGeolocalizacao} disabled={buscandoGeo} style={{
          width: '100%', background: CORES.feldgrau, color: '#fff', border: 'none',
          borderRadius: 12, padding: '15px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span>📍</span> {buscandoGeo ? 'Obtendo localização...' : 'Usar minha localização'}
        </button>

        {erroLocal && (
          <div style={{ color: CORES.danger, fontSize: 13, background: '#fff0f0', padding: '10px 14px', borderRadius: 10, marginTop: 8 }}>
            {erroLocal}
          </div>
        )}
      </div>
    </div>
  )
}

function StepAddressConfirm({ initialAddress, onBack, onSave }) {
  const [form, setForm] = useState({ ...initialAddress })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSalvar = () => {
    if (!form.logradouro.trim()) return
    onSave(form)
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none', fontFamily: 'inherit',
    color: CORES.feldgrau, background: '#fff',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: '#fff', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: CORES.feldgrau }}>←</button>
        <div style={{ fontWeight: 800, fontSize: 18, color: CORES.feldgrau }}>Novo Endereço</div>
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: CORES.feldgrau, marginBottom: 20 }}>
          Em qual endereço você deseja receber seu pedido?
        </div>

        {form.logradouro && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, padding: '12px 14px', background: CORES.offwhite, borderRadius: 12 }}>
            <span>📍</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau }}>{form.logradouro}</div>
              {(form.cidade || form.cep) && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                  {[form.bairro, form.cidade, form.estado, form.cep].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Endereço</label>
          <input style={inputStyle} value={form.logradouro} onChange={e => set('logradouro', e.target.value)} placeholder="Rua, Avenida..." />
        </div>

        <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Número *</label>
            <input style={inputStyle} value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="123" inputMode="numeric" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: CORES.feldgrau, cursor: 'pointer', paddingBottom: 14 }}>
              <input type="checkbox" checked={form.numero === 's/n'} onChange={e => set('numero', e.target.checked ? 's/n' : '')} />
              Sem número
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Complemento</label>
          <input style={inputStyle} value={form.complemento} onChange={e => set('complemento', e.target.value)} placeholder="Casa, Apto, Sala X..." />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Ponto de referência</label>
          <input style={inputStyle} value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Em frente ao..." />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 10 }}>Nome do endereço</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Casa', 'Trabalho', 'Amigos'].map(l => (
              <button key={l} onClick={() => set('label', l)} style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                fontWeight: 600, border: `1.5px solid ${form.label === l ? CORES.feldgrau : '#d1d5db'}`,
                background: form.label === l ? CORES.peach : '#fff',
                color: CORES.feldgrau,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSalvar} style={{
          width: '100%', background: CORES.feldgrau, color: CORES.peach,
          border: 'none', borderRadius: 14, padding: '15px 0',
          fontWeight: 800, fontSize: 16, cursor: 'pointer',
        }}>Salvar</button>
      </div>
    </div>
  )
}

function StepPayment({ modoEntrega, endConfirmado, itens, subtotal, total, taxaEntrega, onBack, onConfirmar, loading, erro }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [obsGeral, setObsGeral] = useState('')

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none',
    fontFamily: 'inherit', color: CORES.feldgrau, background: '#fff',
  }

  const handleConfirmar = () => {
    onConfirmar({ nome, telefone, pagamento, obs: obsGeral })
  }

  const modoLabel = {
    delivery: 'Entrega em domicílio',
    pickup: 'Retirada no local',
    local: 'Consumo no local',
  }[modoEntrega]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1400, background: CORES.offwhite, overflowY: 'auto' }}>
      <div style={{ background: CORES.feldgrau }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: CORES.peach }}>←</button>
          <div style={{ fontWeight: 800, fontSize: 18, color: CORES.peach }}>Finalizar pedido</div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        {/* Modo de entrega */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Modo de entrega</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: CORES.feldgrau }}>{modoLabel}</div>
            {modoEntrega === 'delivery' && endConfirmado.logradouro && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {[endConfirmado.logradouro, endConfirmado.numero, endConfirmado.complemento].filter(Boolean).join(', ')}
                {endConfirmado.referencia && <span style={{ color: '#999' }}> · {endConfirmado.referencia}</span>}
              </div>
            )}
          </div>
          <button onClick={onBack} style={{
            background: 'none', border: `1.5px solid ${CORES.feldgrau}`, borderRadius: 8,
            padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: CORES.feldgrau,
          }}>Trocar</button>
        </div>

        {/* Dados do cliente */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#999', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Seus dados</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Nome *</label>
            <input style={inputStyle} placeholder="Como você se chama?" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>WhatsApp *</label>
            <input style={inputStyle} placeholder="(66) 99999-9999" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} inputMode="numeric" />
          </div>
        </div>

        {/* Forma de pagamento */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ background: CORES.feldgrau, padding: '12px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: CORES.peach }}>Escolha a forma de pagamento</div>
          </div>
          {[
            { k: 'Pix', icon: '💠', sub: 'Pague agora' },
            { k: 'Dinheiro', icon: '💵', sub: 'Pagar na entrega' },
            { k: 'Cartão Crédito', icon: '💳', sub: 'Maquininha na entrega' },
            { k: 'Cartão Débito', icon: '💳', sub: 'Maquininha na entrega' },
          ].map(({ k, icon, sub }, idx, arr) => (
            <button key={k} onClick={() => setPagamento(k)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: pagamento === k ? '#f0f9f1' : '#fff',
              border: 'none', borderBottom: idx < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau }}>{k}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{sub}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', border: `2px solid ${pagamento === k ? CORES.asparagus : '#d1d5db'}`,
                background: pagamento === k ? CORES.asparagus : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pagamento === k && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Observações */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>Observações (opcional)</label>
          <textarea
            style={{ ...inputStyle, height: 72, resize: 'none' }}
            placeholder="Algum detalhe adicional para o pedido?"
            value={obsGeral}
            onChange={e => setObsGeral(e.target.value)}
          />
        </div>

        {/* Totais */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: CORES.feldgrau, marginBottom: 8 }}>
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {modoEntrega === 'delivery' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: CORES.feldgrau, marginBottom: 8 }}>
              <span>Taxa de entrega</span>
              <span>{fmt(taxaEntrega)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: CORES.feldgrau }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: CORES.asparagus }}>{fmt(total)}</span>
          </div>
        </div>

        {erro && (
          <div style={{
            background: '#fff0f0', border: `1px solid ${CORES.danger}`, color: CORES.danger,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14, fontWeight: 600,
          }}>⚠️ {erro}</div>
        )}

        <button onClick={handleConfirmar} disabled={loading} style={{
          width: '100%', background: loading ? '#9ca3af' : CORES.feldgrau,
          color: CORES.peach, border: 'none', borderRadius: 14, padding: '15px 0',
          fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Enviando...' : '✓ Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  CHECKOUT FLOW (orchestrator — no nested components)
// ════════════════════════════════════════════════════════════════════════════

function CheckoutFlow({ cart, products, onBack, onSuccess }) {
  const [step, setStep] = useState('delivery')          // delivery | address | address-confirm | payment
  const [modoEntrega, setModoEntrega] = useState(null)  // 'delivery' | 'pickup' | 'local'
  const [endConfirmado, setEndConfirmado] = useState({
    logradouro: '', numero: '', complemento: '', referencia: '', label: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const subtotal = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const p = products.find(x => String(x.id) === String(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, products])

  const taxaEntrega = modoEntrega === 'delivery' ? TAXA_ENTREGA : 0
  const total = subtotal + taxaEntrega

  const itens = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const p = products.find(x => String(x.id) === String(id))
      return p ? { produto: p.nome, qty, unitPrice: p.preco } : null
    })
    .filter(Boolean)

  const handleSelectDelivery = (key) => {
    setModoEntrega(key)
    if (key === 'delivery') setStep('address')
    else setStep('payment')
  }

  const handleAddressFound = (endData) => {
    setEndConfirmado(endData)
    setStep('address-confirm')
  }

  const handleAddressSave = (form) => {
    setEndConfirmado(form)
    setStep('payment')
  }

  const handleConfirmar = async ({ nome, telefone, pagamento, obs }) => {
    if (!nome.trim()) { setErro('Informe seu nome'); return }
    if (telefone.replace(/\D/g, '').length < 10) { setErro('Informe um WhatsApp válido'); return }
    if (!pagamento) { setErro('Escolha a forma de pagamento'); return }
    setLoading(true)
    setErro('')
    const enderecoStr = modoEntrega === 'delivery'
      ? [endConfirmado.logradouro, endConfirmado.numero, endConfirmado.complemento, endConfirmado.referencia].filter(Boolean).join(', ')
      : modoEntrega === 'pickup' ? 'Retirar no local' : 'Consumir no local'
    const result = await registrarPedido({
      itens,
      clientName: nome.trim(),
      phone: telefone.replace(/\D/g, ''),
      deliveryDate: null,
      payment: pagamento,
      notes: ['[Menu Online]', `Entrega: ${enderecoStr}`, obs].filter(Boolean).join(' | '),
      canal: 'direto',
    })
    setLoading(false)
    if (result?.success) {
      onSuccess(result.numeroPedido, nome.trim(), itens, total)
    } else {
      setErro('Erro ao registrar pedido. Tente novamente ou entre em contato pelo WhatsApp.')
    }
  }

  if (step === 'delivery') {
    return (
      <StepDelivery
        itens={itens}
        subtotal={subtotal}
        onBack={onBack}
        onSelect={handleSelectDelivery}
      />
    )
  }

  if (step === 'address') {
    return (
      <StepAddress
        onBack={() => setStep('delivery')}
        onFound={handleAddressFound}
      />
    )
  }

  if (step === 'address-confirm') {
    return (
      <StepAddressConfirm
        initialAddress={endConfirmado}
        onBack={() => setStep('address')}
        onSave={handleAddressSave}
      />
    )
  }

  if (step === 'payment') {
    return (
      <StepPayment
        modoEntrega={modoEntrega}
        endConfirmado={endConfirmado}
        itens={itens}
        subtotal={subtotal}
        total={total}
        taxaEntrega={taxaEntrega}
        onBack={() => setStep(modoEntrega === 'delivery' ? 'address-confirm' : 'delivery')}
        onConfirmar={handleConfirmar}
        loading={loading}
        erro={erro}
      />
    )
  }

  return null
}

// ════════════════════════════════════════════════════════════════════════════
//  TELA DE SUCESSO
// ════════════════════════════════════════════════════════════════════════════

function SuccessScreen({ numeroPedido, nome, itens, total, onNew }) {
  const msg = encodeURIComponent(
    `Olá! Acabei de fazer um pedido pelo site 🎉\n\n` +
    `Pedido: *${numeroPedido}*\n` +
    `Nome: *${nome}*\n\n` +
    itens.map(i => `• ${i.qty}× ${i.produto} — ${fmt(i.unitPrice * i.qty)}`).join('\n') +
    `\n\n*Total: ${fmt(total)}*`
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: CORES.offwhite, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 24, color: CORES.feldgrau, marginBottom: 8 }}>Pedido recebido!</div>
      <div style={{ fontSize: 15, color: '#666', marginBottom: 4 }}>Obrigada, <strong>{nome}</strong>! 💛</div>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '10px 20px', margin: '16px 0',
        fontSize: 14, color: CORES.feldgrau, fontWeight: 600,
      }}>{numeroPedido}</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>
        Entraremos em contato pelo WhatsApp para confirmar.
      </div>
      <a href={`https://wa.me/${WHATSAPP}?text=${msg}`} target="_blank" rel="noreferrer"
        style={{
          display: 'block', width: '100%', background: '#25D366', color: '#fff',
          borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: 16,
          textDecoration: 'none', marginBottom: 12,
        }}>
        💬 Falar no WhatsApp
      </a>
      <button onClick={onNew} style={{
        width: '100%', background: 'transparent', color: CORES.feldgrau,
        border: `2px solid ${CORES.feldgrau}`, borderRadius: 14, padding: '13px 0',
        fontWeight: 700, fontSize: 15, cursor: 'pointer',
      }}>Fazer novo pedido</button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function MenuPage() {
  const [cart, setCart]             = useState({})
  const [cartOpen, setCartOpen]     = useState(false)
  const [checkout, setCheckout]     = useState(false)
  const [success, setSuccess]       = useState(null)
  const [activecat, setActivecat]   = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)

  useEffect(() => {
    listarProdutos({ apenasAtivos: true }).then(data => {
      setAllProducts(data.map(p => ({ ...p, foto: p.foto_url || '' })))
      setLoadingMenu(false)
    })
  }, [])

  const totalQty = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart])
  const totalVal = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const p = allProducts.find(x => x.id === Number(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, allProducts])

  const add    = (item) => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
  const remove = (item) => setCart(c => {
    const n = { ...c, [item.id]: (c[item.id] || 0) - 1 }
    if (n[item.id] <= 0) delete n[item.id]
    return n
  })

  const handleSuccess = (numeroPedido, nome, itensCheckout, totalCheckout) => {
    setSuccess({ numeroPedido, nome, itens: itensCheckout, total: totalCheckout })
    setCart({})
    setCheckout(false)
    setCartOpen(false)
  }

  const whatsappKitFesta = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Olá! Gostaria de saber mais sobre o *Kit Festa* da PiTa Doceria! 🎂🎉'
  )}`

  if (success) {
    return (
      <SuccessScreen
        numeroPedido={success.numeroPedido}
        nome={success.nome}
        itens={success.itens}
        total={success.total}
        onNew={() => setSuccess(null)}
      />
    )
  }

  if (checkout) {
    return (
      <CheckoutFlow
        cart={cart}
        products={allProducts}
        onBack={() => setCheckout(false)}
        onSuccess={handleSuccess}
      />
    )
  }

  const categorias = useMemo(() => {
    const ordem = ['Tortas', 'Doces', 'Lanche', 'Bebidas', 'Outros']
    const grupos = {}
    allProducts.forEach(p => {
      const cat = p.categoria || 'Outros'
      if (!grupos[cat]) grupos[cat] = []
      grupos[cat].push(p)
    })
    return ordem
      .filter(c => grupos[c])
      .map(c => ({ categoria: c, emoji: EMOJI_CAT[c] || '🍽️', itens: grupos[c] }))
      .concat(
        Object.keys(grupos).filter(c => !ordem.includes(c))
          .map(c => ({ categoria: c, emoji: '🍽️', itens: grupos[c] }))
      )
  }, [allProducts])

  const categoriasVisiveis = activecat ? categorias.filter(c => c.categoria === activecat) : categorias

  return (
    <div style={{ minHeight: '100vh', background: CORES.offwhite, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: CORES.feldgrau, padding: '16px 20px 14px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.svg" alt="PiTa Doceria" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} />
                <span style={{ fontWeight: 900, fontSize: 20, color: CORES.peach, letterSpacing: 0.5 }}>Doceria</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>Aberto · Sem pedido mínimo</div>
            </div>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"
              style={{ background: '#25D366', color: '#fff', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              💬 Falar
            </a>
          </div>
        </div>
      </div>

      {/* Banner Kit Festa */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>
        <a href={whatsappKitFesta} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div style={{
            background: `linear-gradient(135deg, ${CORES.feldgrau} 0%, #3a4a3c 100%)`,
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          }}>
            <span style={{ fontSize: 36 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: CORES.peach }}>Kit Festa</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Monte sua festa dos sonhos! Fale com a gente no WhatsApp →</div>
            </div>
          </div>
        </a>
      </div>

      {/* Filtro */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          <button onClick={() => setActivecat(null)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            background: activecat === null ? CORES.feldgrau : '#fff',
            color: activecat === null ? CORES.peach : CORES.feldgrau,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>Todos</button>
          {categorias.map(c => (
            <button key={c.categoria} onClick={() => setActivecat(c.categoria)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              background: activecat === c.categoria ? CORES.feldgrau : '#fff',
              color: activecat === c.categoria ? CORES.peach : CORES.feldgrau,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>{c.emoji} {c.categoria}</button>
          ))}
        </div>
      </div>

      {/* Cardápio */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 120px' }}>
        {loadingMenu && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🍰</div>
            <div style={{ fontSize: 14 }}>Carregando cardápio...</div>
          </div>
        )}
        {categoriasVisiveis.map(cat => (
          <div key={cat.categoria} style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: CORES.feldgrau, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {cat.emoji} {cat.categoria}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
              {cat.itens.map(item => (
                <ProductCard
                  key={item.id} item={item}
                  qty={cart[item.id] || 0}
                  onAdd={add} onRemove={remove}
                  onOpenDetail={setDetailItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Aviso de entrega */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 32px' }}>
        <div style={{ background: CORES.feldgrau, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: CORES.peach, textTransform: 'uppercase', letterSpacing: 0.5 }}>Área de entrega</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              Entregas realizadas <strong style={{ color: CORES.peach }}>APENAS para a cidade de Sinop – MT</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Barra carrinho */}
      {totalQty > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, padding: '12px 16px 20px', background: 'transparent' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button onClick={() => setCartOpen(true)} style={{
              width: '100%', background: CORES.feldgrau, color: CORES.peach,
              border: 'none', borderRadius: 16, padding: '14px 20px',
              fontWeight: 800, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}>
              <span style={{ background: CORES.peach, color: CORES.feldgrau, borderRadius: 8, padding: '2px 10px', fontSize: 14, fontWeight: 800 }}>{totalQty}</span>
              <span>Ver carrinho</span>
              <span style={{ fontWeight: 800 }}>{fmt(totalVal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Drawer detalhe */}
      {detailItem && (
        <ProductDetailDrawer
          item={detailItem} qty={cart[detailItem.id] || 0}
          onAdd={add} onRemove={remove}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Carrinho drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart} products={allProducts}
          onAdd={add} onRemove={remove}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckout(true) }}
        />
      )}
    </div>
  )
}
