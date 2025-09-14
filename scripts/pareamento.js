// Sistema de pareamento de jogadores para o BirdBox
class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000;
    this.isRunning = false;
  }

  // Iniciar sistema de pareamento
  startMatching() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("Sistema de pareamento iniciado");

    // Fazer uma verificação imediata
    this.checkForMatches();

    // Configurar verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkForMatches();
    }, this.checkDelay);
  }

  // Parar sistema de pareamento
  stopMatching() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log("Sistema de pareamento parado");
  }

  async checkForMatches() {
    try {
      const queueSnapshot = await firebaseDB.queueRef.once("value");
      const queue = queueSnapshot.val();

      if (!queue) {
        console.log("Fila vazia");
        return;
      }

      const playerIds = Object.keys(queue);
      console.log(`Jogadores na fila: ${playerIds.length}`);

      // Verificar se os jogadores já estão em partidas ativas
      const availablePlayers = [];

      for (const playerId of playerIds) {
        const inActiveGame = await this.isPlayerInActiveGame(playerId);
        if (!inActiveGame) {
          availablePlayers.push(playerId);
        } else {
          // Remover jogador da fila se já estiver em jogo ativo
          await firebaseDB.removePlayerFromQueue(playerId);
          console.log(
            `Jogador ${playerId} removido da fila (já em jogo ativo)`
          );
        }
      }

      console.log(`Jogadores disponíveis: ${availablePlayers.length}`);

      // Criar partidas com jogadores disponíveis
      while (availablePlayers.length >= 2) {
        const player1Id = availablePlayers.shift();
        const player2Id = availablePlayers.shift();

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

          // Pequena pausa para evitar conflitos
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Erro no sistema de pareamento:", error);
    }
  }

  async isPlayerInActiveGame(playerId) {
    try {
      const gameIdSnapshot = await firebaseDB.db
        .ref(`birdbox/players/${playerId}/currentGame`)
        .once("value");
      const gameId = gameIdSnapshot.val();

      if (gameId) {
        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${gameId}`)
          .once("value");
        const gameData = gameSnapshot.val();

        // Verificar se o jogo existe e está ativo
        return gameData && gameData.status === "ativo";
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar jogo ativo:", error);
      return false;
    }
  }

  async updatePlayersWithGameId(player1Id, player2Id, gameId) {
    try {
      // Salvar o gameId para os jogadores acessarem
      await firebaseDB.db
        .ref(`birdbox/players/${player1Id}/currentGame`)
        .set(gameId);
      await firebaseDB.db
        .ref(`birdbox/players/${player2Id}/currentGame`)
        .set(gameId);

      console.log("GameId salvo para os jogadores");

      // Adicionar timestamp para controle
      await firebaseDB.db
        .ref(`birdbox/games/${gameId}/pareadoEm`)
        .set(Date.now());
    } catch (error) {
      console.error("Erro ao salvar gameId:", error);
    }
  }
}

// Instância global do sistema de pareamento
const matchingSystem = new MatchingSystem();

// Iniciar sistema de pareamento quando o Firebase estiver pronto
function startMatchingWhenReady() {
  if (typeof firebaseDB !== "undefined" && firebaseDB.db) {
    console.log("Firebase pronto, iniciando sistema de pareamento...");
    matchingSystem.startMatching();
  } else {
    setTimeout(startMatchingWhenReady, 1000);
  }
}

// Iniciar quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  console.log("Página carregada, aguardando Firebase...");
  startMatchingWhenReady();
});
