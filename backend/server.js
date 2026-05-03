const express = require('express');
const cors = require('cors');
const pedidosRoutes = require('./routes/pedidos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API Rancho Menininho funcionando.' });
});

app.use('/pedidos', pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
