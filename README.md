# 🏋️ GymFinanças

Sistema completo de gestão financeira para academias de ginástica.

## Como rodar o projeto

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# ou
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Logins de Teste
- admin / admin123  ← Admin Master
- funcionario / func123

---

## Estrutura recomendada

```
GymFinancas-Pro/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── README.md
├── src/
│   └── ... (arquivos do frontend)
├── package.json
├── package-lock.json
├── vite.config.ts
├── index.html
├── .gitignore
├── .env.example
└── README.md
```

---

## Deploy

- **Frontend:** Vercel, Netlify, Azure Static Web Apps, etc.
- **Backend:** Render, Heroku, Azure App Service, etc.

---

## Observações
- Não envie `node_modules/`, `.venv/`, `dist/`, `backups/` ou arquivos `.env` reais para o repositório.
- Use `.env.example` para variáveis de ambiente de exemplo.
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-teal)
![Recharts](https://img.shields.io/badge/Recharts-2.15-purple)

---

## 🚀 Início Rápido

### Credenciais de Acesso

**Admin:**
```
Usuário: admin
Senha: admin123
```

**Funcionário:**
```
Usuário: funcionario
Senha: func123
```

---

## ✨ Funcionalidades

### 📊 Dashboard Completo
- Visão geral de KPIs financeiros
- Gráficos interativos (Pizza, Barras, Linha)
- Alertas automáticos de inadimplência e saldo baixo
- Análise de performance em tempo real

### 👥 Gestão de Alunos
- Cadastro completo de alunos
- Controle de mensalidades (Mensal R$100, Trimestral R$270, Anual R$960)
- Sistema de cobrança automática
- Geração de QR Code Pix
- Campanhas de recuperação de inadimplentes

### 💳 Contas a Pagar
- Cadastro de despesas por categoria
- Controle de vencimentos
- Alertas de despesas próximas
- Separação de despesas fixas e variáveis
- Gestão de fornecedores

### 📈 Fluxo de Caixa
- Análise histórica (3, 6 ou 12 meses)
- Projeções automáticas (3 meses)
- Cálculo de reserva de emergência
- Gráficos de evolução e comparativos
- Alertas de saldo crítico

### 📄 Relatórios Gerenciais
- DRE (Demonstração do Resultado)
- Balanço Patrimonial Simplificado
- Análise de lucratividade por plano
- ROI de marketing
- Custo por aluno
- Exportação PDF/Excel (em desenvolvimento)

### ⚙️ Configurações
- Gestão de múltiplas filiais
- Configuração de pró-labore
- Backup e restauração de dados
- Importação/Exportação JSON

---

## 🛠️ Tecnologias Utilizadas

- **React 18.3.1** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4.1** - Estilização
- **Recharts 2.15** - Gráficos interativos
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **Vite** - Build tool
- **LocalStorage** - Armazenamento local (demo)

---

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/gymfinancas-pro.git

# Entre no diretório
cd gymfinancas-pro

# Instale as dependências
pnpm install

# Execute o servidor de desenvolvimento
pnpm dev

# Acesse http://localhost:5173
```

---

## 🐍 Backend Python (FastAPI) + Postgres

Este projeto tem um backend em Python (FastAPI) para autenticação e persistência via Postgres.

### Pré-requisitos
- Postgres instalado e um banco chamado `gymfinancas`
- Python com `pip` funcionando no terminal

### Configurar o backend
Crie `backend/.env` com:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gymfinancas
JWT_SECRET=uma_chave_forte_troque_isso
CORS_ORIGINS=http://localhost:5173
```

### Rodar o backend
```bash
cd backend
python -m venv .venv
./.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Usuários de teste
- `admin` / `admin123`
- `funcionario` / `func123`

## 🚢 Deploy em Produção

### Vercel (Recomendado)

```bash
# Instale o Vercel CLI
npm i -g vercel

# Execute o deploy
vercel

# Siga as instruções
```

Ou use a interface web:
1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Clique em "Deploy"

### Netlify

```bash
# Build do projeto
pnpm build

# O diretório dist/ estará pronto para deploy
```

Ou arraste a pasta `dist/` no [Netlify Drop](https://app.netlify.com/drop)

### GitHub Pages

```bash
# Adicione ao package.json:
"homepage": "https://seu-usuario.github.io/gymfinancas-pro",

# Build
pnpm build

# Deploy usando gh-pages
npm install -g gh-pages
gh-pages -d dist
```

---

## 📊 Dados de Exemplo

O sistema vem pré-carregado com:
- ✅ 50 alunos (distribuídos em 2 filiais)
- ✅ 6 meses de histórico financeiro
- ✅ 10 despesas recorrentes
- ✅ Receitas e mensalidades completas
- ✅ Dados realistas para demonstração

---

## 🔐 Autenticação e Segurança

### Versão Demo (LocalStorage)
- Autenticação local com hash de senha
- Dados armazenados no navegador
- Ideal para testes e demonstrações

### Versão Produção (Supabase)
Para uso profissional, conecte ao Supabase:

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
```

4. Execute as migrations do banco:
```sql
-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'funcionario')),
  filial_id UUID
);

-- Tabela de alunos
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plano TEXT CHECK (plano IN ('mensal', 'trimestral', 'anual')),
  valor_plano DECIMAL(10,2),
  data_matricula DATE,
  status TEXT CHECK (status IN ('ativo', 'inadimplente', 'cancelado')),
  filial_id UUID
);

-- Tabela de receitas
CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES alunos(id),
  valor DECIMAL(10,2),
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT CHECK (status IN ('pago', 'pendente')),
  tipo TEXT,
  filial_id UUID
);

-- Tabela de despesas
CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao TEXT NOT NULL,
  categoria TEXT,
  tipo TEXT CHECK (tipo IN ('fixa', 'variavel')),
  valor DECIMAL(10,2),
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT CHECK (status IN ('pago', 'pendente')),
  fornecedor TEXT,
  filial_id UUID,
  recorrente BOOLEAN DEFAULT false
);

-- Tabela de filiais
CREATE TABLE filiais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  endereco TEXT
);
```

---

## 📁 Estrutura do Projeto

```
gymfinancas-pro/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Alunos.tsx
│   │   │   ├── Despesas.tsx
│   │   │   ├── FluxoCaixa.tsx
│   │   │   ├── Relatorios.tsx
│   │   │   └── Configuracoes.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── dataService.ts
│   │   └── App.tsx
│   └── styles/
│       └── theme.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── README.md
└── MANUAL_USUARIO.md
```

---

## 🎨 Personalização

### Tema de Cores

O sistema usa um tema fitness com cores verde e azul. Para personalizar, edite `/src/styles/theme.css`:

```css
:root {
  --primary: #10b981; /* Verde principal */
  --secondary: #06b6d4; /* Azul secundário */
  --background: #f0fdf4; /* Fundo */
}
```

### Logo e Branding

Substitua os ícones em:
- `/public/favicon.ico`
- Componente `Dumbbell` nos arquivos de layout

---

## 📱 Responsividade

O sistema é mobile-first e totalmente responsivo:

- **Desktop (≥1024px):** Layout completo com sidebar fixa
- **Tablet (768px-1023px):** Layout adaptável
- **Mobile (<768px):** Menu hamburger, tabelas com scroll

---

## 🧪 Testes

```bash
# Execute testes (quando disponíveis)
pnpm test

# Cobertura de testes
pnpm test:coverage
```

---

## 📈 Roadmap

### v1.1 (Próxima Release)
- [ ] Exportação real de PDF e Excel
- [ ] Integração nativa com Supabase
- [ ] Notificações por email/SMS
- [ ] Relatórios personalizáveis
- [ ] Módulo de vendas de produtos

### v2.0 (Futuro)
- [ ] App mobile nativo
- [ ] Integração com gateways de pagamento
- [ ] Dashboard de personal trainers
- [ ] Sistema de agendamento
- [ ] Controle de ponto eletrônico

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 💬 Suporte

- 📧 Email: contato@gymfinancas.com.br
- 📖 Documentação: [MANUAL_USUARIO.md](MANUAL_USUARIO.md)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/gymfinancas-pro/issues)

---

## 🙏 Agradecimentos

- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
- [date-fns](https://date-fns.org)

---

## 📊 Estatísticas do Projeto

![GitHub stars](https://img.shields.io/github/stars/seu-usuario/gymfinancas-pro?style=social)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/gymfinancas-pro?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/seu-usuario/gymfinancas-pro?style=social)

---

**Feito com ❤️ para academias** 🏋️‍♀️

**Versão:** 1.0.0
**Data:** Março 2026
