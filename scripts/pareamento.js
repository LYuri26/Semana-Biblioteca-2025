// Sistema de pareamento de jogadores para o BirdBox

class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000; // Verificar a cada 3 segundos
  }

  // Iniciar sistema de pareamento
  startMatching() {
    console.log("Sistema de pareamento iniciado");

    this.checkInterval = setInterval(async () => {
      await this.checkForMatches();
    }, this.checkDelay);
  }

  // Parar sistema de pareamento
  stopMatching() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Sistema de pareamento parado");
    }
  }

  // Verificar por matches possíveis
  async checkForMatches() {
    try {
      const queueSnapshot = await firebaseDB.queueRef.once("value");
      const queue = queueSnapshot.val();

      if (!queue) return;

      const playerIds = Object.keys(queue);

      // Se há pelo menos 2 jogadores na fila
      if (playerIds.length >= 2) {
        // Pegar os dois primeiros jogadores
        const player1Id = playerIds[0];
        const player2Id = playerIds[1];
        const player1Data = queue[player1Id];
        const player2Data = queue[player2Id];

        // Criar partida
        const gameId = await firebaseDB.createNewGame(
          player1Id,
          player1Data.nome,
          player2Id,
          player2Data.nome
        );

        if (gameId) {
          console.log(`Partida criada: ${gameId}`);

          // Remover jogadores da fila
          await firebaseDB.removePlayerFromQueue(player1Id);
          await firebaseDB.removePlayerFromQueue(player2Id);

          // Aqui você pode enviar notificações para os jogadores
          // ou redirecioná-los automaticamente
        }
      }
    } catch (error) {
      console.error("Erro no sistema de pareamento:", error);
    }
  }

  // Verificar status de pareamento para um jogador específico
  async checkPlayerStatus(playerId) {
    try {
      // Verificar se o jogador já está em uma partida
      const gamesSnapshot = await firebaseDB.gamesRef
        .orderByChild("status")
        .equalTo("ativo")
        .once("value");
      const games = gamesSnapshot.val();

      if (games) {
        for (const gameId in games) {
          const game = games[gameId];
          if (game.jogadores && game.jogadores[playerId]) {
            return { inGame: true, gameId: gameId };
          }
        }
      }

      return { inGame: false };
    } catch (error) {
      console.error("Erro ao verificar status do jogador:", error);
      return { inGame: false };
    }
  }
}

// Instância global do sistema de pareamento
const matchingSystem = new MatchingSystem();

// Iniciar sistema de pareamento quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  // Iniciar apenas se estamos na página admin ou se necessário
  if (window.location.pathname.includes("admin.html")) {
    matchingSystem.startMatching();
  }
});
