# Fire Banking Performance Calculator

> Calculadora de KPIs de marketing para equipe Fire Banking - Acompanhe métricas de performance, leads, conversões e atividades de SDR em tempo real.

## 🚀 Acesso

**URL de Produção:** https://calculadora-fire.vercel.app

## 📊 Funcionalidades

### Cálculos em Tempo Real
- **CPL (Cost Per Lead)** - Custo por lead gerado
- **% MQL** - Percentual de Marketing Qualified Leads  
- **% Desqualificados** - Taxa de leads desqualificados
- **Conectividade SDR** - Eficiência de reuniões marcadas
- **No-show** - Diferença entre reuniões marcadas e realizadas
- **Atividade SDR/MQL** - Volume de atividades por lead qualificado

### Metas e Status
- ✅ **CPL ≤ R$ 40,00** - Meta de custo por lead
- ✅ **MQL ≥ 30%** - Meta de conversão para MQL
- ✅ **Desqualificados ≤ 15%** - Meta máxima de desqualificação

### Persistência e Colaboração
- 💾 **Histórico Local** - Cálculos salvos no navegador
- 📤 **Exportação Google Sheets** - Dados exportados para planilha compartilhada
- 👥 **Colaborativo** - Equipe compartilha mesma planilha

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Autenticação:** Google Identity Services (OAuth 2.0)
- **Integração:** Google Sheets API v4
- **Deploy:** Vercel

## 🔧 Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Setup Local
```bash
# Clone o repositório
git clone https://github.com/felipeloureiro-fire/calculadora-fire.git

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Adicione VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_SPREADSHEET_ID

# Execute em desenvolvimento
npm run dev
```

### Scripts Disponíveis
```bash
npm run dev      # Servidor de desenvolvimento (localhost:5173)
npm run build    # Build para produção
npm run preview  # Preview do build local
npm run lint     # Executa ESLint
```

## ⚙️ Configuração Google Cloud

### OAuth 2.0 Client ID
- **Application type:** Web application  
- **Authorized JavaScript origins:** 
  - `http://localhost:5173` (desenvolvimento)
  - `https://calculadora-fire.vercel.app` (produção)
- **Authorized redirect URIs:** Mesmas URLs acima

### Google Sheets API
- Ativar Google Sheets API no projeto
- Configurar OAuth Consent Screen
- Adicionar usuários autorizados em "Test users"

## 📋 Arquitetura

```
src/
├── designs/variant2/          # Componente principal
│   ├── AppVariant2.tsx       # Interface da calculadora
│   └── index.ts              # Export principal
├── hooks/
│   └── useCalculationHistory.ts  # Gerenciamento do histórico
├── services/
│   ├── googleAuthNew.ts      # Autenticação Google
│   └── googleSheetsWeb.ts    # Integração Sheets
├── types.ts                  # Interfaces TypeScript
└── main.tsx                  # Entry point
```

## 🔐 Variáveis de Ambiente

```env
# OAuth Google Client ID
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com

# ID da planilha compartilhada  
VITE_GOOGLE_SPREADSHEET_ID=id-da-planilha
```

## 📈 Como Usar

1. **Acesse** https://calculadora-fire.vercel.app
2. **Preencha** os dados de entrada (orçamento, leads, etc.)
3. **Visualize** os KPIs calculados automaticamente  
4. **Salve** cálculos no histórico local
5. **Exporte** dados para Google Sheets compartilhado

## 👥 Equipe

Calculadora desenvolvida para uso interno da equipe Fire Banking (3 usuários autorizados).

## 🚀 Deploy

Aplicação deployada automaticamente no Vercel via GitHub Actions. Pushes para `main` triggeram novo deploy em produção.

---

**🔥 Fire Banking** - Performance Calculator v1.0