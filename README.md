# Dashboard DRE - Sistema de Análise Financeira

## 📊 Visão Geral

Dashboard DRE é um sistema completo de análise financeira que permite visualizar e gerenciar demonstrações de resultado do exercício (DRE) com integração automática ao Google Drive e n8n para processamento de planilhas.

## ✨ Funcionalidades

### 📈 Dashboard Principal
- **KPIs Financeiros**: Receita total, custos, margem bruta e líquida
- **Gráficos Interativos**: Donut charts, waterfall charts e análises temporais
- **Filtros Avançados**: Por entidade, período e tipo de conta
- **Relatórios DRE**: Visualização completa das demonstrações

### 🔗 Integrações
- **Google Drive**: Monitoramento automático de planilhas
- **n8n**: Processamento automatizado de dados
- **Supabase**: Banco de dados em tempo real
- **Excel/CSV**: Parser inteligente de arquivos

### 🛠️ Funcionalidades Técnicas
- **Mapeamento Automático**: Detecção inteligente de colunas
- **Validação de Dados**: Sistema robusto de validação
- **Auditoria**: Logs completos de processamento
- **Retry System**: Recuperação automática de falhas
- **Circuit Breaker**: Proteção contra sobrecarga

## 🚀 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **Recharts** para visualizações
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **TypeScript** para tipagem
- **Supabase** como banco de dados
- **Google Drive API** para integração
- **Multer** para upload de arquivos

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase
- Conta no Google Cloud (para Google Drive API)

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd dashboard-dre
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase

# Google Drive API
GOOGLE_CLIENT_ID=seu_client_id_do_google
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# n8n
N8N_WEBHOOK_URL=sua_url_do_webhook_n8n
N8N_API_KEY=sua_chave_api_do_n8n

# Servidor
PORT=3001
```

### 4. Configure o Supabase

#### Aplique as migrações:
```bash
npm run migrate
```

#### Ou execute o script de criação direta:
```bash
npm run create-tables
```

### 5. Inicie o desenvolvimento
```bash
# Inicia frontend e backend simultaneamente
npm run dev
```

Ou separadamente:
```bash
# Frontend (porta 5174)
npm run dev:frontend

# Backend (porta 3001)
npm run dev:backend
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **entities**: Entidades/empresas
- **accounts**: Plano de contas
- **financial_facts**: Fatos financeiros (valores)
- **users**: Usuários do sistema

### Tabelas de Integração
- **integration_settings**: Configurações de integração
- **data_mappings**: Mapeamentos de colunas
- **processed_files**: Arquivos processados
- **n8n_processing_logs**: Logs de processamento

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend e backend
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend

# Build
npm run build           # Build de produção
npm run preview         # Preview do build

# Banco de dados
npm run migrate         # Aplica migrações
npm run create-tables   # Cria tabelas diretamente

# Qualidade de código
npm run lint            # ESLint
npm run type-check      # Verificação de tipos
npm run check           # Lint + type-check
```

## 🌐 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Manual
```bash
npm run build
# Upload da pasta dist/ para seu servidor
```

## 📱 Uso

### 1. Configuração Inicial
- Acesse `/integration-settings` para configurar integrações
- Configure mapeamentos em `/data-mappings`
- Defina webhooks do Google Drive

### 2. Processamento de Dados
- Faça upload de planilhas Excel/CSV
- Configure mapeamento automático de colunas
- Monitore processamento em `/monitoring`

### 3. Análise
- Visualize KPIs no dashboard principal
- Use filtros para análises específicas
- Exporte relatórios em diferentes formatos

## 🔐 Segurança

- **RLS (Row Level Security)** no Supabase
- **Autenticação** via Supabase Auth
- **Validação** de dados em múltiplas camadas
- **Sanitização** de inputs
- **Rate limiting** nas APIs

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email: dashboard@dre.com

---

**Dashboard DRE** - Transformando dados financeiros em insights acionáveis 