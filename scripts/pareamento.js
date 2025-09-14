// Sistema de pareamento de jogadores para o BirdBox
class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000;
  }

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

        console.log(
          "Encontrados jogadores para parear:",
          player1Data.nome,
          player2Data.nome
        );

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

          // Atualizar o gameId nos jogadores para redirecionamento
          await this.updatePlayersWithGameId(player1Id, player2Id, gameId);
        }
      }
    } catch (error) {
      console.error("Erro no sistema de pareamento:", error);
    }
  }

  async updatePlayersWithGameId(player1Id, player2Id, gameId) {
    try {
      // Salvar o gameId em algum lugar para os jogadores acessarem
      await firebaseDB.db
        .ref(`birdbox/players/${player1Id}/currentGame`)
        .set(gameId);
      await firebaseDB.db
        .ref(`birdbox/players/${player2Id}/currentGame`)
        .set(gameId);

      console.log("GameId salvo para os jogadores");
    } catch (error) {
      console.error("Erro ao salvar gameId:", error);
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
