import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import {
  Settings, ChefHat, Package, Store, Tag,
  TrendingUp, Plus, Trash2, DollarSign, BarChart3,
  ChevronDown, ChevronUp, Save, Clock, ShoppingBag,
  RefreshCw, Phone, Calendar, MessageSquare, CreditCard,
  CheckCircle, XCircle, Loader, ClipboardList,
  Printer, X as CloseX,
} from 'lucide-react'
import {
  salvarPrecificacao, alertarMargemPerigosa,
  registrarPedido, carregarHistorico, carregarPedidos, excluirPedido, atualizarStatusPedido,
} from './services/supabase-integration'
const Dashboard = lazy(() => import('./components/Dashboard'))

// ── Brand colors ─────────────────────────────────────────────────────────────
const C = {
  feldgrau:    '#525F54',
  feldgrauDk:  '#3d4a3f',
  feldgrauLt:  '#6b7a6d',
  peach:       '#FABD97',
  peachDk:     '#f09e6a',
  peachLt:     '#fdd8bc',
  asparagus:   '#6CAE75',
  asparagusLt: '#a8d4ad',
  white:       '#FFFFFF',
  offWhite:    '#FAF8F5',
  grayLt:      '#f0ede8',
  grayMid:     '#c5bfb6',
  textDark:    '#2c3a2e',
  textMid:     '#525F54',
  textMuted:   '#7a8a7c',
}

// ── PiTa® Logo ───────────────────────────────────────────────────────────────
function PitaLogo({ width = 140 }) {
  const h = Math.round(width * 0.55)
  return (
    <svg width={width} height={h} viewBox="0 0 240 132" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="132" rx="8" fill={C.feldgrau} />
      <text x="18"  y="105" fontFamily="Georgia,'Times New Roman',serif" fontSize="108" fontStyle="italic" fontWeight="400" fill={C.peach}>P</text>
      <text x="108" y="105" fontFamily="Georgia,'Times New Roman',serif" fontSize="72"  fontStyle="italic" fill={C.peach}>i</text>
      <circle cx="122" cy="24" r="6" fill={C.peach} />
      <text x="134" y="105" fontFamily="Georgia,'Times New Roman',serif" fontSize="72"  fontWeight="700" fill={C.peach}>T</text>
      <text x="178" y="105" fontFamily="Georgia,'Times New Roman',serif" fontSize="62"  fontStyle="italic" fill={C.peach}>a</text>
      <text x="218" y="58"  fontFamily="Georgia,'Times New Roman',serif" fontSize="16"  fill={C.peach} opacity="0.85">®</text>
    </svg>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div className={`bg-white rounded-xl border border-pita-grayMid/40 shadow-sm mb-4 p-5 ${className}`} style={style}>
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-pita-grayLt">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
        <Icon size={15} color={C.peach} />
      </div>
      <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>{children}</span>
    </div>
  )
}

function Label({ children }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.feldgrau }}>
      {children}
    </label>
  )
}

