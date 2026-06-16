import { useState, useMemo } from 'react'
import { registrarPedido } from '../services/supabase-integration'

// ── Configuração da loja ────────────────────────────────────────────────────
// ALTERE AQUI o número do WhatsApp da loja (somente dígitos, com DDI 55)
const WHATSAPP = '5566996799565'

const CORES = {
  feldgrau:  '#525F54',
  peach:     '#FABD97',
  asparagus: '#6CAE75',
  offwhite:  '#F5F0EB',
  danger:    '#E05C5C',
}

// ── Cardápio ────────────────────────────────────────────────────────────────
// foto: coloque a URL da imagem quando tiver. Ex: 'https://...'
// descricao: edite livremente
const CDN = 'https://client-assets.anota.ai/produtos/654809e6c88d180012064a77'

const CARDAPIO = [
  {
    categoria: 'Tortas',
    emoji: '🎂',
    itens: [
      {
        id: 1,
        nome: 'Bolo Fatia Cenoura e Brownie',
        descricao: 'Massa de cenoura com recheio de brigadeiro gourmet e Brownie',
        preco: 22.96,
        foto: `${CDN}/-1781180508767blob_600.webp`,
      },
      {
        id: 2,
        nome: 'Bolo Fatia Tapioca',
        descricao: 'Bolo de Tapioca recheado com Doce de Leite e Cocada Cremosa',
        preco: 22.50,
        foto: `${CDN}/-1781180678693blob_600.webp`,
      },
      {
        id: 3,
        nome: 'Browninho',
        descricao: 'Brownie com palha de leite ninho',
        preco: 15.00,
        foto: `${CDN}/-1781181649099blob_600.webp`,
      },
    ],
  },
  {
    categoria: 'Doces',
    emoji: '🍪',
    itens: [
      {
        id: 4,
        nome: 'Cookies Pita',
        descricao: 'Massa Baunilha com Cranberry, Amêndoas Laminadas, Gotas de Chocolate meio amargo e recheado com Chocolate meio amargo',
        preco: 18.00,
        foto: `${CDN}/-1781622537717blob_600.webp`,
      },
    ],
  },
  {
    categoria: 'Lanche',
    emoji: '🥐',
    itens: [
      {
        id: 5,
        nome: 'Mini Salgado Sortindo 50 unidades',
        descricao: 'Enroladinho de salsinha, bolinha de queijo, quibe, coxinha de frango, coxinha de carne e trouxinha de presunto queijo',
        preco: 55.00,
        foto: `${CDN}/-1781556960760blob_600.webp`,
      },
      {
        id: 6,
        nome: 'Mini Salgado Sortindo 100 unidades',
        descricao: 'Enroladinho de salsinha, bolinha de queijo, quibe, coxinha de frango, coxinha de carne e trouxinha de presunto queijo',
        preco: 105.00,
        foto: `${CDN}/-1781556960760blob_600.webp`,
      },
    ],
  },
  {
    categoria: 'Bebidas',
    emoji: '🥤',
    itens: [
      {
        id: 7,
        nome: 'Coca Cola 310ml',
        descricao: '',
        preco: 6.00,
        foto: `${CDN}/-1781558664736blob_600.webp`,
      },
      {
        id: 8,
        nome: 'Coca Cola Zero 310ml',
        descricao: '',
        preco: 6.00,
        foto: `${CDN}/-1781558634667blob_600.webp`,
      },
      {
        id: 9,
        nome: 'Sprite 310ml',
        descricao: '',
        preco: 6.00,
        foto: `${CDN}/-1781558600889blob_600.webp`,
      },
      {
        id: 10,
        nome: 'Fanta Uva 310ml',
        descricao: '',
        preco: 6.00,
        foto: `${CDN}/-1781558563871blob_600.webp`,
      },
      {
        id: 11,
        nome: 'Guaraná Antártica',
        descricao: '',
        preco: 5.00,
        foto: `${CDN}/-1781558740100blob_600.webp`,
      },
      {
        id: 12,
        nome: 'Água Mineral Puríssima 497ml',
        descricao: '',
        preco: 4.00,
        foto: `${CDN}/-1781558801716blob_600.webp`,
      },
    ],
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const maskPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return v
}

// ── Componentes ──────────────────────────────────────────────────────────────

function ProductDetailDrawer({ item, qty, onAdd, onRemove, onClose }) {
  const [obs, setObs] = useState('')
  const [localQty, setLocalQty] = useState(qty || 1)

  const handleAdicionar = () => {
    for (let i = 0; i < localQty; i++) onAdd({ ...item, obs })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', flexDirection: 'column' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />

      {/* Painel deslizante de baixo */}
      <div style={{
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      }}>
        {/* Foto grande */}
        <div style={{ position: 'relative', height: 240, background: '#f3ede7', flexShrink: 0 }}>
          {item.foto ? (
            <img src={item.foto} alt={item.nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 72 }}>🍰</span>
            </div>
          )}
          {/* Botão fechar */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 14,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 0' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: CORES.feldgrau, lineHeight: 1.3 }}>
            {item.nome}
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: CORES.asparagus, marginTop: 6 }}>
            {fmt(item.preco)}
          </div>
          {item.descricao && (
            <div style={{ fontSize: 14, color: '#666', marginTop: 10, lineHeight: 1.6 }}>
              {item.descricao}
            </div>
          )}

          {/* Observação */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
              💬 Alguma observação?
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Ex: sem amendoas, ponto da carne, sabor preferido..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 10, border: '1.5px solid #d1d5db',
                fontSize: 14, resize: 'none', height: 80, fontFamily: 'inherit',
                color: CORES.feldgrau, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Rodapé fixo: qtd + adicionar */}
        <div style={{ padding: '16px 20px 28px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Controle de qtd */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: CORES.offwhite, borderRadius: 12, padding: '6px 12px' }}>
              <button onClick={() => setLocalQty(q => Math.max(1, q - 1))} style={{
                width: 30, height: 30, borderRadius: 8,
                border: `2px solid ${CORES.peach}`, background: 'white',
                fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, minWidth: 24, textAlign: 'center', color: CORES.feldgrau }}>
                {localQty}
              </span>
              <button onClick={() => setLocalQty(q => q + 1)} style={{
                width: 30, height: 30, borderRadius: 8,
                background: CORES.peach, border: 'none',
                fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              }}>+</button>
            </div>

            {/* Botão adicionar */}
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
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Foto clicável */}
      <div onClick={() => onOpenDetail(item)} style={{
        background: item.foto ? 'transparent' : '#f3ede7',
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}>
        {item.foto ? (
          <img src={item.foto} alt={item.nome}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: '#bbb' }}>
            <div style={{ fontSize: 40 }}>🍰</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>sem foto</div>
          </div>
        )}
        {/* Indicador de toque */}
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          background: 'rgba(0,0,0,0.35)', borderRadius: 6,
          padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600,
        }}>ver mais</div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: CORES.feldgrau, lineHeight: 1.3 }}>
          {item.nome}
        </div>
        {item.descricao && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.descricao}
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 17, color: CORES.asparagus, marginTop: 8 }}>
          {fmt(item.preco)}
        </div>
      </div>

      {/* Controle de quantidade */}
      <div style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {qty === 0 ? (
          <button onClick={() => onOpenDetail(item)} style={{
            flex: 1,
            background: CORES.peach,
            color: CORES.feldgrau,
            border: 'none',
            borderRadius: 10,
            padding: '9px 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}>
            + Adicionar
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <button onClick={() => onRemove(item)} style={{
              width: 34, height: 34, borderRadius: 10,
              border: `2px solid ${CORES.peach}`, background: 'white',
              fontWeight: 700, fontSize: 18, cursor: 'pointer', color: CORES.feldgrau,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: 'center', color: CORES.feldgrau }}>
              {qty}
            </span>
            <button onClick={() => onAdd(item)} style={{
              width: 34, height: 34, borderRadius: 10,
              background: CORES.peach, border: 'none',
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
      const p = products.find(x => x.id === Number(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, products])

  const items = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({
    ...products.find(x => x.id === Number(id)), qty,
  }))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        flex: 1, background: 'rgba(0,0,0,0.4)',
      }} />

      {/* Painel */}
      <div style={{
        background: CORES.offwhite,
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 0',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: CORES.feldgrau }}>
            🛒 Seu Carrinho
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1.5px solid ${CORES.feldgrau}`, borderRadius: 10,
            padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: CORES.feldgrau,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            ← Continuar comprando
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#fff', borderRadius: 12, padding: '10px 14px',
              marginBottom: 10,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: CORES.feldgrau }}>{item.nome}</div>
                <div style={{ fontSize: 13, color: CORES.asparagus, fontWeight: 700 }}>{fmt(item.preco)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onRemove(item)} style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: `2px solid ${CORES.peach}`, background: 'white',
                  fontWeight: 700, fontSize: 16, cursor: 'pointer', color: CORES.feldgrau,
                }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center', color: CORES.feldgrau }}>
                  {item.qty}
                </span>
                <button onClick={() => onAdd(item)} style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: CORES.peach, border: 'none',
                  fontWeight: 700, fontSize: 16, cursor: 'pointer', color: CORES.feldgrau,
                }}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, minWidth: 60, textAlign: 'right' }}>
                {fmt(item.preco * item.qty)}
              </div>
            </div>
          ))}
        </div>

        {/* Total + Finalizar */}
        <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: 16, marginTop: 8, paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: CORES.feldgrau }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: CORES.asparagus }}>{fmt(total)}</span>
          </div>
          <button onClick={onCheckout} style={{
            width: '100%', background: CORES.feldgrau, color: CORES.peach,
            border: 'none', borderRadius: 14, padding: '14px 0',
            fontWeight: 800, fontSize: 16, cursor: 'pointer', letterSpacing: 0.3,
            marginBottom: 10,
          }}>
            Finalizar Pedido →
          </button>
          <button onClick={onClose} style={{
            width: '100%', background: 'transparent', color: CORES.feldgrau,
            border: `1.5px solid ${CORES.feldgrau}`, borderRadius: 14, padding: '12px 0',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            ← Continuar comprando
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckoutModal({ cart, products, onBack, onSuccess }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [entrega, setEntrega] = useState('')
  const [pagamento, setPagamento] = useState('Pix')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const total = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const p = products.find(x => x.id === Number(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, products])

  const itens = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => {
    const p = products.find(x => x.id === Number(id))
    return { produto: p.nome, qty, unitPrice: p.preco }
  })

  const handleSubmit = async () => {
    if (!nome.trim()) { setErro('Informe seu nome'); return }
    if (telefone.replace(/\D/g, '').length < 10) { setErro('Informe um WhatsApp válido'); return }
    setLoading(true)
    setErro('')
    const result = await registrarPedido({
      itens,
      clientName:   nome.trim(),
      phone:        telefone.replace(/\D/g, ''),
      deliveryDate: entrega || null,
      payment:      pagamento,
      notes:        obs.trim() ? `[Menu Online] ${obs.trim()}` : '[Menu Online]',
      canal:        'direto',
    })
    setLoading(false)
    if (result?.success) {
      onSuccess(result.numeroPedido)
    } else {
      setErro('Erro ao registrar pedido. Tente novamente ou entre em contato pelo WhatsApp.')
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #d1d5db', fontSize: 15, background: '#fff',
    outline: 'none', boxSizing: 'border-box', color: CORES.feldgrau,
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: CORES.offwhite, overflowY: 'auto',
      padding: '20px 20px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: CORES.feldgrau,
          padding: 4,
        }}>←</button>
        <div style={{ fontWeight: 800, fontSize: 20, color: CORES.feldgrau }}>Finalizar Pedido</div>
      </div>

      {/* Resumo */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Resumo do pedido
        </div>
        {itens.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: CORES.feldgrau }}>
            <span>{item.qty}× {item.produto}</span>
            <span style={{ fontWeight: 600 }}>{fmt(item.unitPrice * item.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: CORES.feldgrau }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: CORES.asparagus }}>{fmt(total)}</span>
        </div>
      </div>

      {/* Dados do cliente */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
          Seu nome *
        </label>
        <input
          style={inputStyle}
          placeholder="Como você se chama?"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
          WhatsApp *
        </label>
        <input
          style={inputStyle}
          placeholder="(11) 99999-9999"
          value={telefone}
          onChange={e => setTelefone(maskPhone(e.target.value))}
          inputMode="numeric"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
          Data de entrega
        </label>
        <input
          type="date"
          style={inputStyle}
          value={entrega}
          onChange={e => setEntrega(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
          Forma de pagamento
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Pix', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito'].map(op => (
            <button key={op} onClick={() => setPagamento(op)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              background: pagamento === op ? CORES.peach : '#fff',
              border: pagamento === op ? `2px solid ${CORES.feldgrau}` : '2px solid #d1d5db',
              color: CORES.feldgrau,
            }}>
              {op}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: CORES.feldgrau, display: 'block', marginBottom: 6 }}>
          Observações
        </label>
        <textarea
          style={{ ...inputStyle, height: 80, resize: 'none' }}
          placeholder="Alguma observação sobre o pedido? (opcional)"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />
      </div>

      {erro && (
        <div style={{
          background: '#fff0f0', border: `1px solid ${CORES.danger}`, color: CORES.danger,
          borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14, fontWeight: 600,
        }}>
          ⚠️ {erro}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%', background: loading ? '#9ca3af' : CORES.feldgrau,
        color: CORES.peach, border: 'none', borderRadius: 14, padding: '15px 0',
        fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
        letterSpacing: 0.3,
      }}>
        {loading ? 'Enviando...' : '✓ Confirmar Pedido'}
      </button>
    </div>
  )
}

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
      position: 'fixed', inset: 0, zIndex: 1200,
      background: CORES.offwhite, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 24, color: CORES.feldgrau, marginBottom: 8 }}>
        Pedido recebido!
      </div>
      <div style={{ fontSize: 15, color: '#666', marginBottom: 4 }}>
        Obrigada, <strong>{nome}</strong>! 💛
      </div>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '10px 20px', margin: '16px 0',
        fontSize: 14, color: CORES.feldgrau, fontWeight: 600,
      }}>
        {numeroPedido}
      </div>
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
      }}>
        Fazer novo pedido
      </button>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function MenuPage() {
  const [cart, setCart]           = useState({})
  const [cartOpen, setCartOpen]       = useState(false)
  const [checkout, setCheckout]       = useState(false)
  const [success, setSuccess]         = useState(null)
  const [activecat, setActivecat]     = useState(null)
  const [detailItem, setDetailItem]   = useState(null)

  const allProducts = useMemo(() =>
    CARDAPIO.flatMap(c => c.itens), [])

  const totalQty = useMemo(() =>
    Object.values(cart).reduce((a, b) => a + b, 0), [cart])

  const totalVal = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const p = allProducts.find(x => x.id === Number(id))
      return s + (p ? p.preco * qty : 0)
    }, 0), [cart, allProducts])

  const add = (item) =>
    setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))

  const remove = (item) =>
    setCart(c => {
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
      <CheckoutModal
        cart={cart}
        products={allProducts}
        onBack={() => setCheckout(false)}
        onSuccess={(numPed) => {
          const itensCheckout = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => {
            const p = allProducts.find(x => x.id === Number(id))
            return { produto: p.nome, qty, unitPrice: p.preco }
          })
          const totalCheckout = itensCheckout.reduce((s, i) => s + i.unitPrice * i.qty, 0)
          const nomeEl = document.querySelector('input[placeholder="Como você se chama?"]')
          const nomeVal = nomeEl?.value || 'Cliente'
          handleSuccess(numPed, nomeVal, itensCheckout, totalCheckout)
        }}
      />
    )
  }

  const categoriasVisiveis = activecat
    ? CARDAPIO.filter(c => c.categoria === activecat)
    : CARDAPIO

  return (
    <div style={{ minHeight: '100vh', background: CORES.offwhite, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: CORES.feldgrau,
        padding: '16px 20px 14px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/logo.svg"
                  alt="PiTa Doceria"
                  style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }}
                />
                <span style={{ fontWeight: 900, fontSize: 20, color: CORES.peach, letterSpacing: 0.5 }}>
                  Doceria
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                Aberto · Sem pedido mínimo
              </div>
            </div>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"
              style={{
                background: '#25D366', color: '#fff', borderRadius: 10, padding: '7px 14px',
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
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
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Monte sua festa dos sonhos! Fale com a gente no WhatsApp →
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Filtro por categoria */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          <button onClick={() => setActivecat(null)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            background: activecat === null ? CORES.feldgrau : '#fff',
            color: activecat === null ? CORES.peach : CORES.feldgrau,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            Todos
          </button>
          {CARDAPIO.map(c => (
            <button key={c.categoria} onClick={() => setActivecat(c.categoria)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              background: activecat === c.categoria ? CORES.feldgrau : '#fff',
              color: activecat === c.categoria ? CORES.peach : CORES.feldgrau,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              {c.emoji} {c.categoria}
            </button>
          ))}
        </div>
      </div>

      {/* Cardápio */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 120px' }}>
        {categoriasVisiveis.map(cat => (
          <div key={cat.categoria} style={{ marginBottom: 28 }}>
            <div style={{
              fontWeight: 800, fontSize: 18, color: CORES.feldgrau,
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {cat.emoji} {cat.categoria}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: 12,
            }}>
              {cat.itens.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  qty={cart[item.id] || 0}
                  onAdd={add}
                  onRemove={remove}
                  onOpenDetail={setDetailItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Aviso de entrega */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 32px' }}>
        <div style={{
          background: CORES.feldgrau,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: CORES.peach, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Área de entrega
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              Entregas realizadas <strong style={{ color: CORES.peach }}>APENAS para a cidade de Sinop – MT</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de carrinho */}
      {totalQty > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          padding: '12px 16px 20px',
          background: 'transparent',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button onClick={() => setCartOpen(true)} style={{
              width: '100%',
              background: CORES.feldgrau,
              color: CORES.peach,
              border: 'none',
              borderRadius: 16,
              padding: '14px 20px',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}>
              <span style={{
                background: CORES.peach, color: CORES.feldgrau,
                borderRadius: 8, padding: '2px 10px', fontSize: 14, fontWeight: 800,
              }}>
                {totalQty}
              </span>
              <span>Ver carrinho</span>
              <span style={{ fontWeight: 800 }}>{fmt(totalVal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Drawer detalhe do produto */}
      {detailItem && (
        <ProductDetailDrawer
          item={detailItem}
          qty={cart[detailItem.id] || 0}
          onAdd={add}
          onRemove={remove}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Carrinho drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          products={allProducts}
          onAdd={add}
          onRemove={remove}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckout(true) }}
        />
      )}
    </div>
  )
}
