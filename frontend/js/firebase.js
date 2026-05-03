import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// SUA CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD0RR6LdGP-v9FltCvyKoC-2THASbHk_hs",
  authDomain: "rancho-menininho.firebaseapp.com",
  databaseURL: "https://rancho-menininho-default-rtdb.firebaseio.com",
  projectId: "rancho-menininho",
  storageBucket: "rancho-menininho.firebasestorage.app",
  messagingSenderId: "74354017912",
  appId: "1:74354017912:web:cfbf53da0afbcbe60b0f8d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

//////////////////////////////////////////////////
// 🔥 SALVAR PEDIDO
window.salvarPedido = function(mesa, itens, total){
  const pedido = {
    mesa: mesa,
    itens: itens,
    total: total,
    status: "aberto",
    data: new Date().toLocaleString()
  };

  push(ref(db, "pedidos"), pedido);
};

//////////////////////////////////////////////////
// 👀 OUVIR PEDIDOS EM TEMPO REAL
const lista = document.getElementById("listaPedidos");

onValue(ref(db, "pedidos"), (snapshot) => {
  const dados = snapshot.val();
  lista.innerHTML = "";

  if (!dados) {
    lista.innerHTML = "<p>Nenhum pedido salvo ainda.</p>";
    return;
  }

  for (let id in dados) {
    const p = dados[id];

    lista.innerHTML += `
      <div style="border:1px solid #ccc; margin:10px; padding:10px;">
        <strong>Mesa:</strong> ${p.mesa} <br>
        <strong>Total:</strong> R$ ${p.total} <br>
        <strong>Status:</strong> ${p.status} <br>
        <strong>Itens:</strong> ${p.itens.join(", ")}
      </div>
    `;
  }
});
