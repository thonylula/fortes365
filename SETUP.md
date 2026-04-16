# FORTE 365 — Setup passo a passo

Este guia cobre exatamente o que você precisa fazer, na ordem, para tirar o app do zero até estar rodando no seu celular. Nenhuma etapa é opcional — cada uma destrava a próxima.

---

## Etapa 1 — Rodar o app localmente, conectado ao Supabase

**Pré-requisitos**: você já criou o projeto Supabase e rodou os SQLs (`supabase/migrations/0001_init.sql` e `supabase/seed.sql`). ✓

### 1.1 Pegar as credenciais do Supabase

1. Abra [app.supabase.com](https://app.supabase.com) e entre no seu projeto FORTE 365.
2. No menu lateral esquerdo, clique em **Project Settings** (ícone de engrenagem, no canto inferior).
3. Dentro de Settings, clique em **API**.
4. Você vai ver uma tela com duas caixas importantes:
   - **Project URL** — algo tipo `https://abcdefgh1234.supabase.co`. **Copie isso.**
   - **Project API keys** → linha **`anon` / `public`** → é uma string longa começando com `eyJhbGciOi...`. **Copie isso também.**

> ⚠️ Nunca copie a chave **`service_role`** para o app. Ela ignora todas as regras de segurança (RLS). Só a `anon` vai para o frontend.

### 1.2 Criar o arquivo `.env.local`

No terminal, dentro da raiz do projeto:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Depois abra `apps/web/.env.local` no VS Code e substitua os valores de exemplo pelos que você copiou:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (a string longa)
```

Salve o arquivo. Esse `.env.local` **nunca** é enviado ao Git (o `.gitignore` já bloqueia).

### 1.3 Rodar o app

Na raiz:

```bash
pnpm web:dev
```

Vai aparecer algo como:

```
▲ Next.js 16.2.4
- Local:        http://localhost:3000
```

Abra http://localhost:3000 no navegador. Você vê a landing com os três planos (Grátis / R$14,90 / R$99,90).

Clique em **"Ver plano de treino →"**. Se aparecer a lista dos 12 meses + os 7 dias da primeira semana + os exercícios do primeiro dia de treino (Marcha no Lugar, Agachamento com Cadeira, etc.), **a conexão com o Supabase está funcionando e o seed está correto**. Fim da Etapa 1.

Se aparecer a caixa vermelha "Sem dados retornados do Supabase", volte para 1.1 e confirme as credenciais.

---

## Etapa 2 — Comprar o domínio `forte365.com.br`

Domínios `.com.br` só podem ser comprados no **Registro.br** (é o órgão oficial brasileiro, nenhum outro revendedor oferece). **Custo: R$ 40 por ano**, pago anualmente via boleto, Pix ou cartão.

> Alternativa grátis: pule esta etapa e use o subdomínio da Vercel (`forte365.vercel.app`) até validar o MVP. Você pode comprar o domínio depois sem perder nada.

### 2.1 Criar conta no Registro.br

1. Acesse https://registro.br.
2. Clique em **Login** no canto superior direito → **Não tem conta? Cadastre-se**.
3. Escolha **Pessoa Física** (CPF). Preencha CPF, nome, email, telefone, endereço.
4. Confirme o email clicando no link que eles mandam.

### 2.2 Verificar disponibilidade e registrar

1. Já logado, na caixa de busca no topo do site, digite `forte365` e clique em buscar.
2. Vai aparecer uma lista de extensões: `.com.br`, `.app.br`, `.net.br`, etc. Confirme que `.com.br` está **disponível** (R$ 40/ano).
3. Clique em **Registrar** ao lado de `forte365.com.br`.
4. Escolha o período — **recomendo 1 ano** no começo. Se der certo, renova.
5. Siga até o pagamento. Pague com **Pix** — cai em minutos. Boleto leva 1–2 dias úteis.
6. Após pagamento confirmado, o domínio fica ativo em até 1 hora (geralmente minutos).

### 2.3 Configuração inicial (deixar assim por enquanto)

O Registro.br vai perguntar se você quer configurar DNS agora. **Pule essa etapa** — a Vercel vai fornecer os servidores DNS certos na Etapa 4. Deixe o domínio com a configuração padrão do Registro.br por enquanto.

---

## Etapa 3 — Colocar o código no GitHub

A Vercel só sabe fazer deploy a partir de um repositório Git. Se você ainda não usa Git, é agora.

### 3.1 Criar um repositório no GitHub

1. Acesse https://github.com e faça login (ou crie uma conta).
2. Clique no **+** no canto superior direito → **New repository**.
3. Repository name: `forte365`.
4. Deixe **Private** (mais seguro enquanto o app está em desenvolvimento).
5. **NÃO marque** nenhuma das três opções de inicialização (README, .gitignore, license). Queremos o repositório vazio.
6. Clique em **Create repository**.

### 3.2 Inicializar Git no projeto e fazer o primeiro push

Na raiz do projeto, terminal:

```bash
git init
git add .
git commit -m "Fase 0: seed, schema, Next.js + Supabase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/forte365.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu username real do GitHub. Na primeira vez o Git vai pedir login — use o **GitHub Desktop** ou um Personal Access Token (o GitHub mostra como fazer quando você tenta).

Atualize a página do repositório no GitHub — os arquivos devem aparecer.

> ⚠️ Confira antes do commit: o arquivo `apps/web/.env.local` **não pode** estar no repositório. O `.gitignore` já bloqueia, mas faça `git status` antes do commit para ter certeza de que ele não aparece na lista.

---

## Etapa 4 — Deploy na Vercel

A Vercel oferece hospedagem grátis ilimitada para projetos pessoais (100GB de banda/mês, suficiente para centenas de usuários).

### 4.1 Criar conta Vercel

1. Acesse https://vercel.com.
2. Clique em **Sign Up** → **Continue with GitHub**.
3. Autorize a Vercel a ler seus repositórios do GitHub.

### 4.2 Importar o projeto

1. No dashboard da Vercel, clique em **Add New...** → **Project**.
2. Na lista de repositórios do GitHub, encontre `forte365` e clique em **Import**.
3. Na tela de configuração:
   - **Project Name**: `forte365` (ou o que preferir, vira o subdomínio `.vercel.app`).
   - **Framework Preset**: Next.js (detectado automaticamente).
   - **Root Directory**: clique em **Edit** e escolha `apps/web`. **Isso é crítico** — o projeto é um monorepo, a Vercel precisa saber qual subpasta é o app.
   - **Build Command**, **Output Directory**, **Install Command**: deixe o padrão.
4. Expanda **Environment Variables** e adicione as duas:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://SEU_PROJETO.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOi...`
   Cole os mesmos valores do seu `.env.local`.
5. Clique em **Deploy**.

O primeiro deploy leva 2–3 minutos. Quando terminar, a Vercel mostra uma tela de confetes e um link tipo `https://forte365-abcd.vercel.app`. Clique — seu app está no ar.

### 4.3 Conectar o domínio `forte365.com.br`

(Só faça se você comprou o domínio na Etapa 2. Senão, pule.)

1. No dashboard do projeto na Vercel: **Settings** → **Domains**.
2. No campo, digite `forte365.com.br` e clique em **Add**.
3. A Vercel pergunta se você quer redirecionar `www.forte365.com.br` para `forte365.com.br` (ou o contrário). Escolha uma das opções — recomendo manter sem `www`.
4. A Vercel mostra as instruções de DNS. Vão ser duas ou três linhas, algo como:
   - Tipo `A` · Nome `@` · Valor `76.76.21.21`
   - Tipo `CNAME` · Nome `www` · Valor `cname.vercel-dns.com`
   **Deixe essa janela aberta.**
5. Em outra aba, vá para https://registro.br e faça login.
6. Clique em **Painel** → encontre `forte365.com.br` → **DNS**.
7. Na tela de DNS, apague qualquer entrada existente e adicione as que a Vercel mostrou (mesmos tipos, mesmos valores, mesmos nomes).
8. Salve.
9. Volte na Vercel e aguarde. Em 5 a 30 minutos aparece um ✓ verde ao lado do domínio — está conectado. O certificado HTTPS é emitido automaticamente.

Acesse `https://forte365.com.br`. Deve mostrar seu app. 🎉

---

## Etapa 5 — Checklist final da Fase 0

Antes de partir para a Fase 1, confirme:

- [ ] `pnpm web:dev` mostra dados reais em `/treino` (meses + exercícios do banco)
- [ ] Git init + primeiro push feito (código no GitHub)
- [ ] Deploy Vercel funcionando (abre em `*.vercel.app`)
- [ ] Variáveis de ambiente setadas na Vercel (idênticas ao `.env.local`)
- [ ] (Opcional) Domínio `forte365.com.br` comprado e apontando para a Vercel

Com tudo isso verde, me avise "pronto, fase 0 concluída" que eu começo a Fase 1 — auth, log de treino e PWA offline.

---

## Dicas / problemas comuns

- **`pnpm web:dev` reclama de `NEXT_PUBLIC_SUPABASE_URL is undefined`**: você esqueceu de criar o `.env.local` ou está rodando o comando da pasta errada. Rode sempre da raiz do projeto.
- **OneDrive segurando arquivos durante `pnpm install`**: pausa temporariamente o OneDrive (clique no ícone da bandeja → Pausar sincronização por 2h), roda o install, e depois retoma. Plano de fundo ideal é mover o projeto para fora do OneDrive (ex: `C:\dev\forte365`) — menos atrito no dia a dia.
- **Deploy Vercel falhando com "Module not found"**: provavelmente você esqueceu de setar `Root Directory` como `apps/web`. Settings → General → Root Directory → `apps/web`.
- **`/treino` mostra a caixa vermelha "Sem dados retornados"**: RLS bloqueando leitura. Confirme no Supabase (Table Editor → `months` → RLS) que a policy `content_read_all_months` existe e está habilitada.
