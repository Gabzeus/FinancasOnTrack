
# FinTrack - Gestor de Finanças Pessoais

Este é um aplicativo de gerenciamento de finanças pessoais construído com React, Node.js, Express e SQLite.

## Como Executar o Projeto Localmente

Siga estas instruções para configurar e executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- **Node.js**: Certifique-se de ter o Node.js instalado. Você pode baixá-lo em [nodejs.org](https://nodejs.org/). O npm (Node Package Manager) é instalado junto com o Node.js.

### 1. Instalação das Dependências

Clone o repositório e, no diretório raiz do projeto, execute o seguinte comando para instalar todas as dependências necessárias listadas no arquivo `package.json`:

```bash
npm install
```

### 2. Configuração do Banco de Dados

- **Banco de Dados**: O projeto utiliza **SQLite**.
- **Arquivo do Banco**: O arquivo do banco de dados (`database.sqlite`) será criado automaticamente dentro de uma pasta `data/` na raiz do projeto na primeira vez que o servidor for iniciado. Nenhuma configuração manual é necessária.

### 3. Linguagem

- **Frontend**: React com TypeScript e Vite.
- **Backend**: Node.js com Express e TypeScript.

### 4. Conta de Administrador

**Importante**: O sistema foi projetado para que o **primeiro usuário a se registrar** se torne automaticamente o administrador.

Para criar sua conta de administrador:
1.  Execute a aplicação (instruções abaixo).
2.  Na tela de login, escolha a aba "Registar".
3.  Crie sua conta com seu e-mail e uma senha de sua escolha.

A senha que você definir durante o registro será a sua senha de administrador. Por razões de segurança, eu não tenho acesso a essa senha.

### 5. Executando a Aplicação

Para iniciar o servidor de desenvolvimento (backend) e o cliente (frontend) simultaneamente, execute o seguinte comando na raiz do projeto:

```bash
npm start
```

Após executar o comando:
- A API do backend estará rodando em `http://localhost:3001`.
- A aplicação frontend estará acessível em `http://localhost:3000`.

Abra seu navegador e acesse `http://localhost:3000` para ver a aplicação em funcionamento.

### 6. Envio de Emails (Simulado)

**Importante**: O sistema de envio de emails (para funcionalidades como "Esqueci a Senha") está **simulado** no ambiente de desenvolvimento.

- **Como funciona?**: Em vez de enviar um email real, o sistema exibe o conteúdo do email (destinatário, assunto e corpo) diretamente no console do terminal onde o servidor backend (`npm start`) está rodando.

- **Preciso de um servidor SMTP?**: Para o ambiente de desenvolvimento, **não é necessário** configurar um servidor SMTP. Você pode testar a funcionalidade observando as saídas no console.

- **Para Produção**: Se você for implantar este projeto em um ambiente de produção e desejar enviar emails reais, será necessário substituir o serviço simulado em `server/services/emailService.ts` por uma implementação real, utilizando um provedor de email como SendGrid, Mailgun, ou o seu próprio servidor SMTP com a ajuda de uma biblioteca como `Nodemailer`.
