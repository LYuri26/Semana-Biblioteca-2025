// Gerenciamento do nome do jogador e entrada no jogo

document.addEventListener("DOMContentLoaded", function () {
  const playerNameInput = document.getElementById("playerName");
  const enterButton = document.getElementById("enterGame");

  // Verificar se firebaseDB está disponível
  if (typeof firebaseDB === "undefined") {
    console.error(
      "firebaseDB não está definido. Verifique se config.js e database.js foram carregados."
    );
    enterButton.disabled = true;
    enterButton.textContent = "Erro de conexão";
    return;
  }

  // Gerar ID único para o jogador
  const playerId =
    "player_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("playerId", playerId);

  enterButton.addEventListener("click", function () {
    const playerName = playerNameInput.value.trim();

    if (playerName.length < 2) {
      alert("Por favor, digite um nome com pelo menos 2 caracteres");
      return;
    }

    // Salvar nome no localStorage
    localStorage.setItem("playerName", playerName);

    // Desabilitar botão para evitar múltiplos cliques
    enterButton.disabled = true;
    enterButton.textContent = "Conectando...";

    // Adicionar à fila de espera
    firebaseDB
      .addPlayerToQueue(playerId, playerName)
      .then((success) => {
        if (success) {
          // Redirecionar para a página de espera
          window.location.href = "espera.html";
        } else {
          alert("Erro ao entrar na fila. Tente novamente.");
          enterButton.disabled = false;
          enterButton.textContent = "Entrar no Jogo";
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro de conexão. Verifique sua internet.");
        enterButton.disabled = false;
        enterButton.textContent = "Entrar no Jogo";
      });
  });

  // Permitir entrar com Enter
  playerNameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      enterButton.click();
    }
  });

  // Focar automaticamente no campo de nome
  playerNameInput.focus();
});
