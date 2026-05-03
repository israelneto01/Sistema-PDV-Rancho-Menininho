const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');

router.get('/', pedidosController.listarPedidos);
router.get('/:id', pedidosController.buscarPedidoPorId);
router.post('/', pedidosController.criarPedido);
router.put('/:id', pedidosController.atualizarPedido);
router.delete('/:id', pedidosController.removerPedido);

module.exports = router;
