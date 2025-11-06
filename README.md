
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

### 4. Executando a Aplicação

Para iniciar o servidor de desenvolvimento (backend) e o cliente (frontend) simultaneamente, execute o seguinte comando na raiz do projeto:

```bash
npm start
```

Após executar o comando:
- A API do backend estará rodando em `http://localhost:3001`.
- A aplicação frontend estará acessível em `http://localhost:3000`.

Abra seu navegador e acesse `http://localhost:3000` para ver a aplicação em funcionamento.
