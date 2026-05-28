import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Target, TrendingUp, DollarSign, ShoppingBag, Clock,
  CheckCircle, AlertTriangle, Settings2, ChevronDown, ChevronUp,
  BarChart3, Zap, Award, RefreshCw, Loader, Package, XCircle,
  Minus, Store, Bike,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { carregarPedidos } from '../services/supabase-integration'

// ── Brand colors (same as App.jsx) ───────────────────────────────────────────
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

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(isNaN(v) || !isFinite(v) ? 0 : v)

const STATUS_META = {
  'Recebido':   { bg: '#e8f0fe', color: '#1a73e8', Icon: ShoppingBag },
  'Em Preparo': { bg: '#f3e5f5', color: '#7b1fa2', Icon: Package },
  'Pendente':   { bg: '#fff8e1', color: '#e65100', Icon: AlertTriangle },
  'Pronto':     { bg: '#e8f5e9', color: '#2e7d32', Icon: CheckCircle },
  'Cancelado':  { bg: '#ffebee', color: '#c62828', Icon: XCircle },
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg text-[11px]"
      style={{ background: C.white, border: `1px solid ${C.grayMid}` }}>
      <p className="font-bold mb-1" style={{ color: C.feldgrau }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{brl(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, current, target, color, subLabel }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const reached = current >= target
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: C.textMid }}>{label}</span>
          {reached && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: C.asparagus, color: '#fff' }}>✓ Atingida</span>
          )}
        </div>
        <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.grayLt }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: C.textMuted }}>{subLabel}</span>
        <span className="text-[10px]" style={{ color: C.textMuted }}>
          {reached ? `+${brl(current - target)} acima` : `Falta ${brl(target - current)}`}
        </span>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {

  // ── Config ────────────────────────────────────────────────────────────────
  const [cfg, setCfg] = useState({
    fixedCosts:      5637,  // água 200 + energia 137 + aluguel 2300 + salário 3000
    targetProfit:    2000,
    workDays:        26,
    hoursPerDay:     8,
    variableCostPct: 35,
  })
  const [showCfg, setShowCfg] = useState(false)
  const updCfg = (f, v) => setCfg(p => ({ ...p, [f]: parseFloat(v) || 0 }))

  // ── Data ──────────────────────────────────────────────────────────────────
  const [pedidos, setPedidos]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await carregarPedidos()
    setPedidos(data)
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now        = new Date()
  const todayStr   = now.toLocaleDateString('pt-BR')
  const curMonth   = now.getMonth()
  const curYear    = now.getFullYear()
  const dayOfMonth = now.getDate()

  // ── Derived data ──────────────────────────────────────────────────────────
  const { active, monthly, today, statusSummary, chartData, canalSplit } = useMemo(() => {
    // active: não cancelados → usado no painel operacional
    const active = pedidos.filter(p => p['Status'] !== 'Cancelado')

    // billable: só "Recebido" → base de todo faturamento
    const billable = pedidos.filter(p => p['Status'] === 'Recebido')

    // toLocaleString('pt-BR') gera "27/05/2026, 11:04:15" — a vírgula após a data
    // quebra a comparação. datePart remove a vírgula para normalizar.
    const datePart = (str) => str?.split(' ')[0]?.replace(',', '') ?? ''

    const parseDate = (str) => {
      const parts = datePart(str).split('/')
      if (!parts || parts.length < 3) return null
      return { d: parseInt(parts[0]), m: parseInt(parts[1]) - 1, y: parseInt(parts[2]) }
    }

    const monthly = billable.filter(p => {
      const dt = parseDate(p['Data/Hora'])
      return dt && dt.m === curMonth && dt.y === curYear
    })

    const today = billable.filter(p => datePart(p['Data/Hora']) === todayStr)

    const statusSummary = Object.keys(STATUS_META).map(s => ({
      status: s,
      count:  pedidos.filter(p => p['Status'] === s).length,
      value:  pedidos.filter(p => p['Status'] === s)
                .reduce((sum, p) => sum + (parseFloat(p['Valor Total']) || 0), 0),
    }))

    // Chart: last 14 days — só pedidos com status Recebido
    const chartData = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i))
      const dStr = d.toLocaleDateString('pt-BR')
      const rev = billable
        .filter(p => datePart(p['Data/Hora']) === dStr)
        .reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0)
      return {
        dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Faturamento: parseFloat(rev.toFixed(2)),
      }
    })

    // Canal split (mês atual, apenas Recebido)
    const monthlyDireto = monthly.filter(p => (p['Canal'] || 'direto') === 'direto')
    const monthlyIfood  = monthly.filter(p => p['Canal'] === 'ifood')
    const canalSplit = {
      direto: {
        count: monthlyDireto.length,
        value: monthlyDireto.reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0),
      },
      ifood: {
        count: monthlyIfood.length,
        value: monthlyIfood.reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0),
      },
    }

    return { active, monthly, today, statusSummary, chartData, canalSplit }
  }, [pedidos, curMonth, curYear, todayStr])

  // ── Goals ─────────────────────────────────────────────────────────────────
  const wd  = cfg.workDays    || 1
  const hpd = cfg.hoursPerDay || 1

  const breakEven = {
    monthly: cfg.fixedCosts,
    daily:   cfg.fixedCosts / wd,
    hourly:  cfg.fixedCosts / wd / hpd,
  }
  const success = {
    monthly: cfg.fixedCosts + cfg.targetProfit,
    daily:   (cfg.fixedCosts + cfg.targetProfit) / wd,
    hourly:  (cfg.fixedCosts + cfg.targetProfit) / wd / hpd,
  }

  // Add goal line to chart
  const chartWithGoal = chartData.map(d => ({
    ...d,
    'Meta Diária': parseFloat(success.daily.toFixed(2)),
  }))

  // ── Realized figures ──────────────────────────────────────────────────────
  const grossMonthly  = monthly.reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0)
  const grossToday    = today.reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0)

  const workDaysElapsed    = Math.min(dayOfMonth, cfg.workDays)
  const hoursWorkedMonth   = Math.max(workDaysElapsed * hpd, 1)
  const grossHourly        = grossMonthly / hoursWorkedMonth

  const varCostMonthly = grossMonthly * (cfg.variableCostPct / 100)
  const totalCostMonthly = cfg.fixedCosts + varCostMonthly

  const varCostToday = grossToday * (cfg.variableCostPct / 100)
  const totalCostToday = (cfg.fixedCosts / wd) + varCostToday

  const varCostHourly = grossHourly * (cfg.variableCostPct / 100)
  const totalCostHourly = (cfg.fixedCosts / wd / hpd) + varCostHourly

  const netMonthly = grossMonthly - totalCostMonthly
  const netToday   = grossToday   - totalCostToday
  const netHourly  = grossHourly  - totalCostHourly

  const metaAtingida = netMonthly >= cfg.targetProfit

  // ── Profit color ──────────────────────────────────────────────────────────
  const profitColor  = netMonthly >= cfg.targetProfit ? C.asparagus
    : netMonthly >= 0 ? '#d4a017' : '#c0392b'
  const profitBg = netMonthly >= cfg.targetProfit ? '#f2faf4'
    : netMonthly >= 0 ? '#fdf8ed' : '#fdf2f2'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── CONFIG ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-4 sm:p-5" style={{ borderColor: C.grayMid }}>
        <button onClick={() => setShowCfg(s => !s)} className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.feldgrau }}>
              <Settings2 size={14} color={C.peach} />
            </div>
            <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>
              Configurações Financeiras
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: C.peachLt, color: C.feldgrauDk }}>Editável</span>
          </div>
          {showCfg
            ? <ChevronUp size={16} color={C.feldgrauLt} />
            : <ChevronDown size={16} color={C.feldgrauLt} />}
        </button>

        {showCfg && (
          <div className="mt-4 pt-4 border-t grid gap-3"
            style={{ borderColor: C.grayLt, gridTemplateColumns: 'repeat(auto-fit,minmax(158px,1fr))' }}>
            {[
              { f: 'fixedCosts',      l: 'Gastos Fixos/Mês (R$)',    step: '100' },
              { f: 'targetProfit',    l: 'Meta de Lucro Adicional (R$)', step: '100' },
              { f: 'workDays',        l: 'Dias Trabalhados/Mês',      step: '1' },
              { f: 'hoursPerDay',     l: 'Horas Trabalhadas/Dia',     step: '0.5' },
              { f: 'variableCostPct', l: 'Custo Variável (% da receita)', step: '1' },
            ].map(({ f, l, step }) => (
              <div key={f}>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: C.feldgrau }}>{l}</label>
                <input type="number" step={step} value={cfg[f]}
                  onChange={e => updCfg(f, e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-md border"
                  style={{ color: C.textDark, borderColor: C.grayMid }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── GOALS ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">

        {/* Break-even */}
        <div className="rounded-xl p-5 border" style={{ background: C.offWhite, borderColor: C.grayMid }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#e8f0fe' }}>
              <Target size={15} color="#1a73e8" />
            </div>
            <div>
              <p className="font-bold text-[13px] font-serif" style={{ color: C.feldgrau }}>
                Ponto de Equilíbrio
              </p>
              <p className="text-[10px]" style={{ color: C.textMuted }}>
                Mínimo para cobrir {brl(cfg.fixedCosts)} de fixos
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Mensal', v: breakEven.monthly },
              { l: 'Diário',  v: breakEven.daily },
              { l: 'Por Hora', v: breakEven.hourly },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-xl p-3 text-center"
                style={{ background: '#e8f0fe' }}>
                <p className="text-[9px] font-bold uppercase tracking-wide mb-1"
                  style={{ color: '#1a73e8', opacity: 0.65 }}>{l}</p>
                <p className="font-bold text-[15px] font-serif leading-tight"
                  style={{ color: '#1a73e8' }}>{brl(v)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Success target */}
        <div className="rounded-xl p-5 border" style={{ background: C.offWhite, borderColor: C.grayMid }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#f2faf4' }}>
              <Award size={15} color={C.asparagus} />
            </div>
            <div>
              <p className="font-bold text-[13px] font-serif" style={{ color: C.feldgrau }}>
                Meta de Sucesso
              </p>
              <p className="text-[10px]" style={{ color: C.textMuted }}>
                Fixos + {brl(cfg.targetProfit)} de lucro líquido
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Mensal', v: success.monthly },
              { l: 'Diário',  v: success.daily },
              { l: 'Por Hora', v: success.hourly },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-xl p-3 text-center"
                style={{ background: '#f2faf4' }}>
                <p className="text-[9px] font-bold uppercase tracking-wide mb-1"
                  style={{ color: C.asparagus, opacity: 0.7 }}>{l}</p>
                <p className="font-bold text-[15px] font-serif leading-tight"
                  style={{ color: C.asparagus }}>{brl(v)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROGRESS ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.grayMid }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} color={C.peachDk} />
            <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>
              Progresso do Mês
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-[10px]" style={{ color: C.textMuted }}>
                Atualizado {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={loadData} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border"
              style={{ background: C.grayLt, borderColor: C.grayMid, color: C.feldgrau }}>
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Carregando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        <div className="mb-4 px-4 py-3 rounded-lg" style={{ background: C.grayLt }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: C.textMuted }}>Faturamento bruto — mês atual</p>
          <p className="font-bold text-[26px] font-serif leading-none" style={{ color: C.feldgrau }}>
            {brl(grossMonthly)}
          </p>
        </div>

        <ProgressBar
          label="Ponto de Equilíbrio"
          current={grossMonthly}
          target={breakEven.monthly}
          color="#1a73e8"
          subLabel={`Meta: ${brl(breakEven.monthly)}/mês`}
        />
        <ProgressBar
          label="Meta de Sucesso"
          current={grossMonthly}
          target={success.monthly}
          color={C.asparagus}
          subLabel={`Meta: ${brl(success.monthly)}/mês`}
        />
      </div>

      {/* ── FINANCIAL CARDS ────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">

        {/* Faturamento Bruto */}
        <div className="rounded-xl p-4 border" style={{ background: C.offWhite, borderColor: C.grayMid }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${C.feldgrau}20` }}>
              <DollarSign size={13} color={C.feldgrau} />
            </div>
            <span className="font-bold text-[12px] font-serif" style={{ color: C.feldgrau }}>
              Faturamento Bruto
            </span>
          </div>
          {[
            { l: 'Mensal',   v: grossMonthly },
            { l: 'Hoje',     v: grossToday },
            { l: 'Por Hora', v: grossHourly },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between items-center py-1.5 border-b last:border-0"
              style={{ borderColor: C.grayLt }}>
              <span className="text-[11px]" style={{ color: C.textMuted }}>{l}</span>
              <span className="font-bold text-[13px] font-serif" style={{ color: C.feldgrau }}>
                {brl(v)}
              </span>
            </div>
          ))}
        </div>

        {/* Custos Totais */}
        <div className="rounded-xl p-4 border" style={{ background: '#fdf2f2', borderColor: '#f5b7b7' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#f5b7b720' }}>
              <Minus size={13} color="#c0392b" />
            </div>
            <span className="font-bold text-[12px] font-serif" style={{ color: C.feldgrau }}>
              Custos Totais
            </span>
          </div>
          {[
            { l: 'Mensal (estimado)', v: totalCostMonthly },
            { l: 'Hoje (estimado)',   v: totalCostToday },
            { l: 'Por Hora',          v: totalCostHourly },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between items-center py-1.5 border-b last:border-0"
              style={{ borderColor: '#f5b7b750' }}>
              <span className="text-[11px]" style={{ color: '#7a1f1f' }}>{l}</span>
              <span className="font-bold text-[13px] font-serif" style={{ color: '#c0392b' }}>
                {brl(v)}
              </span>
            </div>
          ))}
          <p className="text-[9px] mt-2" style={{ color: '#c0392b', opacity: 0.65 }}>
            Fixos + {cfg.variableCostPct}% variáveis s/ receita
          </p>
        </div>

        {/* Lucro Líquido */}
        <div className="rounded-xl p-4 border" style={{ background: profitBg, borderColor: `${profitColor}50` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${profitColor}20` }}>
                <TrendingUp size={13} color={profitColor} />
              </div>
              <span className="font-bold text-[12px] font-serif" style={{ color: C.feldgrau }}>
                Lucro Líquido
              </span>
            </div>
            {metaAtingida && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.asparagus, color: '#fff' }}>🎯 Meta!</span>
            )}
          </div>
          {[
            { l: 'Mensal',   v: netMonthly },
            { l: 'Hoje',     v: netToday },
            { l: 'Por Hora', v: netHourly },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between items-center py-1.5 border-b last:border-0"
              style={{ borderColor: `${profitColor}25` }}>
              <span className="text-[11px]" style={{ color: profitColor, opacity: 0.75 }}>{l}</span>
              <span className="font-bold text-[13px] font-serif" style={{ color: profitColor }}>
                {brl(v)}
              </span>
            </div>
          ))}
          {!metaAtingida && netMonthly >= 0 && (
            <p className="text-[9px] mt-2" style={{ color: profitColor, opacity: 0.7 }}>
              Falta {brl(cfg.targetProfit - netMonthly)} para a meta
            </p>
          )}
        </div>
      </div>

      {/* ── CANAL SPLIT ────────────────────────────────────────────────────── */}
      {(() => {
        const total = canalSplit.direto.value + canalSplit.ifood.value
        const diretoPct = total > 0 ? (canalSplit.direto.value / total) * 100 : 0
        const ifoodPct  = total > 0 ? (canalSplit.ifood.value  / total) * 100 : 0
        return (
          <div className="rounded-xl border p-5" style={{ background: C.offWhite, borderColor: C.grayMid }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${C.feldgrau}15` }}>
                <Store size={15} color={C.feldgrau} />
              </div>
              <div>
                <p className="font-bold text-[13px] font-serif" style={{ color: C.feldgrau }}>
                  Canais de Venda — Mês Atual
                </p>
                <p className="text-[10px]" style={{ color: C.textMuted }}>
                  Apenas pedidos com status <strong>Recebido</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Venda Direta */}
              <div className="rounded-xl p-4 border"
                style={{ background: '#f2faf4', borderColor: `${C.asparagus}40` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: `${C.asparagus}25` }}>
                    <Store size={12} color={C.asparagus} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: C.asparagus }}>Venda Direta</span>
                </div>
                <p className="font-bold text-[22px] font-serif leading-none mb-0.5"
                  style={{ color: C.asparagus }}>{brl(canalSplit.direto.value)}</p>
                <p className="text-[10px] font-semibold" style={{ color: C.asparagus, opacity: 0.7 }}>
                  {canalSplit.direto.count} pedido{canalSplit.direto.count !== 1 ? 's' : ''} · {diretoPct.toFixed(0)}%
                </p>
              </div>

              {/* iFood */}
              <div className="rounded-xl p-4 border"
                style={{ background: '#fff3ee', borderColor: '#ea1d2c40' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: '#ea1d2c20' }}>
                    <Bike size={12} color="#ea1d2c" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: '#ea1d2c' }}>iFood</span>
                </div>
                <p className="font-bold text-[22px] font-serif leading-none mb-0.5"
                  style={{ color: '#ea1d2c' }}>{brl(canalSplit.ifood.value)}</p>
                <p className="text-[10px] font-semibold" style={{ color: '#ea1d2c', opacity: 0.7 }}>
                  {canalSplit.ifood.count} pedido{canalSplit.ifood.count !== 1 ? 's' : ''} · {ifoodPct.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Split bar */}
            {total > 0 && (
              <div>
                <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: C.grayLt }}>
                  <div className="h-full transition-all duration-700 rounded-l-full"
                    style={{ width: `${diretoPct}%`, background: C.asparagus }} />
                  <div className="h-full transition-all duration-700 rounded-r-full"
                    style={{ width: `${ifoodPct}%`, background: '#ea1d2c' }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: C.asparagus }}>
                    Direta {diretoPct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: '#ea1d2c' }}>
                    iFood {ifoodPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            {total === 0 && (
              <p className="text-center text-[11px] py-2" style={{ color: C.textMuted }}>
                Nenhum pedido recebido este mês ainda.
              </p>
            )}
          </div>
        )
      })()}

      {/* ── CHART ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.grayMid }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={15} color={C.peachDk} />
          <span className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>
            Faturamento — Últimos 14 Dias
          </span>
        </div>
        <p className="text-[11px] mb-4" style={{ color: C.textMuted }}>
          Linha tracejada = Meta diária de sucesso ({brl(success.daily)})
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-52 gap-3" style={{ color: C.textMuted }}>
            <Loader size={20} className="animate-spin" style={{ color: C.feldgrau }} />
            <span className="text-[13px]">Carregando dados…</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartWithGoal} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              barSize={18}>
              <defs>
                <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.feldgrau} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={C.feldgrau} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grayLt} vertical={false} />
              <XAxis dataKey="dia"
                tick={{ fontSize: 10, fill: C.textMuted }}
                tickLine={false} axisLine={false} />
              <YAxis
                domain={[0, dataMax => Math.ceil(Math.max(dataMax, success.daily) * 1.2)]}
                tick={{ fontSize: 10, fill: C.textMuted }}
                tickLine={false} axisLine={false}
                tickFormatter={v => v === 0 ? '' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: C.grayLt }} />
              <ReferenceLine
                y={success.daily}
                stroke={C.asparagus}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: 'Meta', position: 'right', fontSize: 9, fill: C.asparagus }}
              />
              <Bar dataKey="Faturamento" fill="url(#gradBar)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── OPERATIONAL PANEL ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: C.grayMid }}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: C.grayLt }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: C.feldgrau }}>
            <ShoppingBag size={14} color={C.peach} />
          </div>
          <div>
            <p className="font-bold text-sm font-serif" style={{ color: C.feldgrau }}>
              Painel Operacional
            </p>
            <p className="text-[10px]" style={{ color: C.textMuted }}>
              {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} no total ·{' '}
              {brl(active.reduce((s, p) => s + (parseFloat(p['Valor Total']) || 0), 0))} em aberto
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-3" style={{ color: C.textMuted }}>
            <Loader size={18} className="animate-spin" style={{ color: C.feldgrau }} />
            <span className="text-[13px]">Carregando pedidos…</span>
          </div>
        ) : (
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {statusSummary.map(({ status, count, value }) => {
              const meta = STATUS_META[status] || { bg: C.grayLt, color: C.textMuted, Icon: ShoppingBag }
              const { Icon } = meta
              return (
                <div key={status} className="rounded-xl p-3.5 border text-center"
                  style={{ background: meta.bg, borderColor: `${meta.color}30` }}>
                  <Icon size={18} className="mx-auto mb-2" style={{ color: meta.color }} />
                  <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5"
                    style={{ color: meta.color }}>{status}</p>
                  <p className="font-bold text-[26px] font-serif leading-none mb-1"
                    style={{ color: meta.color }}>{count}</p>
                  <p className="text-[10px] font-semibold"
                    style={{ color: meta.color, opacity: 0.7 }}>{brl(value)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── VELOCÍMETRO (dark card) ─────────────────────────────────────────── */}
      <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: C.feldgrau }}>
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10"
          style={{ background: C.peach }} />
        <div className="absolute bottom-0 left-40 w-16 h-16 rounded-full opacity-8"
          style={{ background: C.asparagus }} />

        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-2">
            <Zap size={16} color={C.peachLt} />
            <span className="font-bold text-[13px] font-serif" style={{ color: C.peachLt }}>
              Velocímetro — Média Hora/Mês
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: 'rgba(250,189,151,0.12)' }}>
            <Clock size={11} color={C.peachLt} />
            <span className="text-[10px] font-semibold" style={{ color: C.peachLt }}>
              {workDaysElapsed}d × {cfg.hoursPerDay}h trabalhadas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
          {[
            {
              l: 'Receita / Hora',
              v: grossHourly,
              sub: grossHourly >= success.hourly
                ? '✅ Acima da meta'
                : `Falta ${brl(success.hourly - grossHourly)}/h`,
              good: grossHourly >= success.hourly,
            },
            {
              l: 'Meta Equilíbrio / h',
              v: breakEven.hourly,
              sub: 'Mínimo necessário',
              good: null,
            },
            {
              l: 'Meta Sucesso / h',
              v: success.hourly,
              sub: `+${brl(cfg.targetProfit)} de lucro`,
              good: null,
            },
            {
              l: 'Pedidos Hoje',
              v: today.length,
              isCount: true,
              sub: today.length > 0 ? `${brl(grossToday)} faturados` : 'Nenhum ainda',
              good: today.length > 0,
            },
          ].map(({ l, v, sub, isCount, good }) => (
            <div key={l} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(250,189,151,0.09)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5"
                style={{ color: 'rgba(250,189,151,0.55)' }}>{l}</p>
              <p className="font-bold font-serif leading-none mb-1.5"
                style={{
                  color: good === true ? C.asparagusLt : good === false ? C.peach : C.peach,
                  fontSize: isCount ? 28 : 17,
                }}>
                {isCount ? v : brl(v)}
              </p>
              <p className="text-[9px] leading-tight"
                style={{ color: 'rgba(250,189,151,0.5)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
