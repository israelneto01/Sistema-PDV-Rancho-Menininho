# Rancho Menininho - Código 

## Estrutura

```text
rancho_menininho_fragmentado/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── firebase.js
└── backend/
    ├── server.js
    ├── package.json
    ├── controllers/
    │   └── pedidos.controller.js
    ├── routes/
    │   └── pedidos.routes.js
    └── data/
        └── pedidos.json
```

## Como rodar o front-end

Abra o arquivo `frontend/index.html` no navegador ou use a extensão Live Server no VS Code.

## Como rodar o back-end

Entre na pasta `backend` e execute:

```bash
npm install
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

## Rotas criadas no back-end

```text
GET    /pedidos       Lista todos os pedidos
GET    /pedidos/:id   Busca um pedido específico
POST   /pedidos       Cria um novo pedido
PUT    /pedidos/:id   Atualiza um pedido
DELETE /pedidos/:id   Remove um pedido
```

## Observação

O front-end ainda mantém a lógica visual original e o arquivo `firebase.js` separado. O back-end em Express foi criado para organizar a parte de servidor e permitir evolução futura sem deixar tudo dentro do mesmo HTML.
