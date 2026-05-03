const fs = require('fs');
const path = require('path');

const arquivoPedidos = path.join(__dirname, '..', 'data', 'pedidos.json');

function lerPedidos() {
  if (!fs.existsSync(arquivoPedidos)) return [];
  return JSON.parse(fs.readFileSync(arquivoPedidos, 'utf-8'));
}

function salvarPedidos(pedidos) {
  fs.writeFileSync(arquivoPedidos, JSON.stringify(pedidos, null, 2));
}

exports.listarPedidos = (req, res) => {
  const pedidos = lerPedidos();
  res.json(pedidos);
};

exports.buscarPedidoPorId = (req, res) => {
  const pedidos = lerPedidos();
  const pedido = pedidos.find((p) => p.id === Number(req.params.id));

  if (!pedido) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
  }

  res.json(pedido);
};

exports.criarPedido = (req, res) => {
  const { mesa, itens, total, status } = req.body;

  if (!mesa || !Array.isArray(itens) || itens.length === 0 || total == null) {
    return res.status(400).json({
      mensagem: 'Informe mesa, itens e total para criar o pedido.'
    });
  }

  const pedidos = lerPedidos();
  const novoPedido = {
    id: Date.now(),
    mesa,
    itens,
    total: Number(total),
    status: status || 'aberto',
    data: new Date().toLocaleString('pt-BR')
  };

  pedidos.push(novoPedido);
  salvarPedidos(pedidos);

  res.status(201).json(novoPedido);
};

exports.atualizarPedido = (req, res) => {
  const pedidos = lerPedidos();
  const index = pedidos.findIndex((p) => p.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
  }

  pedidos[index] = { ...pedidos[index], ...req.body };
  salvarPedidos(pedidos);

  res.json(pedidos[index]);
};

exports.removerPedido = (req, res) => {
  const pedidos = lerPedidos();
  const pedidosFiltrados = pedidos.filter((p) => p.id !== Number(req.params.id));

  if (pedidos.length === pedidosFiltrados.length) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
  }

  salvarPedidos(pedidosFiltrados);
  res.json({ mensagem: 'Pedido removido com sucesso.' });
};
