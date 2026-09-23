# DevShowcase API

Backend da plataforma DevShowcase: uma API REST para desenvolvedores cadastrarem seus perfis, projetos, tecnologias utilizadas e receberem feedbacks.

## Identificação do grupo

- **Curso:** Tecnologia em Sistemas para Internet
- **Polo:** Olho d'Água do Piauí - PI
- **Disciplina:** Programação Backend

**Integrantes:**

- Adriano Carvalho de Abreu
- Marcos Venicios de Paiva
- Washington Heles Pereira da Silva Filho

## Tecnologias

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- express-validator

## Modelagem

Entidades: **Profile**, **Project**, **Technology** e **Feedback**.

| Relacionamento | Tipo |
|---|---|
| Profile → Project | 1 : N |
| Project ↔ Technology | N : N |
| Project → Feedback | 1 : N |

O schema completo está em `prisma/schema.prisma`.

## Estrutura do projeto

```
devshowcase-api/
├── prisma/
│   ├── migrations/       # migrations do banco
│   └── schema.prisma     # modelagem das entidades
├── dtos.js               # DTOs de entrada e de saída
├── repositories.js       # camada de acesso ao banco (Prisma)
├── server.js             # rotas, validações e servidor Express
├── package.json
└── .gitignore
```

- **DTOs de entrada**: escolhem e normalizam os campos aceitos no corpo da requisição.
- **DTOs de saída**: definem exatamente o que a API devolve (por exemplo, o perfil dentro de um projeto vem resumido, sem e-mail).
- **Repositórios**: concentram todo o acesso ao banco de dados.

## Como executar

### Pré-requisitos

- Node.js instalado
- PostgreSQL instalado e rodando

### Passo a passo

1. Clone o repositório e entre na pasta:

```bash
git clone https://github.com/abreuadriano2015-dev/devshowcase-api.git
cd devshowcase-api
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com a conexão do seu banco:

```
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/NOME_DO_BANCO"
```

4. Crie as tabelas no banco:

```bash
npx prisma migrate dev
```

5. Inicie o servidor:

```bash
node server.js
```

A API fica disponível em `http://localhost:3000`.

## Endpoints

### Perfis

**POST /api/profiles**: cadastra um perfil.

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "bio": "Desenvolvedora backend",
  "avatarUrl": "https://exemplo.com/foto.png"
}
```

- `name` e `email` são obrigatórios; `email` deve ser válido e único.
- `avatarUrl` é opcional, mas, se enviado, deve ser uma URL `http://` ou `https://` válida.

**GET /api/profiles/:id**: busca um perfil pelo id, incluindo seus projetos.

### Tecnologias

**POST /api/technologies**: cadastra uma tecnologia.

```json
{
  "name": "Node.js"
}
```

- `name` é obrigatório e único.

**GET /api/technologies**: lista todas as tecnologias.

### Projetos

**POST /api/projects**: cadastra um projeto.

```json
{
  "title": "Meu projeto",
  "description": "Descrição opcional",
  "url": "https://github.com/usuario/projeto",
  "profileId": 1,
  "technologyIds": [1, 2]
}
```

- `title` é obrigatório.
- `url` é obrigatória e deve ser uma URL `http://` ou `https://` válida.
- `profileId` deve ser o id de um perfil existente.
- `technologyIds` é opcional; cada item deve ser o id de uma tecnologia existente.

**GET /api/projects**: lista os projetos, com perfil, tecnologias e feedbacks.

### Feedbacks

**POST /api/projects/:id/feedbacks**: cadastra um feedback em um projeto.

```json
{
  "author": "Ana",
  "comment": "Gostei da organização!"
}
```

- `author` e `comment` são obrigatórios.

## Códigos de resposta

| Código | Significado |
|---|---|
| 200 | Consulta realizada com sucesso |
| 201 | Registro criado |
| 400 | Dados inválidos (validação) |
| 404 | Registro não encontrado |
| 409 | Registro já existente (e-mail ou tecnologia repetidos) |
| 500 | Erro interno |