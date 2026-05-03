document.getElementById("formLogin").addEventListener("submit", function (e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const mensagemErro = document.getElementById("mensagemErro");

  if (usuario === "admin" && senha === "1234") {
    localStorage.setItem("logado", "true");
    window.location.href = "index.html";
  } else {
    mensagemErro.textContent = "Usuário ou senha incorretos.";
  }
});