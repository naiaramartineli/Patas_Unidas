# 🐾 Patas Unidas -- Sistema de Adoção, Apadrinhamento e Doações

O **Patas Unidas** é um sistema web desenvolvido como parte de um
**projeto de extensão interdisciplinar da FATEC Guaratinguetá**.\
Seu objetivo é facilitar e modernizar o processo de **adoção,
apadrinhamento e doações** para os animais acolhidos na **UPA -- Unidade
de Proteção Animal de Lorena (SP)**.

A plataforma possibilita que adotantes e padrinhos encontrem cães
disponíveis, acompanhem suas informações e apoiem o abrigo de forma
prática e intuitiva.\
Além disso, o sistema oferece uma **área administrativa completa**,
permitindo a gestão de animais, vacinas, usuários e relatórios mensais.

## 📚 Índice

-   Sobre o Projeto
-   Funcionalidades
-   Tecnologias Utilizadas
-   Arquitetura Geral
-   Estrutura de Pastas
-   Como Executar o Projeto
-   Contribuição
-   Licença

## 🐶 Sobre o Projeto

O sistema foi criado para dar maior visibilidade aos cães da UPA --
Lorena, permitindo que visitantes:

-   Naveguem pela galeria de cães
-   Acessem a ficha completa de cada animal
-   Realizem adoção ou apadrinhamento
-   Realizem doações online

Administradores podem monitorar o abrigo, registrar animais, atualizar
vacinas, acompanhar solicitações e visualizar relatórios mensais.

## ✨ Funcionalidades

### 👤 Usuário Comum

-   Acesso à **Galeria de Cães** com filtros
-   Visualização da ficha de cada animal
-   Solicitação de **Adoção**
-   Solicitação de **Apadrinhamento**
-   Realização de **Doações**
-   Cadastro e Login no sistema

### 🛠️ Administrador

-   Cadastro e edição de:
    -   Cães
    -   Vacinas
    -   Raças
    -   Usuários
-   Dashboard com:
    -   Adoções mensais
    -   Doações
    -   Apadrinhamentos
-   Área administrativa completa

## 🧰 Tecnologias Utilizadas

### Frontend (React + Vite)

-   React 19
-   React Router DOM
-   React Icons
-   Lucide React
-   React Datepicker
-   CSS Modules
-   Vite

### Backend (Node.js + Express)

-   Express.js
-   MySQL2
-   JWT (Json Web Token)
-   BcryptJS
-   CORS
-   Dotenv

### Banco de Dados

-   MySQL

## 🏗 Arquitetura Geral

    patas-unidas/
    │
    ├── frontend/      # Interface (React + Vite)
    └── backend/       # API (Node.js + Express + MySQL)

## 📁 Estrutura de Pastas e Padronizações 

### 📜 Padrões de Nomenclatura

O sistema possui padrões de nomeação baseado no tipo de arquivo/diretório com a finalidade de manter a constância e legibilidade do cógido e do projeto. Esses padõres conssistem em:

    ∟Arquivos: snake_case
    ∟Constantes: SCREAMING_SNAKE_CASE
    ∟Classes: PascalCase
    ∟Diretórios/Pastas: camelCase
    ∟Funções/Métodos: camelCase
    ∟Variáveis: camelCase


### 📦 Frontend

    frontend/
    │
    ├── node_modules/
    ├── public/
    │   └── vite.svg
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── css/
    │   ├── pages/
    │   ├── routes/
    │   ├── main.jsx
    │   └── App.jsx
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    └── vite.config.js

### 🔧 Backend

    backend/
    │
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── routes/
    │   ├── models/
    │   ├── middleware/
    │   ├── utils/
    │   ├── app.js
    │   └── server.js
    ├── .env
    ├── package.json
    └── node_modules/

## 🚀 Como Executar o Projeto

### 🔑 Requisitos

-   Node.js LTS
-   NPM ou Yarn
-   MySQL Server

### 📥 Instalação

Clone o repositório:

    git clone https://github.com/seuusuario/patas-unidas.git
    cd patas-unidas

### 🖥 Executando o Frontend

    cd frontend
    npm install
    npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks globals
    npm run dev

Acesse: http://localhost:5173

### 🔧 Executando o Backend

    cd backend
    npm install
    npm run dev

API disponível em: http://localhost:3000

## 🤝 Contribuição

1.  Faça um fork\
2.  Crie uma branch:

```{=html}
<!-- -->
```
    git checkout -b feature/minha-feature

3.  Commit:

```{=html}
<!-- -->
```
    git commit -m "Adiciona minha feature"

4.  Push:

```{=html}
<!-- -->
```
    git push origin feature/minha-feature

5.  Crie um Pull Request

## 📄 Licença

Este é um projeto acadêmico e está aberto para estudo, pesquisa e
melhorias.
