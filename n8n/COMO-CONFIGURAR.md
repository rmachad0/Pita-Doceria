# PiTa® × n8n × Google Sheets — Guia de Configuração

> **Visão geral**: O Google Sheets é o "banco de dados" do app. O n8n conecta o React ao Sheets sem servidor próprio. Zero custo de infraestrutura.

---

## 1. Subir o n8n localmente (2 minutos)

```bash
# Opção A — npx (sem instalar nada)
npx n8n

# Opção B — Docker (recomendado)
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Acesse: **http://localhost:5678**

---

## 2. Criar a Planilha Google Sheets

Crie uma planilha em sheets.google.com com **duas abas**:

### Aba "Precificações"
| Data/Hora | Produto | Custo Base (R$) | Preço Final (R$) | Margem Líq. (%) | Saúde | Canal | Margem Des. (%) | Imposto NF (%) |

### Aba "Pedidos"
| Nº Pedido | Data/Hora | Cliente | Telefone | Produto | Quantidade | Valor Total | Entrega | Status |

**Copie o ID da planilha** — está na URL:
docs.google.com/spreadsheets/d/[SEU_ID_AQUI]/edit

---

## 3. Importar os 5 Workflows no n8n

No n8n: "Add workflow" → "Import from file"

| Arquivo | Função |
|---|---|
| workflow-1-salvar-precificacao.json | Salva precificação no Sheets |
| workflow-2-alerta-margem.json | Alerta WhatsApp quando margem < 10% |
| workflow-3-relatorio-diario.json | Relatório automático todo dia útil 20h |
| workflow-4-gestao-pedidos.json | Registra pedido + WhatsApp ao cliente |
| workflow-5-ler-dados.json | Lê histórico e pedidos do Sheets |

---

## 4. Substituir os placeholders nos JSONs

| Placeholder | Substituir por |
|---|---|
| SEU_GOOGLE_SHEET_ID_AQUI | ID da sua planilha Google Sheets |
| SEU_WHATSAPP_PHONE_ID | Phone Number ID do WhatsApp Business |
| SEU_NUMERO_WHATSAPP | Seu número: +5511999999999 |
| SEU_EMAIL@gmail.com | Seu e-mail Gmail |

---

## 5. Configurar Credenciais no n8n

### Google Sheets
Settings → Credentials → Add → Google Sheets OAuth2
Crie OAuth2 no Google Cloud Console → ative Google Sheets API → cole Client ID e Secret

### WhatsApp Business API
developers.facebook.com → App → WhatsApp Business → copie Phone Number ID e Access Token
Settings → Credentials → Add → WhatsApp Business Cloud

### Gmail
Settings → Credentials → Add → Gmail OAuth2

---

## 6. Arquivo .env do projeto

Crie na raiz de pita-doceria:

```
VITE_N8N_URL=http://localhost:5678
```

O arquivo src/services/n8n-integration.js já lê esta variável automaticamente.

---

## 7. Ativar todos os workflows

Clique no toggle "Active" em cada workflow após configurar as credenciais.

---

## Webhook URLs

| Workflow | URL |
|---|---|
| Salvar Precificação | http://localhost:5678/webhook/pita-salvar-precificacao |
| Alerta de Margem | http://localhost:5678/webhook/pita-alerta-margem |
| Novo Pedido | http://localhost:5678/webhook/pita-novo-pedido |
| Ler Precificações | http://localhost:5678/webhook/pita-ler-dados?tipo=precificacoes |
| Ler Pedidos | http://localhost:5678/webhook/pita-ler-dados?tipo=pedidos |

---

## Rodar o app

```bash
cd pita-doceria
npm install
npm run dev
# Acesse http://localhost:5173
```

---

## Fluxo completo

App React
 Botão "Salvar Precificação" → Workflow 1 → Google Sheets (Precificações)
 Margem < 10% (automático)  → Workflow 2 → WhatsApp (alerta)
 Aba "Histórico"            → Workflow 5 → Google Sheets (leitura)
 Aba "Pedidos" (formulário)  → Workflow 4 → Google Sheets + WhatsApp cliente
 Relatório automático        → Workflow 3 → WhatsApp + Gmail (20h dias úteis)

---

PiTa® × n8n × Google Sheets — Automação com propósito · 2026
