# PiTa Doceria — Software de Precificação

## Visão geral
Software web de precificação para doceria artesanal. Permite calcular preço de venda com base em ingredientes, custos fixos e margem desejada. Possui histórico de precificações, registro de pedidos e painel financeiro.

**URL de produção:** https://pita-doceria.vercel.app  
**Repositório:** https://github.com/rmachad0/Pita-Doceria (branch `master`)  
**Vercel project:** `a-nova/pita-doceria`

## Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Ícones:** lucide-react
- **Gráficos:** recharts
- **Backend/DB:** Supabase (PostgreSQL)
- **Deploy:** Vercel (auto-alias para pita-doceria.vercel.app)

## Banco de dados — Supabase
- **URL:** `https://zyqmfsjxhyndnlzqdspl.supabase.co`
- **Anon key:** `sb_publishable_3dd9tzlmIytkf5vsg5w5Aw_eDjOuUtl`
- **Tabelas:** `precificacoes`, `pedidos`, `alertas_margem`, `gastos_extras`
- Migrations em: `supabase/migrations/`

## Arquivos principais
```
src/
  App.jsx                          — app completo (tabs, formulários, modais)
  components/
    Dashboard.jsx                  — Painel Financeiro (gráficos, metas, canal split)
  services/
    supabase-integration.js        — todas as funções de acesso ao banco
```

## Paleta de cores (constante C em App.jsx e Dashboard.jsx)
| Token | Hex | Uso |
|---|---|---|
| feldgrau | #525F54 | primária, headers, botões |
| peach | #FABD97 | destaque, logo, preços |
| asparagus | #6CAE75 | saúde boa, metas atingidas |
| offwhite | #F5F0EB | fundo de cards |

Classes Tailwind usam prefixo `itza-` no tailwind.config.js → ex: `border-itza-grayMid`.

> ⚠️ Atenção: as classes Tailwind do PiTa ainda usam prefixo `pita-` (não foram migradas para `itza-`). Use `pita-feldgrau`, `pita-peach`, etc.

## Comandos de desenvolvimento
```bash
# Servidor local
npm run dev -- --port 5174

# Build
npm run build

# Deploy para produção
git add <arquivos>
git commit -m "mensagem"
npx vercel --prod --yes
```

## Padrão de deploy
Sempre commitar antes do deploy. O alias `pita-doceria.vercel.app` é configurado automaticamente via `.vercel/project.json`.

## Abas do sistema
1. **Precificação** — receita, ingredientes, canal, margem → salvar
2. **Histórico** — tabela de precificações salvas com botão Editar (modal completo)
3. **Pedidos** — registro de pedidos com cliente, produto, entrega, status
4. **Painel Financeiro** — ponto de equilíbrio, meta de sucesso, gráfico 14 dias, canal split, gastos extras

## Lógica de precificação
```
custoBase = (totalIngredientes / rendimento) + embalagem + (tempoPreparo/60 * cph)
cph = totalFixos / horasMes
precoSugerido = custoBase / (1 - margem/100 - imposto/100 - taxaCanal/100)
margemLiquida = (preco - custoBase) / preco * 100
```
- Saudável ≥ 25% | Alerta 11–24% | Perigosa < 11%
- Canal iFood aplica 25% de taxa

## Automação ativa
- **Toda sexta-feira 8h50:** atualização automática do Radar de Tendências (scheduled task `pita-trends-update` no Cowork → Scheduled)

## Notas importantes
- `toLocaleString('pt-BR')` gera datas com vírgula ("27/05/2026, 11:04"). Usar helper `datePart()` em Dashboard.jsx para comparações de data.
- Registros de precificação antigos (sem JSONB de ingredientes) usam fallback da receita atual no modal de edição.
- `registrarPedido` faz retry sem coluna `canal` se retornar erro 42703.
