import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { listarProdutos, salvarProduto, excluirProduto, uploadFotoProduto } from '../services/supabase-integration'

const C = {
  feldgrau:  '#525F54',
  peach:     '#FABD97',
  asparagus: '#6CAE75',
  offWhite:  '#FAF8F5',
  grayLt:    '#f0ede8',
  danger:    '#E05C5C',
}

const CATEGORIAS = ['Tortas', 'Doces', 'Lanche', 'Bebidas', 'Outros']

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const EMPTY = { nome: '', descricao: '', preco: '', categoria: 'Tortas', foto_url: '', ativo: true, ordem: 0 }

function ProdutoForm({ inicial, onSalvar, onCancelar }) {
  const [form, setForm]       = useState(inicial || EMPTY)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro]       = useState('')
  const fileRef               = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const res = await uploadFotoProduto(file)
    setUploading(false)
    if (res.error) setErro('Erro ao enviar foto: ' + res.error)
    else set('foto_url', res.url)
  }

  const handleSalvar = async () => {
    if (!form.nome.trim()) { setErro('Informe o nome do produto'); return }
    if (!form.preco)        { setErro('Informe o preço');           return }
    setLoading(true); setErro('')
    const res = await salvarProduto(form)
    setLoading(false)
    if (res.error) setErro(res.error)
    else onSalvar()
  }

  const inp = {
    padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db',
    fontSize: 14, width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', color: C.feldgrau, outline: 'none',
    background: '#fff',
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.feldgrau, marginBottom: 16 }}>
        {inicial?.id ? '✏️ Editar Produto' : '➕ Novo Produto'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Nome */}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.feldgrau, display: 'block', marginBottom: 4 }}>Nome *</label>
          <input style={inp} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Bolo Fatia Cenoura" />
        </div>

        {/* Categoria */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.feldgrau, display: 'block', marginBottom: 4 }}>Categoria *</label>
          <select style={inp} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Preço */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.feldgrau, display: 'block', marginBottom: 4 }}>Preço (R$) *</label>
          <input style={inp} type="number" step="0.01" min="0" value={form.preco} onChange={e => set('preco', e.target.value)} placeholder="0,00" />
        </div>

        {/* Descrição */}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.feldgrau, display: 'block', marginBottom: 4 }}>Descrição</label>
          <textarea style={{ ...inp, height: 72, resize: 'none' }} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ingredientes, detalhes do produto..." />
        </div>

        {/* Foto */}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.feldgrau, display: 'block', marginBottom: 4 }}>Foto</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Preview */}
            <div style={{
              width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              background: C.grayLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              {form.foto_url
                ? <img src={form.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🍰'
              }
            </div>
            <div style={{ flex: 1 }}>
              {/* Upload */}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: `1.5px dashed ${C.feldgrau}`, background: C.grayLt,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', color: C.feldgrau, marginBottom: 8,
              }}>
                <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar foto do dispositivo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              {/* URL manual */}
              <input style={{ ...inp, fontSize: 12 }} value={form.foto_url} onChange={e => set('foto_url', e.target.value)} placeholder="Ou cole aqui a URL da foto..." />
            </div>
          </div>
        </div>

        {/* Ativo */}
        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.feldgrau }}>
            Exibir no cardápio online
          </label>
          <button onClick={() => set('ativo', !form.ativo)} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: form.ativo ? C.asparagus : '#ccc', position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: form.ativo ? 23 : 3, transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: 12, color: form.ativo ? C.asparagus : '#999', fontWeight: 600 }}>
            {form.ativo ? 'Visível' : 'Oculto'}
          </span>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff0f0', border: `1px solid ${C.danger}`, color: C.danger, borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 13 }}>
          ⚠️ {erro}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={handleSalvar} disabled={loading} style={{
          flex: 1, background: C.feldgrau, color: C.peach, border: 'none', borderRadius: 10,
          padding: '11px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Save size={15} /> {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onCancelar} style={{
          padding: '11px 20px', borderRadius: 10, border: `1.5px solid ${C.feldgrau}`,
          background: 'transparent', color: C.feldgrau, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function MenuTab() {
  const [produtos, setProdutos]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [formOpen, setFormOpen]   = useState(false)
  const [editando, setEditando]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [expanded, setExpanded]   = useState({})
  const [erro, setErro]           = useState('')

  const carregar = async () => {
    setLoading(true)
    const data = await listarProdutos()
    setProdutos(data)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const toggleCat = (cat) => setExpanded(e => ({ ...e, [cat]: !e[cat] }))

  const handleNovo = () => { setEditando(null); setFormOpen(true) }
  const handleEditar = (p) => { setEditando(p); setFormOpen(true) }
  const handleSalvo = () => { setFormOpen(false); setEditando(null); carregar() }
  const handleCancelar = () => { setFormOpen(false); setEditando(null) }

  const handleToggleAtivo = async (p) => {
    await salvarProduto({ ...p, ativo: !p.ativo })
    carregar()
  }

  const handleExcluir = async (id) => {
    await excluirProduto(id)
    setConfirmDel(null)
    carregar()
  }

  // Agrupar por categoria
  const grupos = CATEGORIAS.reduce((acc, cat) => {
    const itens = produtos.filter(p => p.categoria === cat)
    if (itens.length > 0) acc[cat] = itens
    return acc
  }, {})
  const outros = produtos.filter(p => !CATEGORIAS.slice(0,-1).includes(p.categoria))
  if (outros.length > 0) grupos['Outros'] = outros

  const totalAtivos = produtos.filter(p => p.ativo).length

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: C.feldgrau }}>🍽️ Cardápio Online</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
            {loading ? 'Carregando...' : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''} · ${totalAtivos} visível${totalAtivos !== 1 ? 'is' : ''} no menu`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/menu" target="_blank" rel="noreferrer" style={{
            padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.feldgrau}`,
            color: C.feldgrau, fontWeight: 700, fontSize: 13, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Eye size={14} /> Ver menu
          </a>
          <button onClick={handleNovo} style={{
            padding: '9px 16px', borderRadius: 10, background: C.feldgrau,
            color: C.peach, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Plus size={15} /> Novo produto
          </button>
        </div>
      </div>

      {/* Formulário */}
      {formOpen && (
        <ProdutoForm
          inicial={editando}
          onSalvar={handleSalvo}
          onCancelar={handleCancelar}
        />
      )}

      {/* Erro geral */}
      {erro && (
        <div style={{ background: '#fff0f0', border: `1px solid ${C.danger}`, color: C.danger, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Lista de produtos por categoria */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 15 }}>Carregando cardápio...</div>
      ) : produtos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.feldgrau }}>Nenhum produto ainda</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Clique em "Novo produto" para começar</div>
        </div>
      ) : (
        Object.entries(grupos).map(([cat, itens]) => {
          const aberto = expanded[cat] !== false // aberto por padrão
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              {/* Header categoria */}
              <button onClick={() => toggleCat(cat)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.feldgrau, color: C.peach, border: 'none', borderRadius: aberto ? '12px 12px 0 0' : 12,
                padding: '12px 16px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}>
                <span>{cat} <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.7 }}>({itens.length})</span></span>
                {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Itens */}
              {aberto && itens.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff', padding: '12px 16px',
                  borderLeft: `1px solid ${C.grayLt}`, borderRight: `1px solid ${C.grayLt}`,
                  borderBottom: i === itens.length - 1 ? `1px solid ${C.grayLt}` : 'none',
                  borderRadius: i === itens.length - 1 ? '0 0 12px 12px' : 0,
                  opacity: p.ativo ? 1 : 0.55,
                }}>
                  {/* Foto */}
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.grayLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {p.foto_url
                      ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🍰'
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.feldgrau }}>{p.nome}</div>
                    {p.descricao && (
                      <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 300, marginTop: 2 }}>
                        {p.descricao}
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.asparagus, marginTop: 2 }}>{fmt(p.preco)}</div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: p.ativo ? '#e8f5ea' : '#f5f5f5',
                    color: p.ativo ? C.asparagus : '#999',
                  }}>
                    {p.ativo ? 'Visível' : 'Oculto'}
                  </span>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleToggleAtivo(p)} title={p.ativo ? 'Ocultar' : 'Exibir'} style={{
                      width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.grayLt}`,
                      background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: p.ativo ? C.asparagus : '#aaa',
                    }}>
                      {p.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => handleEditar(p)} title="Editar" style={{
                      width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.grayLt}`,
                      background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.feldgrau,
                    }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDel(p)} title="Excluir" style={{
                      width: 32, height: 32, borderRadius: 8, border: `1.5px solid #fcd0d0`,
                      background: '#fff0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger,
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}

      {/* Modal confirmar exclusão */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.feldgrau, marginBottom: 8 }}>Excluir produto?</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              "<strong>{confirmDel.nome}</strong>" será removido permanentemente do cardápio.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleExcluir(confirmDel.id)} style={{
                flex: 1, background: C.danger, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }}>Excluir</button>
              <button onClick={() => setConfirmDel(null)} style={{
                flex: 1, background: 'transparent', color: C.feldgrau, border: `1.5px solid ${C.feldgrau}`, borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
