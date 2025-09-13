// Script para a página de espera

document.addEventListener("DOMContentLoaded", function () {
  const cancelButton = document.getElementById("cancelButton");
  const queueStatus = document.getElementById("queueStatus");
  const playersWaiting = document.getElementById("playersWaiting");

  // Verificar se firebaseDB está disponível
  if (typeof firebaseDB === "undefined") {
    console.error("firebaseDB não está definido");
    queueStatus.textContent = "Erro de conexão. Recarregue a página.";
    cancelButton.textContent = "Voltar";
    return;
  }

  // Verificar se temos informações do jogador
  const playerId = localStorage.getItem("playerId");
  const playerName = localStorage.getItem("playerName");

  if (!playerId || !playerName) {
    window.location.href = "index.html";
    return;
  }

  // Atualizar contador inicial
  updatePlayerCount();

  // Entrar na fila
  queueManager.enterQueue().then((success) => {
    if (!success) {
      queueStatus.textContent = "Erro ao entrar na fila";
      cancelButton.textContent = "Tentar novamente";
    }
  });

  // Botão de cancelar
  cancelButton.addEventListener("click", function () {
    queueManager.leaveQueue().then(() => {
      window.location.href = "index.html";
    });
  });

  // Verificar se já está em uma partida (em caso de reconexão)
  setTimeout(async () => {
    const status = await queueManager.checkExistingGame();
    if (status.inGame) {
      window.location.href = `jogo.html?gameId=${status.gameId}`;
    }
  }, 2000);

  // Atualizar contador periodicamente
  setInterval(updatePlayerCount, 5000);

  // Função para atualizar contador de jogadores
  async function updatePlayerCount() {
    try {
      const count = await firebaseDB.getQueueCount();
      playersWaiting.textContent = `${count} jogador(es) na fila`;
    } catch (error) {
      console.error("Erro ao atualizar contador:", error);
    }
  }
});
