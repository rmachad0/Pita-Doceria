import { useState } from 'react'
import {
  Settings, ChefHat, Package, Store, Tag,
  TrendingUp, Plus, Trash2, DollarSign, BarChart3,
  ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Brand colors ────────────────────────────────────────────────────────────
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

// ── PiTa® Logo (SVG inline) ─────────────────────────────────────────────────
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

// ── Shared UI primitives ────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`bg-white rounded-xl border border-pita-grayMid/40 shadow-sm mb-4 p-5 ${className}`}
      style={style}
    >
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

// ── Recipe data ─────────────────────────────────────────────────────────────
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
      { id: 1, name: 'Farinha de Trigo',       pkgPrice: 5.00,  pkgWeight: 1000, used: 250 },
      { id: 2, name: 'Manteiga',               pkgPrice: 8.00,  pkgWeight: 200,  used: 150 },
      { id: 3, name: 'Açúcar Refinado',        pkgPrice: 4.00,  pkgWeight: 1000, used: 150 },
      { id: 4, name: 'Açúcar Mascavo',         pkgPrice: 8.00,  pkgWeight: 1000, used: 100 },
      { id: 5, name: 'Ovos (aprox.)',           pkgPrice: 12.00, pkgWeight: 600,  used: 50  },
      { id: 6, name: 'Chocolate Chips',        pkgPrice: 20.00, pkgWeight: 500,  used: 200 },
      { id: 7, name: 'Essência de Baunilha',   pkgPrice: 8.00,  pkgWeight: 30,   used: 5   },
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
      { id: 1, name: 'Manteiga sem Sal',      pkgPrice: 8.00, pkgWeight: 200,  used: 200 },
      { id: 2, name: 'Açúcar Refinado',       pkgPrice: 4.00, pkgWeight: 1000, used: 200 },
      { id: 3, name: 'Ovos (aprox.)',          pkgPrice: 12.00, pkgWeight: 600, used: 100 },
      { id: 4, name: 'Farinha de Trigo',      pkgPrice: 5.00,  pkgWeight: 1000, used: 400 },
      { id: 5, name: 'Essência de Baunilha',  pkgPrice: 8.00,  pkgWeight: 30,   used: 5   },
    ],
  },
  'ganache-maracuja': {
    name: 'Ganache de Maracujá', prepTime: 30, qty: 20, packaging: 0.50,
    ingredients: [
      { id: 1, name: 'Chocolate Branco',   pkgPrice: 28.00, pkgWeight: 1000, used: 400 },
      { id: 2, name: 'Creme de Leite',     pkgPrice: 5.00,  pkgWeight: 200,  used: 200 },
      { id: 3, name: 'Polpa de Maracujá',  pkgPrice: 10.00, pkgWeight: 400,  used: 100 },
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
  {
    name: 'Ovo Pão de Mel Gourmet', trend: 'Alta', tag: 'Tendência',
    range: 'R$ 65,00 a R$ 85,00',
    desc: 'Chocolate belga premium, recheio cremoso. Ideal para datas especiais e Páscoa. Alta margem por exclusividade.',
  },
  {
    name: 'Cookies Recheados / NYC Style', trend: 'Explosiva', tag: 'Explosivo',
    range: 'R$ 12,00 a R$ 18,00 / unid.',
    desc: 'Cookies gigantes americanos com recheio generoso. Tendência dominante nas docerias de 2025-2026.',
  },
  {
    name: 'Pão de Mel Colmeia Personalizado', trend: 'Alta — Eventos', tag: 'Eventos',
    range: 'R$ 8,00 a R$ 12,00 / unid.',
    desc: 'Muito procurado para lembrancinhas, casamentos e corporativos. Alta margem via personalização.',
  },
  {
    name: 'Bolos Decorados com Buttercream', trend: 'Altíssima — Casamentos', tag: 'Premium',
    range: 'R$ 150,00 a R$ 220,00 / kg',
    desc: 'Decorações florais artísticas. Casamentos e celebrações premium. Ticket médio elevado.',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    isNaN(v) || !isFinite(v) ? 0 : v
  )
const pct = (v) => `${(isNaN(v) || !isFinite(v) ? 0 : v).toFixed(1)}%`

let idSeq = 1000

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Fixed costs
  const [fixed, setFixed] = useState({ water: 200, energy: 137, rent: 2300, salary: 3000, hours: 208 })
  const [showFixed, setShowFixed] = useState(false)

  // Recipe state
  const [recipeKey, setRecipeKey]     = useState('ovo-pao-de-mel')
  const [prodName, setProdName]       = useState(RECIPES['ovo-pao-de-mel'].name)
  const [prepTime, setPrepTime]       = useState(RECIPES['ovo-pao-de-mel'].prepTime)
  const [recipeQty, setRecipeQty]     = useState(RECIPES['ovo-pao-de-mel'].qty)
  const [packaging, setPackaging]     = useState(RECIPES['ovo-pao-de-mel'].packaging)
  const [ings, setIngs]               = useState(() => RECIPES['ovo-pao-de-mel'].ingredients.map(i => ({ ...i })))

  // Pricing state
  const [channel, setChannel]         = useState('direct')
  const [margin, setMargin]           = useState(30)
  const [tax, setTax]                 = useState(6)
  const [customPrice, setCustomPrice] = useState('')

  // ── Calculations ──────────────────────────────────────────────────────────
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
  let hBg = '#fdf2f2', hBorder = '#f5b7b7', hText = '#7a1f1f', hDot = '●', hDotColor = '#c0392b'
  let hMsg = 'Margem Perigosa — Você está pagando para trabalhar ou quebrando a empresa.'
  if (netPct >= 25) {
    hBg = '#f2faf4'; hBorder = C.asparagusLt; hText = '#1a4a22'; hDot = '●'; hDotColor = C.asparagus
    hMsg = 'Margem Saudável e Altamente Lucrativa!'
  } else if (netPct >= 11) {
    hBg = '#fdf8ed'; hBorder = '#f0c96a'; hText = '#6b4c10'; hDot = '●'; hDotColor = '#d4a017'
    hMsg = 'Margem de Alerta — Lucro aceitável, mas apertado.'
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const loadRecipe = (key) => {
    setRecipeKey(key)
    if (RECIPES[key]) {
      const r = RECIPES[key]
      setProdName(r.name); setPrepTime(r.prepTime); setRecipeQty(r.qty)
      setPackaging(r.packaging); setIngs(r.ingredients.map(i => ({ ...i })))
    }
    setCustomPrice('')
  }

  const addIng    = () => { idSeq++; setIngs(p => [...p, { id: idSeq, name: 'Novo Ingrediente', pkgPrice: 0, pkgWeight: 500, used: 0 }]) }
  const removeIng = (id) => setIngs(p => p.filter(i => i.id !== id))
  const updateIng = (id, f, v) => setIngs(p => p.map(i => i.id === id ? { ...i, [f]: f === 'name' ? v : (parseFloat(v) || 0) } : i))
  const updFixed  = (f, v) => setFixed(p => ({ ...p, [f]: parseFloat(v) || 0 }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 max-w-[1300px] mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-6 mb-4 relative overflow-hidden" style={{ background: C.feldgrau }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: C.peach }} />
        <div className="absolute -bottom-6 left-52 w-20 h-20 rounded-full opacity-10" style={{ background: C.asparagus }} />
        <div className="flex justify-between items-center flex-wrap gap-4 relative">
          <div className="flex items-center gap-5">
            <PitaLogo width={130} />
            <div>
              <p className="text-[11px] font-bold tracking-[3px] uppercase mb-1" style={{ color: C.peachLt }}>
                Sistema de Precificação
              </p>
              <p className="text-[13px] font-serif italic" style={{ color: 'rgba(250,189,151,0.65)' }}>
                Doceria Artesanal de Alta Qualidade · 2026
              </p>
            </div>
          </div>
          <div className="rounded-lg px-6 py-4 text-center border" style={{ background: 'rgba(250,189,151,0.1)', borderColor: 'rgba(250,189,151,0.2)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: C.peachLt }}>Custo / Hora de Estrutura</p>
            <p className="text-4xl font-bold font-serif mt-1" style={{ color: C.peach }}>{brl(cph)}</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(250,189,151,0.5)' }}>Total fixo: {brl(totalFixed)}/mês</p>
          </div>
        </div>
      </div>

      {/* ── CUSTOS FIXOS ───────────────────────────────────────────────────── */}
      <Card>
        <button
          onClick={() => setShowFixed(s => !s)}
          className="w-full flex justify-between items-center"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
              <Settings size={14} color={C.peach} />
            </div>
            <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>Configurações de Custos Fixos</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.peachLt, color: C.feldgrauDk }}>Editável</span>
          </div>
          {showFixed
            ? <ChevronUp size={16} color={C.feldgrauLt} />
            : <ChevronDown size={16} color={C.feldgrauLt} />}
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

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 310px' }}>

        {/* LEFT COLUMN */}
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
            <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
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

            {/* Header */}
            <div className="grid gap-1.5 mb-2 px-2.5 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 90px 34px', background: C.grayLt, color: C.feldgrau }}>
              {['Ingrediente', 'Preço Pacote', 'Peso (g/ml)', 'Qtd Usada', 'Custo Real', ''].map((h, i) => (
                <span key={i}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {ings.map((ing, idx) => {
              const uc = ing.pkgWeight > 0 ? (ing.pkgPrice / ing.pkgWeight) * ing.used : 0
              return (
                <div
                  key={ing.id}
                  className="grid gap-1.5 mb-1.5 px-2.5 py-1.5 rounded-md border items-center"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 90px 34px', background: idx % 2 === 0 ? C.white : C.offWhite, borderColor: C.grayLt }}
                >
                  <Input value={ing.name} onChange={e => updateIng(ing.id, 'name', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                  <Input type="number" step="0.01" value={ing.pkgPrice} onChange={e => updateIng(ing.id, 'pkgPrice', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                  <Input type="number" value={ing.pkgWeight} onChange={e => updateIng(ing.id, 'pkgWeight', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                  <Input type="number" value={ing.used} onChange={e => updateIng(ing.id, 'used', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                  <span className="font-bold text-[13px]" style={{ color: C.feldgrau }}>{brl(uc)}</span>
                  <button
                    onClick={() => removeIng(ing.id)}
                    className="w-[30px] h-[30px] rounded flex items-center justify-center text-xs border"
                    style={{ background: C.grayLt, borderColor: C.grayMid, color: C.textMuted }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}

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
                  <button
                    key={k}
                    onClick={() => setChannel(k)}
                    className="flex-1 px-3 py-3 rounded-lg text-left text-[13px] font-bold border-2 transition-colors"
                    style={{
                      borderColor: channel === k ? C.feldgrau : C.grayMid,
                      background:  channel === k ? C.feldgrau  : C.white,
                      color:       channel === k ? C.peach     : C.textMuted,
                    }}
                  >
                    {l}<br />
                    <span className="font-normal text-[11px] opacity-75">{sub}</span>
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
          <Card className="border-pita-peachLt" style={{ background: C.offWhite, borderColor: C.peachLt }}>
            <SectionTitle icon={Tag}>
              Preço Praticado{' '}
              <span className="font-normal text-[11px]" style={{ color: C.textMuted }}>(opcional)</span>
            </SectionTitle>
            <Label>Digite o preço que você pratica — deixe em branco para usar o preço sugerido</Label>
            <Input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder="Ex: 12.90"
              style={{ fontSize: 20, fontWeight: 700, padding: '10px 14px', fontFamily: 'Georgia,serif', borderColor: C.peach, color: C.feldgrau }}
            />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Decomposição */}
          <Card>
            <div className="font-bold text-sm font-serif mb-4 pb-3 border-b flex items-center gap-2" style={{ color: C.feldgrau, borderColor: C.grayLt }}>
              <BarChart3 size={15} color={C.peachDk} /> Decomposição de Custos
            </div>
            {[
              { l: 'Ingredientes / unid.', v: ingUnit,    dot: C.feldgrau   },
              { l: 'Embalagem / unid.',    v: packaging,  dot: C.asparagus  },
              { l: 'Estrutura / unid.',    v: structUnit, dot: C.peachDk    },
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

            {/* Estrutura detail */}
            <div className="mt-3 rounded-lg p-3" style={{ background: C.grayLt }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.feldgrauLt }}>Detalhamento de Estrutura</p>
              {[
                { l: 'Custo/hora',              v: `${brl(cph)}/h` },
                { l: 'Tempo de preparo',        v: `${prepTime} min` },
                { l: 'Custo estrutura (lote)',  v: brl(structBatch) },
                { l: 'Rendimento',              v: `${recipeQty} unidades` },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between text-[11px] mb-1" style={{ color: C.textMuted }}>
                  <span>{l}</span>
                  <span className="font-semibold" style={{ color: C.textMid }}>{v}</span>
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
              {custNum > 0 && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.peachDk, color: C.feldgrauDk }}>MANUAL</span>
              )}
            </div>

            <div className="text-center mb-4 py-4 rounded-xl border" style={{ background: 'rgba(250,189,151,0.08)', borderColor: 'rgba(250,189,151,0.15)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] mb-1" style={{ color: 'rgba(250,189,151,0.65)' }}>
                {custNum > 0 ? 'Preço Praticado' : 'Preço Sugerido Ideal'}
              </p>
              <p className="text-[38px] font-bold font-serif leading-none" style={{ color: C.peach }}>{brl(anaPrice)}</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(250,189,151,0.45)' }}>por unidade</p>
            </div>

            {[
              { l: 'Receita Bruta',                                    v: anaPrice, pos: true  },
              { l: `Taxa ${channel === 'ifood' ? 'iFood' : 'Canal'} (${chanFee}%)`, v: chanAmt, pos: false },
              { l: `Imposto NF (${tax}%)`,                             v: taxAmt,   pos: false },
              { l: 'Custo Base/unid.',                                  v: baseUnit, pos: false },
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
          </div>

          {/* Health indicator */}
          <div className="rounded-xl p-3.5 mb-3 border-2" style={{ background: hBg, borderColor: hBorder }}>
            <div className="flex items-start gap-2">
              <span className="text-[18px] mt-0.5 flex-shrink-0" style={{ color: hDotColor }}>{hDot}</span>
              <span className="font-bold text-[13px] leading-snug" style={{ color: hText }}>{hMsg}</span>
            </div>
            {netPct >= 11 && netPct < 25 && <p className="mt-2 text-[11px] pl-6" style={{ color: hText, opacity: 0.8 }}>Considere aumentar o preço ou reduzir custos.</p>}
            {netPct < 11  && <p className="mt-2 text-[11px] pl-6" style={{ color: hText, opacity: 0.8 }}>Revise urgentemente seus custos ou aumente o preço.</p>}
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
              <span className="text-[10px]" style={{ color: C.textMuted }}>
                {margin}% margem + {tax}% imposto + {chanFee}% canal = {margin + tax + chanFee}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RADAR DE TENDÊNCIAS ────────────────────────────────────────────── */}
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
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-2" style={{ background: C.grayLt, color: C.feldgrauLt }}>
                Tendência: {t.trend}
              </span>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: C.textMuted }}>{t.desc}</p>
              <div className="rounded-lg px-3 py-2" style={{ background: C.feldgrau }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.peachLt }}>Preço Médio de Mercado</p>
                <p className="font-bold text-[14px] font-serif" style={{ color: C.peach }}>{t.range}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 py-5">
        <PitaLogo width={60} />
        <div>
          <p className="text-[11px] font-serif italic" style={{ color: C.feldgrauLt }}>Sistema de Precificação · 2026</p>
          <p className="text-[10px]" style={{ color: C.grayMid }}>Qualidade · Criatividade · Paixão · Acolhimento</p>
        </div>
      </div>
    </div>
  )
}
