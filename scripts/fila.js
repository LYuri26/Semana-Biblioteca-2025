// Lógica de fila para o jogo BirdBox

class QueueManager {
  constructor() {
    this.playerId = localStorage.getItem("playerId");
    this.playerName = localStorage.getItem("playerName");
    this.queueListener = null;
    this.isLookingForMatch = false;
  }

  // Entrar na fila
  async enterQueue() {
    if (!this.playerId || !this.playerName) {
      console.error("ID ou nome do jogador não encontrado");
      return false;
    }

    this.isLookingForMatch = true;

    // Adicionar jogador à fila
    const success = await firebaseDB.addPlayerToQueue(
      this.playerId,
      this.playerName
    );

    if (success) {
      this.listenForMatches();
      this.updateQueueStatus();
      return true;
    }

    return false;
  }

  // Sair da fila
  async leaveQueue() {
    this.isLookingForMatch = false;

    if (this.queueListener) {
      firebaseDB.stopListeningToQueue(this.queueListener);
      this.queueListener = null;
    }

    return await firebaseDB.removePlayerFromQueue(this.playerId);
  }

  // Ouvir por possíveis matches
  listenForMatches() {
    this.queueListener = firebaseDB.listenToQueueChanges(async (snapshot) => {
      if (!this.isLookingForMatch) return;

      const queue = snapshot.val();
      if (!queue) return;

      const playerIds = Object.keys(queue);

      // Remover o próprio jogador da lista
      const otherPlayers = playerIds.filter((id) => id !== this.playerId);

      if (otherPlayers.length >= 1) {
        // Encontrar um parceiro
        const partnerId = otherPlayers[0];
        const partnerData = queue[partnerId];

        // Criar partida
        const gameId = await firebaseDB.createNewGame(
          this.playerId,
          this.playerName,
          partnerId,
          partnerData.nome
        );

        if (gameId) {
          // Remover ambos os jogadores da fila
          await this.leaveQueue();
          await firebaseDB.removePlayerFromQueue(partnerId);

          // Redirecionar para o jogo
          window.location.href = `jogo.html?gameId=${gameId}`;
        }
      }

      this.updateQueueCount(playerIds.length);
    });
  }

  // Atualizar contador de jogadores na fila
  updateQueueCount(count) {
    const countElement = document.getElementById("playersWaiting");
    if (countElement) {
      countElement.textContent = `${count} jogador(es) na fila`;
    }
  }

  // Atualizar status da fila na UI
  updateQueueStatus() {
    const statusElement = document.getElementById("queueStatus");
    if (statusElement) {
      statusElement.textContent = "Procurando parceiro...";
    }
  }

  // Verificar se já está em uma partida ativa
  async checkExistingGame() {
    try {
      const gamesSnapshot = await firebaseDB.gamesRef
        .orderByChild("status")
        .equalTo("ativo")
        .once("value");
      const games = gamesSnapshot.val();

      if (games) {
        for (const gameId in games) {
          const game = games[gameId];
          if (game.jogadores && game.jogadores[this.playerId]) {
            return { inGame: true, gameId: gameId };
          }
        }
      }

      return { inGame: false };
    } catch (error) {
      console.error("Erro ao verificar partida existente:", error);
      return { inGame: false };
    }
  }
}

// Instância global do gerenciador de fila
const queueManager = new QueueManager();
