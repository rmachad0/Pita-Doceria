/**
 * EstoqueTab.jsx
 * Aba de Estoque + Fichas Técnicas do Itza Gestão.
 *
 * Sub-abas:
 *  • Fichas Técnicas – cadastro de receitas vinculadas ao estoque
 *  • Estoque         – ingredientes com saldo e custo unitário
 *  • Movimentações   – histórico de entradas/saídas/ajustes
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Pencil, Save, X, ChevronDown, ChevronUp,
  Package, ClipboardList, RefreshCw, AlertTriangle, CheckCircle, XCircle, Zap,
} from 'lucide-react'
import {
  listarEstoque, criarIngrediente, atualizarIngrediente, excluirIngrediente,
  listarFichas, criarFicha, atualizarFicha, excluirFicha,
  listarMovimentacoes, registrarMovimentacao,
  resumoSincronizacao, sincronizarPedidosPendentes,
} from '../services/estoque-integration'

// ── Brand ─────────────────────────────────────────────────────────────────────
const C = {
  purple:    '#3f3e73',
  purpleDk:  '#2e2d55',
  purpleLt:  '#5a598f',
  lime:      '#bcca2a',
  limeDk:    '#96a120',
  white:     '#FFFFFF',
  offwhite:  '#f5f6fc',
  grayLt:    '#eaebf5',
  grayMid:   '#a8abcc',
  textDark:  '#2e2d55',
  textMuted: '#7a79a8',
}

const UNIDADES = ['g', 'kg', 'ml', 'L', 'un', 'cx']

// ── Micro-components ──────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold border mb-3`}
      style={{
        background: msg.ok ? '#f2faf4' : '#fdf2f2',
        borderColor: msg.ok ? '#a8d4ad' : '#f5b7b7',
        color: msg.ok ? '#1a4a22' : '#7a1f1f',
      }}>
      {msg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {msg.text}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', className = '' }) {
  const base = 'inline-flex items-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer border-0 outline-none'
  const sizes = { sm: 'px-2.5 py-1 text-[11px]', md: 'px-4 py-2 text-[13px]', lg: 'px-5 py-2.5 text-[14px]' }
  const variants = {
    primary:  { background: C.purple,  color: C.lime },
    lime:     { background: C.lime,    color: C.purpleDk },
    ghost:    { background: C.grayLt,  color: C.textDark },
    danger:   { background: '#fef2f2', color: '#991b1b' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${className}`}
      style={{ ...variants[variant], opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  )
}

function Input({ ...props }) {
  return (
    <input
      className="w-full px-3 py-2 text-[13px] rounded-md border bg-white"
      style={{ borderColor: C.grayMid, color: C.textDark }}
      {...props}
    />
  )
}

function Sel({ children, ...props }) {
  return (
    <select
      className="w-full px-3 py-2 text-[13px] rounded-md border bg-white"
      style={{ borderColor: C.grayMid, color: C.textDark }}
      {...props}
    >
      {children}
    </select>
  )
}

function Lbl({ children }) {
  return <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.purple }}>{children}</label>
}

// ── Sub-aba: Estoque ──────────────────────────────────────────────────────────
function AbaEstoque() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ nome: '', unidade: 'g', quantidade: '', qtd_minima: '', custo_unit: '' })
  const [showMov, setShowMov] = useState(null) // estoque_id para movimentação rápida
  const [movForm, setMovForm] = useState({ tipo: 'entrada', quantidade: '', motivo: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listarEstoque()
    setItems(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function notify(ok, text) {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 3500)
  }

  function resetForm() {
    setForm({ nome: '', unidade: 'g', quantidade: '', qtd_minima: '', custo_unit: '' })
    setEditId(null)
    setShowForm(false)
  }

  function openEdit(item) {
    setForm({
      nome: item.nome,
      unidade: item.unidade,
      quantidade: item.quantidade,
      qtd_minima: item.qtd_minima,
      custo_unit: item.custo_unit,
    })
    setEditId(item.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) return notify(false, 'Informe o nome do ingrediente.')
    const payload = {
      nome: form.nome.trim(),
      unidade: form.unidade,
      quantidade: parseFloat(form.quantidade) || 0,
      qtd_minima: parseFloat(form.qtd_minima) || 0,
      custo_unit: parseFloat(form.custo_unit) || 0,
    }
    let res
    if (editId) {
      res = await atualizarIngrediente(editId, payload)
    } else {
      res = await criarIngrediente(payload)
    }
    if (res.error) return notify(false, res.error)
    notify(true, editId ? 'Ingrediente atualizado!' : 'Ingrediente adicionado!')
    resetForm()
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este ingrediente?')) return
    const res = await excluirIngrediente(id)
    if (res.error) return notify(false, res.error)
    notify(true, 'Ingrediente removido.')
    load()
  }

  async function handleMov() {
    if (!movForm.quantidade) return notify(false, 'Informe a quantidade.')
    const res = await registrarMovimentacao({
      estoque_id: showMov,
      tipo: movForm.tipo,
      quantidade: parseFloat(movForm.quantidade),
      motivo: movForm.motivo,
    })
    if (res.error) return notify(false, res.error)
    notify(true, 'Movimentação registrada!')
    setShowMov(null)
    setMovForm({ tipo: 'entrada', quantidade: '', motivo: '' })
    load()
  }

  const baixo = items.filter(i => i.qtd_minima > 0 && i.quantidade <= i.qtd_minima)

  return (
    <div>
      <Toast msg={toast} />

      {baixo.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg mb-4 text-[12px]"
          style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#78350f' }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span><strong>Estoque baixo:</strong> {baixo.map(i => i.nome).join(', ')}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-[15px]" style={{ color: C.purple }}>Ingredientes em Estoque</span>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={load}><RefreshCw size={13} />Atualizar</Btn>
          <Btn size="sm" onClick={() => { resetForm(); setShowForm(true) }}><Plus size={13} />Novo</Btn>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: C.lime, background: '#fafff2' }}>
          <p className="font-bold text-[13px] mb-3" style={{ color: C.purpleDk }}>{editId ? 'Editar Ingrediente' : 'Novo Ingrediente'}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <Lbl>Nome</Lbl>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Farinha de Trigo" />
            </div>
            <div>
              <Lbl>Unidade</Lbl>
              <Sel value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </Sel>
            </div>
            <div>
              <Lbl>Quantidade atual</Lbl>
              <Input type="number" min="0" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Lbl>Qtd. mínima (alerta)</Lbl>
              <Input type="number" min="0" value={form.qtd_minima} onChange={e => setForm(f => ({ ...f, qtd_minima: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Lbl>Custo por unidade (R$)</Lbl>
              <Input type="number" min="0" step="0.0001" value={form.custo_unit} onChange={e => setForm(f => ({ ...f, custo_unit: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={handleSave}><Save size={13} />Salvar</Btn>
            <Btn variant="ghost" onClick={resetForm}><X size={13} />Cancelar</Btn>
          </div>
        </div>
      )}

      {/* Movimentação rápida */}
      {showMov && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: C.grayMid, background: C.offwhite }}>
          <p className="font-bold text-[13px] mb-3" style={{ color: C.purpleDk }}>
            Movimentação — {items.find(i => i.id === showMov)?.nome}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Lbl>Tipo</Lbl>
              <Sel value={movForm.tipo} onChange={e => setMovForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
                <option value="desperdicio">Desperdício</option>
              </Sel>
            </div>
            <div>
              <Lbl>Quantidade</Lbl>
              <Input type="number" min="0" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <Lbl>Motivo</Lbl>
              <Input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} placeholder="opcional" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={handleMov}><Save size={13} />Registrar</Btn>
            <Btn variant="ghost" onClick={() => setShowMov(null)}><X size={13} />Cancelar</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Nenhum ingrediente cadastrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: C.grayLt }}>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ background: C.purple, color: C.white }}>
                {['Ingrediente', 'Unidade', 'Saldo', 'Qtd. Mín.', 'Custo/Un.', 'Custo Total', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const alerta = item.qtd_minima > 0 && item.quantidade <= item.qtd_minima
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? C.white : C.offwhite }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: C.textDark }}>
                      {alerta && <AlertTriangle size={11} className="inline mr-1 text-yellow-500" />}
                      {item.nome}
                    </td>
                    <td className="px-3 py-2">{item.unidade}</td>
                    <td className="px-3 py-2" style={{ color: alerta ? '#b45309' : C.textDark, fontWeight: alerta ? 700 : 400 }}>
                      {Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                    </td>
                    <td className="px-3 py-2">{item.qtd_minima || '—'}</td>
                    <td className="px-3 py-2">
                      {item.custo_unit > 0 ? `R$ ${Number(item.custo_unit).toFixed(4)}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {item.custo_unit > 0 ? `R$ ${(item.quantidade * item.custo_unit).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setShowMov(item.id)} title="Movimentar" className="p-1 rounded hover:opacity-70" style={{ color: C.purpleLt }}>
                          <RefreshCw size={13} />
                        </button>
                        <button onClick={() => openEdit(item)} title="Editar" className="p-1 rounded hover:opacity-70" style={{ color: C.purple }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} title="Excluir" className="p-1 rounded hover:opacity-70" style={{ color: '#dc2626' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-aba: Fichas Técnicas ──────────────────────────────────────────────────
function AbaFichas() {
  const [fichas, setFichas] = useState([])
  const [estoque, setEstoque] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ produto: '', rendimento: 1, unidade_prod: 'un', ativo: true })
  const [ingredientes, setIngredientes] = useState([
    { nome_ingrediente: '', quantidade: '', unidade: 'g', estoque_id: '' }
  ])

  const load = useCallback(async () => {
    setLoading(true)
    const [fichasRes, estRes] = await Promise.all([listarFichas(), listarEstoque()])
    setFichas(fichasRes.data)
    setEstoque(estRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function notify(ok, text) {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 3500)
  }

  function resetForm() {
    setForm({ produto: '', rendimento: 1, unidade_prod: 'un', ativo: true })
    setIngredientes([{ nome_ingrediente: '', quantidade: '', unidade: 'g', estoque_id: '' }])
    setEditId(null)
    setShowForm(false)
  }

  function openEdit(ficha) {
    setForm({ produto: ficha.produto, rendimento: ficha.rendimento, unidade_prod: ficha.unidade_prod, ativo: ficha.ativo })
    setIngredientes(
      ficha.ficha_ingredientes?.length
        ? ficha.ficha_ingredientes.map(i => ({
            nome_ingrediente: i.nome_ingrediente,
            quantidade: i.quantidade,
            unidade: i.unidade,
            estoque_id: i.estoque_id || '',
          }))
        : [{ nome_ingrediente: '', quantidade: '', unidade: 'g', estoque_id: '' }]
    )
    setEditId(ficha.id)
    setShowForm(true)
  }

  function addIngrediente() {
    setIngredientes(prev => [...prev, { nome_ingrediente: '', quantidade: '', unidade: 'g', estoque_id: '' }])
  }

  function removeIngrediente(idx) {
    setIngredientes(prev => prev.filter((_, i) => i !== idx))
  }

  function updateIngrediente(idx, key, value) {
    setIngredientes(prev => prev.map((item, i) => {
      if (i !== idx) return item
      // Se vinculou ao estoque, preenche nome e unidade automaticamente
      if (key === 'estoque_id' && value) {
        const ing = estoque.find(e => String(e.id) === String(value))
        return { ...item, estoque_id: value, nome_ingrediente: ing?.nome || item.nome_ingrediente, unidade: ing?.unidade || item.unidade }
      }
      return { ...item, [key]: value }
    }))
  }

  async function handleSave() {
    if (!form.produto.trim()) return notify(false, 'Informe o nome do produto.')
    const fichaPayload = { produto: form.produto.trim(), rendimento: parseFloat(form.rendimento) || 1, unidade_prod: form.unidade_prod, ativo: form.ativo }
    const ingPayload = ingredientes
      .filter(i => i.nome_ingrediente.trim() && i.quantidade)
      .map(i => ({
        nome_ingrediente: i.nome_ingrediente.trim(),
        quantidade: parseFloat(i.quantidade) || 0,
        unidade: i.unidade,
        estoque_id: i.estoque_id || null,
      }))

    let res
    if (editId) {
      res = await atualizarFicha(editId, fichaPayload, ingPayload)
    } else {
      res = await criarFicha(fichaPayload, ingPayload)
    }
    if (res.error) return notify(false, res.error)
    notify(true, editId ? 'Ficha atualizada!' : 'Ficha criada!')
    resetForm()
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir esta ficha técnica?')) return
    const res = await excluirFicha(id)
    if (res.error) return notify(false, res.error)
    notify(true, 'Ficha removida.')
    load()
  }

  // Custo total da ficha baseado nos ingredientes vinculados
  function custoDaFicha(ficha) {
    let total = 0
    for (const ing of (ficha.ficha_ingredientes || [])) {
      const est = ing.estoque
      if (est && est.custo_unit > 0) {
        total += ing.quantidade * est.custo_unit
      }
    }
    return total
  }

  return (
    <div>
      <Toast msg={toast} />

      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-[15px]" style={{ color: C.purple }}>Fichas Técnicas</span>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={load}><RefreshCw size={13} />Atualizar</Btn>
          <Btn size="sm" onClick={() => { resetForm(); setShowForm(true) }}><Plus size={13} />Nova Ficha</Btn>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: C.lime, background: '#fafff2' }}>
          <p className="font-bold text-[13px] mb-3" style={{ color: C.purpleDk }}>{editId ? 'Editar Ficha' : 'Nova Ficha Técnica'}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <div className="col-span-2">
              <Lbl>Produto / Receita</Lbl>
              <Input value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} placeholder="Ex: Bolo de Chocolate" />
            </div>
            <div>
              <Lbl>Rendimento (lote)</Lbl>
              <Input type="number" min="1" value={form.rendimento} onChange={e => setForm(f => ({ ...f, rendimento: e.target.value }))} placeholder="Ex: 12" />
            </div>
            <div>
              <Lbl>Unidade do produto</Lbl>
              <Sel value={form.unidade_prod} onChange={e => setForm(f => ({ ...f, unidade_prod: e.target.value }))}>
                {['un', 'kg', 'g', 'L', 'ml'].map(u => <option key={u}>{u}</option>)}
              </Sel>
            </div>
          </div>

          {/* Ingredientes */}
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.purple }}>Ingredientes do lote completo</p>
          <div className="space-y-2 mb-3">
            {ingredientes.map((ing, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {idx === 0 && <Lbl>Vínculo estoque</Lbl>}
                  <Sel value={ing.estoque_id} onChange={e => updateIngrediente(idx, 'estoque_id', e.target.value)}>
                    <option value="">— sem vínculo —</option>
                    {estoque.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.unidade})</option>)}
                  </Sel>
                </div>
                <div className="col-span-4">
                  {idx === 0 && <Lbl>Nome do ingrediente</Lbl>}
                  <Input value={ing.nome_ingrediente} onChange={e => updateIngrediente(idx, 'nome_ingrediente', e.target.value)} placeholder="Nome" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Lbl>Qtd.</Lbl>}
                  <Input type="number" min="0" value={ing.quantidade} onChange={e => updateIngrediente(idx, 'quantidade', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <Lbl>Un.</Lbl>}
                  <Sel value={ing.unidade} onChange={e => updateIngrediente(idx, 'unidade', e.target.value)}>
                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                  </Sel>
                </div>
                <div className="col-span-1 flex justify-end">
                  {idx === 0 && <div className="h-5" />}
                  <button onClick={() => removeIngrediente(idx)} className="p-1.5 rounded" style={{ color: '#dc2626' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Btn size="sm" variant="ghost" onClick={addIngrediente}><Plus size={12} />Adicionar Ingrediente</Btn>

          <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: C.grayLt }}>
            <Btn onClick={handleSave}><Save size={13} />Salvar Ficha</Btn>
            <Btn variant="ghost" onClick={resetForm}><X size={13} />Cancelar</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Carregando…</p>
      ) : fichas.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-20" style={{ color: C.purple }} />
          <p className="text-[13px]" style={{ color: C.textMuted }}>Nenhuma ficha técnica cadastrada.</p>
          <p className="text-[12px] mt-1" style={{ color: C.textMuted }}>Crie fichas para descontar ingredientes automaticamente a cada venda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fichas.map(ficha => {
            const custo = custoDaFicha(ficha)
            const custoUn = ficha.rendimento > 0 ? custo / ficha.rendimento : 0
            return (
              <div key={ficha.id} className="rounded-xl border overflow-hidden" style={{ borderColor: C.grayLt }}>
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  style={{ background: expanded === ficha.id ? C.purple : C.white, transition: 'background 0.2s' }}
                  onClick={() => setExpanded(expanded === ficha.id ? null : ficha.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-[14px]" style={{ color: expanded === ficha.id ? C.lime : C.textDark }}>
                        {ficha.produto}
                      </span>
                      {!ficha.ativo && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#fef2f2', color: '#991b1b' }}>Inativa</span>
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: expanded === ficha.id ? `${C.lime}90` : C.textMuted }}>
                      Rende {ficha.rendimento} {ficha.unidade_prod} · {ficha.ficha_ingredientes?.length || 0} ingrediente(s)
                      {custo > 0 && ` · Custo/un: R$ ${custoUn.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); openEdit(ficha) }} className="p-1.5 rounded" style={{ color: expanded === ficha.id ? C.lime : C.purple }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(ficha.id) }} className="p-1.5 rounded" style={{ color: '#dc2626' }}>
                      <Trash2 size={13} />
                    </button>
                    {expanded === ficha.id ? <ChevronUp size={16} color={C.lime} /> : <ChevronDown size={16} color={C.textMuted} />}
                  </div>
                </div>

                {expanded === ficha.id && (
                  <div className="px-4 py-3" style={{ background: C.offwhite }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr style={{ color: C.textMuted }}>
                          <th className="text-left pb-1.5 font-semibold">Ingrediente</th>
                          <th className="text-right pb-1.5 font-semibold">Quantidade/Lote</th>
                          <th className="text-right pb-1.5 font-semibold">Qtd./Unidade</th>
                          <th className="text-right pb-1.5 font-semibold">Custo/Lote</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ficha.ficha_ingredientes || []).map(ing => {
                          const custoIngLote = ing.estoque?.custo_unit > 0 ? ing.quantidade * ing.estoque.custo_unit : null
                          const qtdUn = ficha.rendimento > 0 ? ing.quantidade / ficha.rendimento : ing.quantidade
                          return (
                            <tr key={ing.id} className="border-t" style={{ borderColor: C.grayLt }}>
                              <td className="py-1.5" style={{ color: C.textDark }}>{ing.nome_ingrediente}</td>
                              <td className="py-1.5 text-right">{Number(ing.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}</td>
                              <td className="py-1.5 text-right">{Number(qtdUn).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}</td>
                              <td className="py-1.5 text-right">
                                {custoIngLote != null ? `R$ ${custoIngLote.toFixed(2)}` : <span style={{ color: C.textMuted }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {custo > 0 && (
                        <tfoot>
                          <tr className="border-t-2" style={{ borderColor: C.purple }}>
                            <td colSpan="3" className="pt-2 font-bold text-right text-[11px] uppercase tracking-wide" style={{ color: C.purple }}>Custo total do lote</td>
                            <td className="pt-2 font-bold text-right" style={{ color: C.purple }}>R$ {custo.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="font-bold text-right text-[11px] uppercase tracking-wide" style={{ color: C.textMuted }}>Custo por unidade</td>
                            <td className="font-bold text-right" style={{ color: C.textMuted }}>R$ {custoUn.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sub-aba: Movimentações ─────────────────────────────────────────────────────
function AbaMovimentacoes() {
  const [movs, setMovs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listarMovimentacoes(300)
    setMovs(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const tipoColor = { entrada: '#16a34a', saida: '#dc2626', ajuste: '#2563eb', desperdicio: '#b45309' }
  const tipoLabel = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste', desperdicio: 'Desperdício' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-[15px]" style={{ color: C.purple }}>Histórico de Movimentações</span>
        <Btn size="sm" variant="ghost" onClick={load}><RefreshCw size={13} />Atualizar</Btn>
      </div>
      {loading ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Carregando…</p>
      ) : movs.length === 0 ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Sem movimentações registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: C.grayLt }}>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ background: C.purple, color: C.white }}>
                {['Data', 'Ingrediente', 'Tipo', 'Quantidade', 'Saldo Após', 'Motivo', 'Pedido'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movs.map((mov, i) => (
                <tr key={mov.id} style={{ background: i % 2 === 0 ? C.white : C.offwhite }}>
                  <td className="px-3 py-2" style={{ color: C.textMuted }}>
                    {new Date(mov.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: C.textDark }}>{mov.estoque?.nome || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${tipoColor[mov.tipo]}15`, color: tipoColor[mov.tipo] }}>
                      {tipoLabel[mov.tipo] || mov.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2">{Number(mov.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {mov.estoque?.unidade}</td>
                  <td className="px-3 py-2">{mov.saldo_apos != null ? Number(mov.saldo_apos).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : '—'}</td>
                  <td className="px-3 py-2" style={{ color: C.textMuted }}>{mov.motivo || '—'}</td>
                  <td className="px-3 py-2" style={{ color: C.textMuted }}>{mov.pedido_ref || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-aba: Sincronização ─────────────────────────────────────────────────────
function AbaSincronizacao() {
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)

  function notify(ok, text) {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await resumoSincronizacao()
    setResumo(res)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSync(pedidos) {
    setSyncing(true)
    const res = await sincronizarPedidosPendentes(pedidos)
    setSyncing(false)
    notify(res.erros.length === 0, `${res.processados} pedido(s) sincronizado(s), ${res.semFicha} sem ficha técnica vinculada.`)
    load()
  }

  if (loading) return <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Carregando…</p>

  const pendentes = resumo?.listaPendentes || []

  return (
    <div>
      <Toast msg={toast} />

      {/* Header + action */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-[15px]" style={{ color: C.purple }}>Sincronização de Estoque</span>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={load}><RefreshCw size={13} />Atualizar</Btn>
          <Btn
            size="sm"
            onClick={() => handleSync(pendentes)}
            disabled={syncing || pendentes.length === 0}
          >
            <Zap size={13} />{syncing ? 'Sincronizando…' : 'Sincronizar Todos Pendentes'}
          </Btn>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border p-4" style={{ borderColor: '#a8d4ad', background: '#f2faf4' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#16a34a' }}>Sincronizados</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: '#15803d' }}>{resumo?.sincronizados ?? '—'}</p>
        </div>
        <div className="rounded-xl border p-4" style={{
          borderColor: pendentes.length > 0 ? '#fcd34d' : C.grayLt,
          background: pendentes.length > 0 ? '#fffbeb' : C.offwhite,
        }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: pendentes.length > 0 ? '#b45309' : C.textMuted }}>Pendentes</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: pendentes.length > 0 ? '#92400e' : C.textMuted }}>{resumo?.pendentes ?? '—'}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: '#c4b5fd', background: '#f5f3ff' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#7c3aed' }}>Total de Pedidos</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: '#5b21b6' }}>{resumo?.total ?? '—'}</p>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg mb-4 text-[12px]"
        style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#78350f' }}>
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>Pedidos sem ficha técnica vinculada não descontam estoque automaticamente. Crie a ficha na aba <strong>Fichas Técnicas</strong>.</span>
      </div>

      {/* Pending orders table */}
      {pendentes.length === 0 ? (
        <p className="text-center text-[13px] py-8" style={{ color: C.textMuted }}>Nenhum pedido pendente de sincronização.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: C.grayLt }}>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ background: C.purple, color: C.white }}>
                {['Data', 'Nº Pedido', 'Produto', 'Qtd', 'Canal', 'Ação'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendentes.map((ped, i) => (
                <tr key={ped.numero_pedido} style={{ background: i % 2 === 0 ? C.white : C.offwhite }}>
                  <td className="px-3 py-2" style={{ color: C.textMuted }}>
                    {new Date(ped.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: C.textDark }}>{ped.numero_pedido}</td>
                  <td className="px-3 py-2" style={{ color: C.textDark }}>{ped.produto}</td>
                  <td className="px-3 py-2">{ped.quantidade}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: ped.canal === 'ifood' ? '#fef2f2' : C.grayLt, color: ped.canal === 'ifood' ? '#dc2626' : C.textDark }}>
                      {ped.canal || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Btn size="sm" variant="lime" onClick={() => handleSync([ped])} disabled={syncing}>
                      <Zap size={11} />Sincronizar
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── EstoqueTab principal ───────────────────────────────────────────────────────
const SUBTABS = [
  { k: 'fichas',  l: 'Fichas Técnicas', icon: ClipboardList },
  { k: 'estoque', l: 'Estoque',         icon: Package },
  { k: 'movs',    l: 'Movimentações',   icon: RefreshCw },
  { k: 'sync',    l: 'Sincronização',   icon: Zap },
]

export default function EstoqueTab() {
  const [sub, setSub] = useState('fichas')

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: C.grayLt }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.purple }}>
          <Package size={16} color={C.lime} />
        </div>
        <div>
          <p className="font-bold text-[16px] leading-tight" style={{ color: C.purple }}>Estoque & Fichas Técnicas</p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>Desconto automático de ingredientes a cada venda</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: C.grayLt }}>
        {SUBTABS.map(({ k, l, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-bold transition-all"
            style={{
              background: sub === k ? C.purple : 'transparent',
              color: sub === k ? C.lime : C.textMuted,
            }}
          >
            <Icon size={13} />{l}
          </button>
        ))}
      </div>

      {sub === 'fichas'  && <AbaFichas />}
      {sub === 'estoque' && <AbaEstoque />}
      {sub === 'movs'    && <AbaMovimentacoes />}
      {sub === 'sync'    && <AbaSincronizacao />}
    </div>
  )
}