function Input({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      className="w-full px-3 py-2 text-[13px] rounded-md border border-pita-grayMid/60 bg-white transition-colors"
      style={{ color: C.textDark, borderColor: C.grayMid }}
      {...props}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full px-3 py-2 text-[13px] rounded-md border bg-white cursor-pointer"
      style={{ color: C.textDark, borderColor: C.grayMid }}
      {...props}
    >
      {children}
    </select>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold border mb-3"
      style={{
        background: msg.ok ? '#f2faf4' : '#fdf2f2',
        borderColor: msg.ok ? C.asparagusLt : '#f5b7b7',
        color: msg.ok ? '#1a4a22' : '#7a1f1f',
      }}
    >
      {msg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {msg.text}
    </div>
  )
}

// ── Recipes data ──────────────────────────────────────────────────────────────
const RECIPES = {
  'ovo-pao-de-mel': {
    name: 'Ovo Pão de Mel', prepTime: 90, qty: 6, packaging: 3.50,
    ingredients: [
      { id: 1, name: 'Farinha de Trigo',    pkgPrice: 5.00,  pkgWeight: 1000, used: 200 },
      { id: 2, name: 'Mel',                 pkgPrice: 18.00, pkgWeight: 500,  used: 150 },
      { id: 3, name: 'Chocolate em Pó 50%', pkgPrice: 8.00,  pkgWeight: 200,  used: 50  },
      { id: 4, name: 'Ovos (aprox.)',        pkgPrice: 12.00, pkgWeight: 600,  used: 150 },
      { id: 5, name: 'Açúcar Mascavo',      pkgPrice: 8.00,  pkgWeight: 1000, used: 200 },
      { id: 6, name: 'Manteiga',            pkgPrice: 8.00,  pkgWeight: 200,  used: 100 },
      { id: 7, name: 'Leite Condensado',    pkgPrice: 6.00,  pkgWeight: 395,  used: 200 },
      { id: 8, name: 'Chocolate Cobertura', pkgPrice: 25.00, pkgWeight: 1000, used: 300 },
    ],
  },
  'cookies': {
    name: 'Cookies', prepTime: 60, qty: 20, packaging: 0.80,
    ingredients: [
      { id: 1, name: 'Farinha de Trigo',     pkgPrice: 5.00,  pkgWeight: 1000, used: 250 },
      { id: 2, name: 'Manteiga',             pkgPrice: 8.00,  pkgWeight: 200,  used: 150 },
      { id: 3, name: 'Açúcar Refinado',      pkgPrice: 4.00,  pkgWeight: 1000, used: 150 },
      { id: 4, name: 'Açúcar Mascavo',       pkgPrice: 8.00,  pkgWeight: 1000, used: 100 },
      { id: 5, name: 'Ovos (aprox.)',         pkgPrice: 12.00, pkgWeight: 600,  used: 50  },
      { id: 6, name: 'Chocolate Chips',      pkgPrice: 20.00, pkgWeight: 500,  used: 200 },
      { id: 7, name: 'Essência de Baunilha', pkgPrice: 8.00,  pkgWeight: 30,   used: 5   },
    ],
  },
  'pao-mel-colmeia': {
    name: 'Pão de Mel Colmeia', prepTime: 75, qty: 24, packaging: 1.20,
    ingredients: [
      { id: 1, name: 'Farinha de Trigo',    pkgPrice: 5.00,  pkgWeight: 1000, used: 400 },
      { id: 2, name: 'Mel',                 pkgPrice: 18.00, pkgWeight: 500,  used: 200 },
      { id: 3, name: 'Açúcar Mascavo',      pkgPrice: 8.00,  pkgWeight: 1000, used: 150 },
      { id: 4, name: 'Ovos (aprox.)',        pkgPrice: 12.00, pkgWeight: 600,  used: 100 },
      { id: 5, name: 'Chocolate em Pó',     pkgPrice: 8.00,  pkgWeight: 200,  used: 40  },
      { id: 6, name: 'Fermento em Pó',      pkgPrice: 4.00,  pkgWeight: 100,  used: 8   },
      { id: 7, name: 'Leite Integral',      pkgPrice: 5.00,  pkgWeight: 1000, used: 100 },
      { id: 8, name: 'Chocolate Cobertura', pkgPrice: 25.00, pkgWeight: 1000, used: 400 },
    ],
  },
  'pao-mel-tradicional': {
    name: 'Pão de Mel Tradicional', prepTime: 120, qty: 30, packaging: 1.50,
    ingredients: [
      { id: 1, name: 'Farinha de Trigo',    pkgPrice: 5.00,  pkgWeight: 1000, used: 500 },
      { id: 2, name: 'Mel',                 pkgPrice: 18.00, pkgWeight: 500,  used: 200 },
      { id: 3, name: 'Açúcar Refinado',     pkgPrice: 4.00,  pkgWeight: 1000, used: 150 },
      { id: 4, name: 'Ovos (aprox.)',        pkgPrice: 12.00, pkgWeight: 600,  used: 100 },
      { id: 5, name: 'Chocolate em Pó',     pkgPrice: 8.00,  pkgWeight: 200,  used: 60  },
      { id: 6, name: 'Fermento em Pó',      pkgPrice: 4.00,  pkgWeight: 100,  used: 10  },
      { id: 7, name: 'Leite Integral',      pkgPrice: 5.00,  pkgWeight: 1000, used: 100 },
      { id: 8, name: 'Chocolate Cobertura', pkgPrice: 25.00, pkgWeight: 1000, used: 500 },
    ],
  },
  'massa-amanteigada': {
    name: 'Massa Amanteigada', prepTime: 45, qty: 30, packaging: 0.60,
    ingredients: [
      { id: 1, name: 'Manteiga sem Sal',     pkgPrice: 8.00,  pkgWeight: 200,  used: 200 },
      { id: 2, name: 'Açúcar Refinado',      pkgPrice: 4.00,  pkgWeight: 1000, used: 200 },
      { id: 3, name: 'Ovos (aprox.)',         pkgPrice: 12.00, pkgWeight: 600,  used: 100 },
      { id: 4, name: 'Farinha de Trigo',     pkgPrice: 5.00,  pkgWeight: 1000, used: 400 },
      { id: 5, name: 'Essência de Baunilha', pkgPrice: 8.00,  pkgWeight: 30,   used: 5   },
    ],
  },
  'ganache-maracuja': {
    name: 'Ganache de Maracujá', prepTime: 30, qty: 20, packaging: 0.50,
    ingredients: [
      { id: 1, name: 'Chocolate Branco',  pkgPrice: 28.00, pkgWeight: 1000, used: 400 },
      { id: 2, name: 'Creme de Leite',    pkgPrice: 5.00,  pkgWeight: 200,  used: 200 },
      { id: 3, name: 'Polpa de Maracujá', pkgPrice: 10.00, pkgWeight: 400,  used: 100 },
    ],
  },
  'buttercream': {
    name: 'Buttercream', prepTime: 20, qty: 15, packaging: 0.40,
    ingredients: [
      { id: 1, name: 'Manteiga sem Sal',     pkgPrice: 8.00, pkgWeight: 200,  used: 200 },
      { id: 2, name: 'Açúcar Confeiteiro',   pkgPrice: 6.00, pkgWeight: 500,  used: 400 },
      { id: 3, name: 'Leite Integral',       pkgPrice: 5.00, pkgWeight: 1000, used: 50  },
      { id: 4, name: 'Essência de Baunilha', pkgPrice: 8.00, pkgWeight: 30,   used: 5   },
    ],
  },
  'personalizado': {
    name: 'Produto Personalizado', prepTime: 60, qty: 10, packaging: 1.00,
    ingredients: [
      { id: 1, name: 'Ingrediente 1', pkgPrice: 10.00, pkgWeight: 500, used: 100 },
    ],
  },
}

const TRENDS = [
  { name: 'Ovo Pão de Mel Gourmet', trend: 'Alta', tag: 'Tendência', range: 'R$ 65,00 a R$ 85,00', desc: 'Chocolate belga premium, recheio cremoso. Ideal para datas especiais e Páscoa. Alta margem por exclusividade.' },
  { name: 'Cookies Recheados / NYC Style', trend: 'Explosiva', tag: 'Explosivo', range: 'R$ 12,00 a R$ 18,00 / unid.', desc: 'Cookies gigantes americanos com recheio generoso. Tendência dominante nas docerias de 2025-2026.' },
  { name: 'Pão de Mel Colmeia Personalizado', trend: 'Alta — Eventos', tag: 'Eventos', range: 'R$ 8,00 a R$ 12,00 / unid.', desc: 'Muito procurado para lembrancinhas, casamentos e corporativos. Alta margem via personalização.' },
  { name: 'Bolos Decorados com Buttercream', trend: 'Altíssima — Casamentos', tag: 'Premium', range: 'R$ 150,00 a R$ 220,00 / kg', desc: 'Decorações florais artísticas. Casamentos e celebrações premium. Ticket médio elevado.' },
]

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(v) || !isFinite(v) ? 0 : v)
const pct = (v) => `${(isNaN(v) || !isFinite(v) ? 0 : v).toFixed(1)}%`

// ── Cupom térmico 80mm ────────────────────────────────────────────────────────
function buildReceipt(order) {
  const total = parseFloat(order['Valor Total'] || 0)
  const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page{size:80mm auto;margin:3mm 4mm 14mm 4mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Courier New',Courier,monospace;font-size:11px;width:72mm;color:#000}
.c{text-align:center}.b{font-weight:bold}
.row{display:flex;justify-content:space-between;margin:2px 0}
.sep{border-top:1px dashed #333;margin:5px 0}
.lbl{font-size:10px;color:#555}
.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin:3px 0}
</style></head><body>
<div class="c b" style="font-size:15px;margin-bottom:2px">PiTa Doceria</div>
<div class="c" style="font-size:9px;margin-bottom:5px">Doceria Artesanal · Sinop, MT</div>
<div class="sep"></div>
<div class="row"><span class="lbl">Pedido:</span><span class="b">${order['Nº Pedido']}</span></div>
<div class="row"><span class="lbl">Data:</span><span>${order['Data/Hora']}</span></div>
<div class="row"><span class="lbl">Cliente:</span><span class="b">${order['Cliente']}</span></div>
${order['Entrega'] && order['Entrega'] !== '—' ? `<div class="row"><span class="lbl">Entrega:</span><span>${order['Entrega']}</span></div>` : ''}
<div class="sep"></div>
<div class="row">
  <span style="flex:1;padding-right:4px">${order['Quantidade']}x ${order['Produto']}</span>
  <span>${fmt(total)}</span>
</div>
<div class="sep"></div>
<div class="total-row"><span>TOTAL</span><span>${fmt(total)}</span></div>
<div class="row"><span class="lbl">Pagamento:</span><span>${order['Pagamento'] || 'Pix'}</span></div>
${order['Observações'] ? `<div class="sep"></div><div style="font-size:10px"><b>Obs:</b> ${order['Observações']}</div>` : ''}
<div class="sep" style="margin-top:10px"></div>
<div class="c" style="font-size:10px;line-height:1.7">
  Muito obrigada pela preferência! 🍫<br>
  <span style="font-size:9px">pita-doceria.vercel.app</span>
</div>
</body></html>`
}

function doPrint(order) {
  const win = window.open('', '_blank', 'width=340,height=580,menubar=no,toolbar=no,location=no,status=no')
  if (!win) return
  win.document.write(buildReceipt(order))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 350)
}

let idSeq = 1000

// ── PEDIDO VAZIO ──────────────────────────────────────────────────────────────
const PEDIDO_VAZIO = { clientName: '', phone: '', product: '', qty: 1, unitPrice: '', deliveryDate: '', notes: '', payment: 'Pix', canal: 'direto' }

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('pricing')

  // ── Custos fixos ──────────────────────────────────────────────────────────
  const [fixed, setFixed]     = useState({ water: 200, energy: 137, rent: 2300, salary: 3000, hours: 208 })
  const [showFixed, setShowFixed] = useState(false)

  // ── Receita / produto ─────────────────────────────────────────────────────
  const [recipeKey, setRecipeKey] = useState('ovo-pao-de-mel')
  const [prodName, setProdName]   = useState(RECIPES['ovo-pao-de-mel'].name)
  const [prepTime, setPrepTime]   = useState(RECIPES['ovo-pao-de-mel'].prepTime)
  const [recipeQty, setRecipeQty] = useState(RECIPES['ovo-pao-de-mel'].qty)
  const [packaging, setPackaging] = useState(RECIPES['ovo-pao-de-mel'].packaging)
  const [ings, setIngs]           = useState(() => RECIPES['ovo-pao-de-mel'].ingredients.map(i => ({ ...i })))

  // ── Precificação ──────────────────────────────────────────────────────────
  const [channel, setChannel]         = useState('direct')
  const [margin, setMargin]           = useState(30)
  const [tax, setTax]                 = useState(6)
  const [customPrice, setCustomPrice] = useState('')

  // ── n8n: salvar precificação ──────────────────────────────────────────────
  const [saving, setSaving]   = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // ── Histórico ─────────────────────────────────────────────────────────────
  const [historico, setHistorico]         = useState([])
  const [loadingHist, setLoadingHist]     = useState(false)
  const [histLoaded, setHistLoaded]       = useState(false)

  // ── Pedidos ───────────────────────────────────────────────────────────────
  const [pedidos, setPedidos]         = useState([])
  const [loadingPed, setLoadingPed]   = useState(false)
  const [pedLoaded, setPedLoaded]     = useState(false)
  const [novoPedido, setNovoPedido]   = useState(PEDIDO_VAZIO)
  const [savingPed, setSavingPed]     = useState(false)
  const [pedMsg, setPedMsg]           = useState(null)
  const [printOrder, setPrintOrder]   = useState(null)
  const [deleteOrder, setDeleteOrder] = useState(null)
  const [deletingPed, setDeletingPed] = useState(false)

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const totalFixed    = fixed.water + fixed.energy + fixed.rent + fixed.salary
  const cph           = fixed.hours > 0 ? totalFixed / fixed.hours : 0
  const chanFee       = channel === 'ifood' ? 25 : 0
  const totalIngBatch = ings.reduce((s, i) => s + (i.pkgWeight > 0 ? (i.pkgPrice / i.pkgWeight) * i.used : 0), 0)
  const structBatch   = (prepTime / 60) * cph
  const ingUnit       = recipeQty > 0 ? totalIngBatch / recipeQty : 0
  const structUnit    = recipeQty > 0 ? structBatch / recipeQty : 0
  const baseUnit      = ingUnit + packaging + structUnit
  const ded           = (margin + tax + chanFee) / 100
  const sugPrice      = ded < 1 && ded >= 0 ? baseUnit / (1 - ded) : 0
  const custNum       = parseFloat(customPrice) || 0
  const anaPrice      = custNum > 0 ? custNum : sugPrice
  const chanAmt       = anaPrice * (chanFee / 100)
  const taxAmt        = anaPrice * (tax / 100)
  const profit        = anaPrice - chanAmt - taxAmt - baseUnit
  const netPct        = anaPrice > 0 ? (profit / anaPrice) * 100 : 0

  // Health indicator
  let hBg = '#fdf2f2', hBorder = '#f5b7b7', hText = '#7a1f1f', hDotColor = '#c0392b'
  let hMsg = 'Margem Perigosa — Você está pagando para trabalhar ou quebrando a empresa.'
  if (netPct >= 25) {
    hBg = '#f2faf4'; hBorder = C.asparagusLt; hText = '#1a4a22'; hDotColor = C.asparagus
    hMsg = 'Margem Saudável e Altamente Lucrativa!'
  } else if (netPct >= 11) {
    hBg = '#fdf8ed'; hBorder = '#f0c96a'; hText = '#6b4c10'; hDotColor = '#d4a017'
    hMsg = 'Margem de Alerta — Lucro aceitável, mas apertado.'
  }

  // ── Auto-alerta de margem perigosa via n8n ────────────────────────────────
  useEffect(() => {
    if (netPct > 0 && netPct < 10 && baseUnit > 0) {
      alertarMargemPerigosa({ prodName, netPct, baseUnit, sugPrice, custNum, margin, tax, channel })
    }
  }, [netPct])

  // ── Carregar histórico ────────────────────────────────────────────────────
  const loadHistorico = useCallback(async () => {
    setLoadingHist(true)
    const data = await carregarHistorico()
    setHistorico(data)
    setHistLoaded(true)
    setLoadingHist(false)
  }, [])

  // ── Carregar pedidos ──────────────────────────────────────────────────────
  const loadPedidos = useCallback(async () => {
    setLoadingPed(true)
    const data = await carregarPedidos()
    setPedidos(data)
    setPedLoaded(true)
    setLoadingPed(false)
  }, [])

  // ── Mudar aba ──────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'history' && !histLoaded) loadHistorico()
    if (tab === 'orders' && !pedLoaded) loadPedidos()
  }

  // ── Salvar precificação ───────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!prodName || baseUnit <= 0) return
    setSaving(true)
    setSaveMsg(null)
    const result = await salvarPrecificacao({ prodName, baseUnit, sugPrice, custNum, netPct, margin, tax, channel, prepTime, recipeQty, ings })
    setSaving(false)
    if (result) {
      setSaveMsg({ ok: true, text: `"${prodName}" salvo com sucesso!` })
      setHistLoaded(false) // força reload na próxima vez que abrir Histórico
    } else {
      setSaveMsg({ ok: false, text: 'Erro ao salvar. Verifique a configuração do Supabase.' })
    }
    setTimeout(() => setSaveMsg(null), 5000)
  }

  // ── Excluir pedido ────────────────────────────────────────────────────────
  const handleExcluirPedido = async () => {
    if (!deleteOrder) return
    setDeletingPed(true)
    const result = await excluirPedido(deleteOrder['Nº Pedido'])
    setDeletingPed(false)
    if (result) {
      setPedidos(prev => prev.filter(p => p['Nº Pedido'] !== deleteOrder['Nº Pedido']))
      setPedMsg({ ok: true, text: `Pedido ${deleteOrder['Nº Pedido']} excluído com sucesso.` })
    } else {
      setPedMsg({ ok: false, text: 'Erro ao excluir. Tente novamente.' })
    }
    setDeleteOrder(null)
    setTimeout(() => setPedMsg(null), 4000)
  }

  // ── Registrar pedido ──────────────────────────────────────────────────────
  const handleRegistrarPedido = async () => {
    if (!novoPedido.clientName || !novoPedido.product || !novoPedido.unitPrice) return
    setSavingPed(true)
    setPedMsg(null)
    const result = await registrarPedido(novoPedido)
    setSavingPed(false)
    if (result?.success) {
      setPedMsg({ ok: true, text: `Pedido ${result.numeroPedido} registrado com sucesso!` })
      setNovoPedido(PEDIDO_VAZIO)
      setPedLoaded(false)
      loadPedidos()
    } else {
      setPedMsg({ ok: false, text: 'Erro ao registrar. Verifique a configuração do Supabase.' })
    }
    setTimeout(() => setPedMsg(null), 6000)
  }

  // ── Handlers recipe / ingredients ─────────────────────────────────────────
  const loadRecipe = (key) => {
    setRecipeKey(key)
    if (RECIPES[key]) {
      const r = RECIPES[key]
      setProdName(r.name); setPrepTime(r.prepTime); setRecipeQty(r.qty)
      setPackaging(r.packaging); setIngs(r.ingredients.map(i => ({ ...i })))
    }
    setCustomPrice('')
  }

  const addIng    = () => { idSeq++; setIngs(p => [...p, { id: idSeq, name: 'Novo Ingrediente', pkgPrice: 0, pkgWeight: 500, used: 0, unit: 'g' }]) }
  const removeIng = (id) => setIngs(p => p.filter(i => i.id !== id))
  const updateIng = (id, f, v) => setIngs(p => p.map(i => i.id === id ? { ...i, [f]: (f === 'name' || f === 'unit') ? v : (parseFloat(v) || 0) } : i))
  const updFixed  = (f, v) => setFixed(p => ({ ...p, [f]: parseFloat(v) || 0 }))
  const updPedido = (f, v) => setNovoPedido(p => ({ ...p, [f]: v }))

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen p-3 sm:p-4 max-w-[1300px] mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 sm:p-6 mb-4 relative overflow-hidden" style={{ background: C.feldgrau }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: C.peach }} />
        <div className="absolute -bottom-6 left-52 w-20 h-20 rounded-full opacity-10" style={{ background: C.asparagus }} />
        <div className="flex justify-between items-center flex-wrap gap-4 relative">
          <div className="flex items-center gap-5">
            <PitaLogo width={window.innerWidth < 480 ? 90 : 130} />
            <div>
              <p className="text-[11px] font-bold tracking-[3px] uppercase mb-1" style={{ color: C.peachLt }}>
                Software de Precificação
              </p>
              <p className="text-[13px] font-serif italic" style={{ color: 'rgba(250,189,151,0.65)' }}>
                Doceria Artesanal
              </p>
            </div>
          </div>
          <div className="rounded-lg px-6 py-4 text-center border w-full sm:w-auto" style={{ background: 'rgba(250,189,151,0.1)', borderColor: 'rgba(250,189,151,0.2)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: C.peachLt }}>Custo / Hora de Estrutura</p>
            <p className="text-4xl font-bold font-serif mt-1" style={{ color: C.peach }}>{brl(cph)}</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(250,189,151,0.5)' }}>Total fixo: {brl(totalFixed)}/mês</p>
          </div>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl border" style={{ background: C.grayLt, borderColor: C.grayMid }}>
        {[
          { k: 'pricing',   l: 'Precificação', icon: DollarSign },
          { k: 'history',   l: 'Histórico',    icon: Clock      },
          { k: 'orders',    l: 'Pedidos',      icon: ShoppingBag },
          { k: 'dashboard', l: 'Painel Financeiro', icon: BarChart3  },
        ].map(({ k, l, icon: Icon }) => (
          <button
            key={k}
            onClick={() => handleTabChange(k)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-bold transition-all"
            style={{
              background: activeTab === k ? C.feldgrau : 'transparent',
              color:      activeTab === k ? C.peach    : C.textMuted,
            }}
          >
            <Icon size={15} />
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PRECIFICAÇÃO
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pricing' && (
        <>
          {/* Custos fixos */}
          <Card>
            <button onClick={() => setShowFixed(s => !s)} className="w-full flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
                  <Settings size={14} color={C.peach} />
                </div>
                <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>Configurações de Custos Fixos</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.peachLt, color: C.feldgrauDk }}>Editável</span>
              </div>
              {showFixed ? <ChevronUp size={16} color={C.feldgrauLt} /> : <ChevronDown size={16} color={C.feldgrauLt} />}
            </button>
            {showFixed && (
              <div className="mt-4 pt-4 border-t grid gap-3" style={{ borderColor: C.grayLt, gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))' }}>
                {[
                  { f: 'water',  l: 'Água (R$)' },
                  { f: 'energy', l: 'Energia (R$)' },
                  { f: 'rent',   l: 'Aluguel (R$)' },
                  { f: 'salary', l: 'Salário Desejado (R$)' },
                  { f: 'hours',  l: 'Horas/Mês' },
                ].map(({ f, l }) => (
                  <div key={f}>
                    <Label>{l}</Label>
                    <Input type="number" value={fixed[f]} onChange={e => updFixed(f, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Grid principal */}
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px]">
            {/* LEFT */}
            <div>
              {/* Produto */}
              <Card>
                <SectionTitle icon={ChefHat}>Seleção de Produto / Receita Base</SectionTitle>
                <div className="mb-4">
                  <Label>Produto pré-carregado</Label>
                  <Select value={recipeKey} onChange={e => loadRecipe(e.target.value)}>
                    <option value="ovo-pao-de-mel">Ovo Pão de Mel</option>
                    <option value="cookies">Cookies</option>
                    <option value="pao-mel-colmeia">Pão de Mel Colmeia</option>
                    <option value="pao-mel-tradicional">Pão de Mel Tradicional</option>
                    <option value="massa-amanteigada">Massa Amanteigada</option>
                    <option value="ganache-maracuja">Ganache de Maracujá</option>
                    <option value="buttercream">Buttercream</option>
                    <option value="personalizado">Outro / Personalizado</option>
                  </Select>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                  <div>
                    <Label>Nome do Produto</Label>
                    <Input value={prodName} onChange={e => setProdName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Preparo (min)</Label>
                    <Input type="number" value={prepTime} onChange={e => setPrepTime(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>Rendimento (un)</Label>
                    <Input type="number" value={recipeQty} onChange={e => setRecipeQty(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>Embalagem (R$)</Label>
                    <Input type="number" step="0.01" value={packaging} onChange={e => setPackaging(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </Card>

              {/* Ingredientes */}
              <Card>
                <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.grayLt }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
                      <Package size={14} color={C.peach} />
                    </div>
                    <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>Tabela de Ingredientes</span>
                  </div>
                  <button
                    onClick={addIng}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide"
                    style={{ background: C.feldgrau, color: C.peach }}
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                </div>

                <div className="overflow-x-auto -mx-2 px-2 pb-1">
                <div className="min-w-[640px]">
                <div className="grid gap-1.5 mb-2 px-2.5 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 58px 90px 34px', background: C.grayLt, color: C.feldgrau }}>
                  {['Ingrediente', 'Preço Pacote', 'Peso/Vol.', 'Qtd Usada', 'Unid.', 'Custo Real', ''].map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>

                {ings.map((ing, idx) => {
                  const uc = ing.pkgWeight > 0 ? (ing.pkgPrice / ing.pkgWeight) * ing.used : 0
                  return (
                    <div key={ing.id} className="grid gap-1.5 mb-1.5 px-2.5 py-1.5 rounded-md border items-center"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 58px 90px 34px', background: idx % 2 === 0 ? C.white : C.offWhite, borderColor: C.grayLt }}>
                      <Input value={ing.name} onChange={e => updateIng(ing.id, 'name', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                      <Input type="number" step="0.01" value={ing.pkgPrice} onChange={e => updateIng(ing.id, 'pkgPrice', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                      <Input type="number" value={ing.pkgWeight} onChange={e => updateIng(ing.id, 'pkgWeight', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                      <Input type="number" value={ing.used} onChange={e => updateIng(ing.id, 'used', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                      <select
                        value={ing.unit || 'g'}
                        onChange={e => updateIng(ing.id, 'unit', e.target.value)}
                        className="w-full rounded-md border text-center cursor-pointer"
                        style={{ fontSize: 12, padding: '5px 2px', borderColor: C.grayMid, color: C.textDark, background: C.white }}
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                      </select>
                      <span className="font-bold text-[13px]" style={{ color: C.feldgrau }}>{brl(uc)}</span>
                      <button onClick={() => removeIng(ing.id)} className="w-[30px] h-[30px] rounded flex items-center justify-center text-xs border" style={{ background: C.grayLt, borderColor: C.grayMid, color: C.textMuted }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}

                </div></div>
                <div className="flex justify-end mt-3 px-3 py-2.5 rounded-lg" style={{ background: C.feldgrau }}>
                  <span className="text-[12px] font-semibold" style={{ color: C.peachLt }}>
                    Total ingredientes (lote):{' '}
                    <strong className="text-[16px] font-serif" style={{ color: C.peach }}>{brl(totalIngBatch)}</strong>
                  </span>
                </div>
              </Card>

              {/* Canal + Margem */}
              <Card>
                <SectionTitle icon={Store}>Canal de Venda, Margem e Impostos</SectionTitle>
                <div className="mb-4">
                  <Label>Canal de Venda</Label>
                  <div className="flex gap-2">
                    {[
                      { k: 'direct', l: 'Venda Direta / Balcão', sub: '0% de taxa' },
                      { k: 'ifood',  l: 'iFood / Delivery',       sub: '25% de taxa' },
                    ].map(({ k, l, sub }) => (
                      <button key={k} onClick={() => setChannel(k)}
                        className="flex-1 px-3 py-3 rounded-lg text-left text-[13px] font-bold border-2 transition-colors"
                        style={{ borderColor: channel === k ? C.feldgrau : C.grayMid, background: channel === k ? C.feldgrau : C.white, color: channel === k ? C.peach : C.textMuted }}>
                        {l}<br /><span className="font-normal text-[11px] opacity-75">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Margem de Lucro Desejada (%)</Label>
                    <Input type="number" value={margin} onChange={e => setMargin(parseFloat(e.target.value) || 0)} min="0" max="100" />
                  </div>
                  <div>
                    <Label>Imposto / Nota Fiscal (%)</Label>
                    <Input type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} min="0" max="100" />
                  </div>
                </div>
              </Card>

              {/* Preço Manual */}
              <Card style={{ background: C.offWhite, borderColor: C.peachLt }}>
                <SectionTitle icon={Tag}>Preço Praticado <span className="font-normal text-[11px]" style={{ color: C.textMuted }}>(opcional)</span></SectionTitle>
                <Label>Digite o preço que você pratica — deixe em branco para usar o preço sugerido</Label>
                <Input type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                  placeholder="Ex: 12.90"
                  style={{ fontSize: 20, fontWeight: 700, padding: '10px 14px', fontFamily: 'Georgia,serif', borderColor: C.peach, color: C.feldgrau }} />
              </Card>
            </div>

            {/* RIGHT */}
            <div>
              {/* Decomposição */}
              <Card>
                <div className="font-bold text-sm font-serif mb-4 pb-3 border-b flex items-center gap-2" style={{ color: C.feldgrau, borderColor: C.grayLt }}>
                  <BarChart3 size={15} color={C.peachDk} /> Decomposição de Custos
                </div>
                {[
                  { l: 'Ingredientes / unid.', v: ingUnit,   dot: C.feldgrau  },
                  { l: 'Embalagem / unid.',    v: packaging, dot: C.asparagus },
                  { l: 'Estrutura / unid.',    v: structUnit, dot: C.peachDk  },
                ].map(({ l, v, dot }) => (
                  <div key={l} className="flex justify-between items-center mb-2 px-3 py-2 rounded-md border" style={{ background: C.offWhite, borderColor: C.grayLt }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                      <span className="text-[12px]" style={{ color: C.textMid }}>{l}</span>
                    </div>
                    <span className="font-bold text-[13px]" style={{ color: C.feldgrau }}>{brl(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3.5 py-3 rounded-lg mt-1" style={{ background: C.feldgrau }}>
                  <span className="font-bold text-[12px]" style={{ color: C.peachLt }}>Custo Base / unid.</span>
                  <span className="font-bold text-[18px] font-serif" style={{ color: C.peach }}>{brl(baseUnit)}</span>
                </div>
                <div className="mt-3 rounded-lg p-3" style={{ background: C.grayLt }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.feldgrauLt }}>Detalhamento de Estrutura</p>
                  {[
                    { l: 'Custo/hora',             v: `${brl(cph)}/h` },
                    { l: 'Tempo de preparo',       v: `${prepTime} min` },
                    { l: 'Custo estrutura (lote)', v: brl(structBatch) },
                    { l: 'Rendimento',             v: `${recipeQty} unidades` },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between text-[11px] mb-1" style={{ color: C.textMuted }}>
                      <span>{l}</span><span className="font-semibold" style={{ color: C.textMid }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resultados */}
              <div className="rounded-xl p-5 mb-3 relative overflow-hidden" style={{ background: C.feldgrau }}>
                <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10" style={{ background: C.peach }} />
                <div className="flex items-center gap-2 mb-4 relative">
                  <DollarSign size={16} color={C.peachLt} />
                  <span className="font-bold text-[13px] font-serif" style={{ color: C.peachLt }}>Painel de Resultados</span>
                  {custNum > 0 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.peachDk, color: C.feldgrauDk }}>MANUAL</span>}
                </div>

                <div className="text-center mb-4 py-4 rounded-xl border" style={{ background: 'rgba(250,189,151,0.08)', borderColor: 'rgba(250,189,151,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] mb-1" style={{ color: 'rgba(250,189,151,0.65)' }}>
                    {custNum > 0 ? 'Preço Praticado' : 'Preço Sugerido Ideal'}
                  </p>
                  <p className="text-[38px] font-bold font-serif leading-none" style={{ color: C.peach }}>{brl(anaPrice)}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(250,189,151,0.45)' }}>por unidade</p>
                </div>

                {[
                  { l: 'Receita Bruta',                                      v: anaPrice, pos: true  },
                  { l: `Taxa ${channel === 'ifood' ? 'iFood' : 'Canal'} (${chanFee}%)`, v: chanAmt, pos: false },
                  { l: `Imposto NF (${tax}%)`,                               v: taxAmt,   pos: false },
                  { l: 'Custo Base/unid.',                                   v: baseUnit, pos: false },
                ].map(({ l, v, pos }) => (
                  <div key={l} className="flex justify-between mb-1.5 text-[12px]">
                    <span style={{ color: 'rgba(250,189,151,0.6)' }}>{l}</span>
                    <span className="font-bold" style={{ color: pos ? C.peachLt : 'rgba(255,255,255,0.45)' }}>
                      {pos ? brl(v) : `- ${brl(v)}`}
                    </span>
                  </div>
                ))}

                <div className="border-t mt-3 pt-3" style={{ borderColor: 'rgba(250,189,151,0.15)' }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-[12px]" style={{ color: C.peachLt }}>Lucro Líquido / unid.</span>
                    <span className="font-bold text-[18px] font-serif" style={{ color: profit >= 0 ? C.asparagusLt : '#f87171' }}>{brl(profit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px]" style={{ color: 'rgba(250,189,151,0.55)' }}>Margem Líquida Real</span>
                    <span className="font-bold text-[28px] font-serif" style={{ color: netPct >= 25 ? C.asparagusLt : netPct >= 11 ? '#f0c96a' : '#f87171' }}>
                      {pct(netPct)}
                    </span>
                  </div>
                </div>

                {/* ── BOTÃO SALVAR ────────────────────────────────────────── */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(250,189,151,0.15)' }}>
                  <button
                    onClick={handleSalvar}
                    disabled={saving || baseUnit <= 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-all"
                    style={{
                      background: saving || baseUnit <= 0 ? 'rgba(250,189,151,0.2)' : C.peach,
                      color:      saving || baseUnit <= 0 ? 'rgba(250,189,151,0.5)' : C.feldgrauDk,
                      cursor:     saving || baseUnit <= 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving
                      ? <><Loader size={16} className="animate-spin" /> Salvando no Google Sheets...</>
                      : <><Save size={16} /> Salvar Precificação</>}
                  </button>
                </div>
              </div>

              {/* Toast salvar */}
              {saveMsg && <Toast msg={saveMsg} />}

              {/* Health */}
              <div className="rounded-xl p-3.5 mb-3 border-2" style={{ background: hBg, borderColor: hBorder }}>
                <div className="flex items-start gap-2">
                  <span className="text-[18px] mt-0.5 flex-shrink-0" style={{ color: hDotColor }}>●</span>
                  <span className="font-bold text-[13px] leading-snug" style={{ color: hText }}>{hMsg}</span>
                </div>
                {netPct >= 11 && netPct < 25 && <p className="mt-2 text-[11px] pl-6" style={{ color: hText, opacity: 0.8 }}>Considere aumentar o preço ou reduzir custos.</p>}
                {netPct < 11  && netPct > 0 && <p className="mt-2 text-[11px] pl-6" style={{ color: hText, opacity: 0.8 }}>⚡ Alerta registrado — revise seu preço urgente!</p>}
              </div>

              {custNum > 0 && (
                <div className="rounded-xl p-3 mb-3 border" style={{ background: `${C.asparagus}18`, borderColor: C.asparagusLt }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.asparagus }}>Preço Sugerido pelo Sistema</p>
                  <p className="text-[22px] font-bold font-serif" style={{ color: C.feldgrauDk }}>{brl(sugPrice)}</p>
                  <p className="text-[11px] mt-1" style={{ color: C.feldgrauLt }}>Diferença: {brl(custNum - sugPrice)} vs sugerido</p>
                </div>
              )}

              {/* Fórmula */}
              <div className="rounded-xl p-3" style={{ background: C.grayLt }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.feldgrauLt }}>Fórmula Aplicada</p>
                <div className="rounded-lg p-2.5 border font-serif text-[12px] leading-7" style={{ background: C.white, borderColor: C.grayMid, color: C.feldgrau }}>
                  Preço = CustoBase ÷ (1 − Deduções)<br />
                  <span className="text-[10px]" style={{ color: C.textMuted }}>{margin}% margem + {tax}% imposto + {chanFee}% canal = {margin + tax + chanFee}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar de tendências */}
          <Card className="mt-1">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: C.grayLt }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
                <TrendingUp size={16} color={C.peach} />
              </div>
              <div>
                <p className="font-bold text-[17px] font-serif" style={{ color: C.feldgrau }}>Radar de Tendências de Confeitaria</p>
                <p className="text-[11px]" style={{ color: C.textMuted }}>Pesquisa de mercado · 2026</p>
              </div>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
              {TRENDS.map((t, i) => (
                <div key={i} className="rounded-xl p-4 border relative overflow-hidden" style={{ background: C.offWhite, borderColor: C.grayMid }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: i % 2 === 0 ? C.feldgrau : C.peach }} />
                  <div className="flex justify-between items-start mb-2 pt-1">
                    <span className="font-bold text-[13px] font-serif leading-snug pr-14" style={{ color: C.feldgrau }}>{t.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: i % 2 === 0 ? C.feldgrau : C.peach, color: i % 2 === 0 ? C.peach : C.feldgrauDk }}>{t.tag}</span>
                  </div>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-2" style={{ background: C.grayLt, color: C.feldgrauLt }}>Tendência: {t.trend}</span>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: C.textMuted }}>{t.desc}</p>
                  <div className="rounded-lg px-3 py-2" style={{ background: C.feldgrau }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.peachLt }}>Preço Médio de Mercado</p>
                    <p className="font-bold text-[14px] font-serif" style={{ color: C.peach }}>{t.range}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: HISTÓRICO
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <Card>
          <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: C.grayLt }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
                <Clock size={16} color={C.peach} />
              </div>
              <div>
                <p className="font-bold text-[16px] font-serif" style={{ color: C.feldgrau }}>Histórico de Precificações</p>
                <p className="text-[11px]" style={{ color: C.textMuted }}>Dados em nuvem · {historico.length} registros</p>
              </div>
            </div>
            <button
              onClick={loadHistorico}
              disabled={loadingHist}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold border"
              style={{ background: C.grayLt, borderColor: C.grayMid, color: C.feldgrau }}
            >
              <RefreshCw size={13} className={loadingHist ? 'animate-spin' : ''} />
              {loadingHist ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>

          {loadingHist && (
            <div className="flex items-center justify-center py-16 gap-3" style={{ color: C.textMuted }}>
              <Loader size={22} className="animate-spin" style={{ color: C.feldgrau }} />
              <span className="text-[13px]">Buscando dados na nuvem...</span>
            </div>
          )}

          {!loadingHist && historico.length === 0 && (
            <div className="text-center py-16" style={{ color: C.textMuted }}>
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px] font-semibold">Nenhum registro ainda.</p>
              <p className="text-[12px] mt-1">Salve uma precificação na aba Precificação para ver o histórico aqui.</p>
            </div>
          )}

          {!loadingHist && historico.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ background: C.feldgrau, color: C.peachLt }}>
                    {['Data/Hora', 'Produto', 'Custo Base', 'Preço Final', 'Margem Líq.', 'Saúde', 'Canal'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historico.map((row, i) => {
                    const margem = parseFloat(row['Margem Líq. (%)'] || 0)
                    const saudeColor = margem >= 25 ? C.asparagus : margem >= 11 ? '#d4a017' : '#c0392b'
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.offWhite, borderBottom: `1px solid ${C.grayLt}` }}>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.textMuted }}>{row['Data/Hora']}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.feldgrau }}>{row['Produto']}</td>
                        <td className="px-3 py-2.5" style={{ color: C.textMid }}>R$ {parseFloat(row['Custo Base (R$)'] || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: C.feldgrau }}>R$ {parseFloat(row['Preço Final (R$)'] || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: saudeColor }}>{margem.toFixed(1)}%</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${saudeColor}20`, color: saudeColor }}>
                            {row['Saúde'] || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: C.textMuted }}>{row['Canal'] || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PEDIDOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <>
          {/* Formulário de pedido */}
          <Card>
            <SectionTitle icon={ClipboardList}>Registrar Novo Pedido</SectionTitle>
            <Toast msg={pedMsg} />

            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <Label><span className="flex items-center gap-1"><MessageSquare size={10} /> Nome do Cliente *</span></Label>
                <Input value={novoPedido.clientName} onChange={e => updPedido('clientName', e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><Phone size={10} /> WhatsApp *</span></Label>
                <Input value={novoPedido.phone} onChange={e => updPedido('phone', e.target.value)} placeholder="+55 11 99999-9999" />
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><ChefHat size={10} /> Produto *</span></Label>
                <Input value={novoPedido.product} onChange={e => updPedido('product', e.target.value)} placeholder="Ex: Ovo Pão de Mel" />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" value={novoPedido.qty} onChange={e => updPedido('qty', parseInt(e.target.value) || 1)} min="1" />
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><DollarSign size={10} /> Preço Unitário (R$) *</span></Label>
                <Input type="number" step="0.01" value={novoPedido.unitPrice} onChange={e => updPedido('unitPrice', e.target.value)} placeholder="Ex: 12.90" />
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><Calendar size={10} /> Data de Entrega</span></Label>
                <Input type="date" value={novoPedido.deliveryDate} onChange={e => updPedido('deliveryDate', e.target.value)} />
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><CreditCard size={10} /> Forma de Pagamento</span></Label>
                <Select value={novoPedido.payment} onChange={e => updPedido('payment', e.target.value)}>
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                  <option>Transferência</option>
                </Select>
              </div>
              <div>
                <Label><span className="flex items-center gap-1"><Store size={10} /> Canal de Venda</span></Label>
                <Select value={novoPedido.canal} onChange={e => updPedido('canal', e.target.value)}>
                  <option value="direto">Venda Direta</option>
                  <option value="ifood">iFood</option>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Input value={novoPedido.notes} onChange={e => updPedido('notes', e.target.value)} placeholder="Ex: sem glúten, entrega no trabalho" />
              </div>
            </div>

            {/* Resumo rápido */}
            {novoPedido.unitPrice && novoPedido.qty && (
              <div className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between" style={{ background: C.feldgrau }}>
                <span className="text-[12px]" style={{ color: C.peachLt }}>Valor total do pedido:</span>
                <span className="font-bold text-[20px] font-serif" style={{ color: C.peach }}>
                  {brl((parseFloat(novoPedido.unitPrice) || 0) * (novoPedido.qty || 1))}
                </span>
              </div>
            )}

            <button
              onClick={handleRegistrarPedido}
              disabled={savingPed || !novoPedido.clientName || !novoPedido.product || !novoPedido.unitPrice}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px]"
              style={{
                background: savingPed || !novoPedido.clientName || !novoPedido.product || !novoPedido.unitPrice
                  ? C.grayMid : C.feldgrau,
                color: savingPed || !novoPedido.clientName || !novoPedido.product || !novoPedido.unitPrice
                  ? C.white : C.peach,
                cursor: savingPed || !novoPedido.clientName || !novoPedido.product || !novoPedido.unitPrice
                  ? 'not-allowed' : 'pointer',
              }}
            >
              {savingPed
                ? <><Loader size={16} className="animate-spin" /> Registrando...</>
                : <><ShoppingBag size={16} /> Registrar Pedido</>}
            </button>
            <p className="text-[10px] text-center mt-2" style={{ color: C.textMuted }}>
              Ao confirmar, o pedido é salvo na nuvem e fica disponível de qualquer dispositivo.
            </p>
          </Card>

          {/* Lista de pedidos */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.grayLt }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
                  <ShoppingBag size={14} color={C.peach} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>
                    Pedidos Registrados
                  </span>
                  {pedidos.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.peachLt, color: C.feldgrauDk }}>
                      {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={loadPedidos} disabled={loadingPed}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border"
                style={{ background: C.grayLt, borderColor: C.grayMid, color: C.feldgrau }}>
                <RefreshCw size={12} className={loadingPed ? 'animate-spin' : ''} />
                {loadingPed ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>

            {loadingPed && (
              <div className="flex items-center justify-center py-12 gap-3" style={{ color: C.textMuted }}>
                <Loader size={20} className="animate-spin" style={{ color: C.feldgrau }} />
                <span className="text-[13px]">Buscando pedidos na nuvem...</span>
              </div>
            )}

            {!loadingPed && pedidos.length === 0 && (
              <div className="text-center py-12" style={{ color: C.textMuted }}>
                <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-[14px] font-semibold">Nenhum pedido registrado ainda.</p>
                <p className="text-[12px] mt-1">Use o formulário acima para registrar o primeiro pedido.</p>
              </div>
            )}

            {!loadingPed && pedidos.length > 0 && pedidos.map((row, i) => {
              const STATUS_STYLE = {
                'Pronto':     { bg: '#e8f5e9', color: '#2e7d32' },
                'Pendente':   { bg: '#fff8e1', color: '#e65100' },
                'Cancelado':  { bg: '#ffebee', color: '#c62828' },
                'Recebido':   { bg: '#e8f0fe', color: '#1a73e8' },
                'Em Preparo': { bg: '#f3e5f5', color: '#7b1fa2' },
              }
              const stt = STATUS_STYLE[row['Status']] || { bg: C.grayLt, color: C.textMuted }
              const qty = row['Quantidade'] || 1
              return (
                <div key={i} className="flex items-start gap-3 sm:gap-4 p-4 mb-3 rounded-xl border bg-white"
                  style={{ borderColor: C.grayLt }}>

                  {/* Left circle */}
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: C.peachLt, border: `2px solid ${C.peach}` }}>
                    <ShoppingBag size={15} style={{ color: C.peachDk }} />
                  </div>

                  {/* Center */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] leading-tight truncate" style={{ color: C.feldgrau }}>
                      {row['Nº Pedido']} · {row['Cliente']}
                    </p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: C.textMuted }}>
                      {qty}x {row['Produto']}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <select
                        value={row['Status'] || 'Recebido'}
                        onChange={async e => {
                          const novoStatus = e.target.value
                          setPedidos(prev => prev.map(p =>
                            p['Nº Pedido'] === row['Nº Pedido'] ? { ...p, 'Status': novoStatus } : p
                          ))
                          await atualizarStatusPedido(row['Nº Pedido'], novoStatus)
                        }}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
                        style={{ background: stt.bg, color: stt.color, border: 'none', outline: 'none' }}
                      >
                        <option value="Recebido">Recebido</option>
                        <option value="Em Preparo">Em Preparo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Pronto">Pronto</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      <span className="text-[11px]" style={{ color: C.textMuted }}>{row['Data/Hora']}</span>
                      {row['Observações'] && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{ background: C.grayLt, color: C.textMuted, border: `1px solid ${C.grayMid}` }}>
                          <MessageSquare size={9} /> Obs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[15px] font-serif" style={{ color: C.feldgrau }}>
                      {brl(parseFloat(row['Valor Total'] || 0))}
                    </p>
                    <p className="text-[11px] mb-2" style={{ color: C.textMuted }}>
                      {qty} item{qty !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => setPrintOrder(row)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors hover:bg-gray-50"
                      style={{ background: C.white, borderColor: C.grayMid, color: C.textMid }}>
                      <Printer size={13} /> Imprimir
                    </button>
                    <button
                      onClick={() => setDeleteOrder(row)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors hover:bg-red-50 mt-1.5"
                      style={{ background: C.white, borderColor: '#f5b7b7', color: '#c0392b' }}>
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DASHBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <Suspense fallback={
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: '#7a8a7c' }}>
            <Loader size={22} className="animate-spin" style={{ color: '#525F54' }} />
            <span className="text-[13px]">Carregando dashboard…</span>
          </div>
        }>
          <Dashboard />
        </Suspense>
      )}

      {/* ── PRINT PREVIEW MODAL ─────────────────────────────────────────────── */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.grayLt }}>
              <div className="flex items-center gap-2">
                <Printer size={16} style={{ color: C.feldgrau }} />
                <span className="font-bold text-[14px]" style={{ color: C.feldgrau }}>Prévia do Cupom</span>
              </div>
              <button onClick={() => setPrintOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                <CloseX size={16} style={{ color: C.textMuted }} />
              </button>
            </div>

            {/* Receipt preview */}
            <div className="p-5 flex justify-center overflow-auto" style={{ maxHeight: '65vh', background: C.grayLt }}>
              <div style={{ width: 280, background: '#fff', fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: '#000', padding: '16px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>PiTa Doceria</div>
                <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 8 }}>Doceria Artesanal · Sinop, MT</div>
                <div style={{ borderTop: '1px dashed #333', margin: '5px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ fontSize: 10, color: '#555' }}>Pedido:</span>
                  <span style={{ fontWeight: 'bold' }}>{printOrder['Nº Pedido']}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ fontSize: 10, color: '#555' }}>Data:</span>
                  <span>{printOrder['Data/Hora']}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ fontSize: 10, color: '#555' }}>Cliente:</span>
                  <span style={{ fontWeight: 'bold' }}>{printOrder['Cliente']}</span>
                </div>
                {printOrder['Entrega'] && printOrder['Entrega'] !== '—' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Entrega:</span>
                    <span>{printOrder['Entrega']}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px dashed #333', margin: '5px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ flex: 1, paddingRight: 4 }}>{printOrder['Quantidade']}x {printOrder['Produto']}</span>
                  <span>R$ {parseFloat(printOrder['Valor Total'] || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ borderTop: '1px dashed #333', margin: '5px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13, margin: '3px 0' }}>
                  <span>TOTAL</span>
                  <span>R$ {parseFloat(printOrder['Valor Total'] || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span style={{ fontSize: 10, color: '#555' }}>Pagamento:</span>
                  <span>{printOrder['Pagamento'] || 'Pix'}</span>
                </div>
                {printOrder['Observações'] && (
                  <>
                    <div style={{ borderTop: '1px dashed #333', margin: '5px 0' }} />
                    <div style={{ fontSize: 10 }}><b>Obs:</b> {printOrder['Observações']}</div>
                  </>
                )}
                <div style={{ borderTop: '1px dashed #333', margin: '10px 0 5px' }} />
                <div style={{ textAlign: 'center', fontSize: 10, lineHeight: 1.7 }}>
                  Muito obrigada pela preferência! 🍫<br />
                  <span style={{ fontSize: 9 }}>pita-doceria.vercel.app</span>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-5 py-4 flex gap-3">
              <button
                onClick={() => setPrintOrder(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border"
                style={{ borderColor: C.grayMid, color: C.textMuted }}>
                Cancelar
              </button>
              <button
                onClick={() => { doPrint(printOrder); setPrintOrder(null) }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold"
                style={{ flex: 2, background: C.feldgrau, color: C.peach }}>
                <Printer size={15} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────────────── */}
      {deleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">

            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#fdf2f2' }}>
                <Trash2 size={22} style={{ color: '#c0392b' }} />
              </div>
              <p className="font-bold text-[15px] mb-1" style={{ color: C.feldgrau }}>Excluir pedido?</p>
              <p className="text-[13px] font-semibold" style={{ color: C.textMid }}>
                {deleteOrder['Nº Pedido']} · {deleteOrder['Cliente']}
              </p>
              <p className="text-[12px] mt-2" style={{ color: C.textMuted }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setDeleteOrder(null)}
                disabled={deletingPed}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border"
                style={{ borderColor: C.grayMid, color: C.textMuted }}>
                Cancelar
              </button>
              <button
                onClick={handleExcluirPedido}
                disabled={deletingPed}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold"
                style={{ flex: 2, background: deletingPed ? '#e88' : '#c0392b', color: '#fff', cursor: deletingPed ? 'not-allowed' : 'pointer' }}>
                {deletingPed
                  ? <><Loader size={14} className="animate-spin" /> Excluindo...</>
                  : <><Trash2 size={14} /> Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 py-5">
        <PitaLogo width={60} />
        <div>
          <p className="text-[11px] font-serif italic" style={{ color: C.feldgrauLt }}>Software de Precificação · Sinop, MT · 2026</p>
          <p className="text-[10px]" style={{ color: C.grayMid }}>Qualidade · Criatividade · Paixão · Acolhimento</p>
          <p className="text-[10px] mt-1" style={{ color: C.grayMid }}>Software criado por Regiane Machado</p>
        </div>
      </div>
    </div>
  )
}
