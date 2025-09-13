// Funções de banco de dados do Firebase para o Jogo BirdBox

class FirebaseDatabase {
  constructor() {
    this.db = firebase.database();
    this.playersRef = this.db.ref("birdbox/players");
    this.queueRef = this.db.ref("birdbox/queue");
    this.gamesRef = this.db.ref("birdbox/games");
    this.questionsRef = this.db.ref("birdbox/questions");
  }

  // Adicionar jogador à fila de espera
  async addPlayerToQueue(playerId, playerName) {
    try {
      await this.queueRef.child(playerId).set({
        nome: playerName,
        timestamp: Date.now(),
        status: "esperando",
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar à fila:", error);
      return false;
    }
  }

  // Remover jogador da fila
  async removePlayerFromQueue(playerId) {
    try {
      await this.queueRef.child(playerId).remove();
      return true;
    } catch (error) {
      console.error("Erro ao remover da fila:", error);
      return false;
    }
  }

  // Verificar se jogador está na fila
  async isPlayerInQueue(playerId) {
    try {
      const snapshot = await this.queueRef.child(playerId).once("value");
      return snapshot.exists();
    } catch (error) {
      console.error("Erro ao verificar fila:", error);
      return false;
    }
  }

  // Obter número de jogadores na fila
  async getQueueCount() {
    try {
      const snapshot = await this.queueRef.once("value");
      return snapshot.numChildren();
    } catch (error) {
      console.error("Erro ao contar fila:", error);
      return 0;
    }
  }

  // Ouvir mudanças na fila de espera
  listenToQueueChanges(callback) {
    return this.queueRef.on("value", callback);
  }

  // Parar de ouvir mudanças na fila
  stopListeningToQueue(listener) {
    this.queueRef.off("value", listener);
  }

  // Criar uma nova partida
  async createNewGame(player1Id, player1Name, player2Id, player2Name) {
    try {
      const gameId = this.generateGameId();
      const gameData = {
        jogadores: {
          [player1Id]: {
            nome: player1Name,
            papel: "ouvinte",
            pontuacao: 0,
            status: "conectado",
          },
          [player2Id]: {
            nome: player2Name,
            papel: "adivinhador",
            pontuacao: 0,
            status: "conectado",
          },
        },
        status: "ativo",
        timestamp: Date.now(),
        perguntaAtual: null,
        round: 1,
        duracao: 0,
      };

      await this.gamesRef.child(gameId).set(gameData);
      return gameId;
    } catch (error) {
      console.error("Erro ao criar partida:", error);
      return null;
    }
  }

  // Gerar ID único para a partida
  generateGameId() {
    return "game_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Obter perguntas do banco de dados
  async getQuestions() {
    try {
      const snapshot = await this.questionsRef.once("value");
      return snapshot.val();
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      return null;
    }
  }

  // Atualizar status do jogador
  async updatePlayerStatus(gameId, playerId, status) {
    try {
      await this.gamesRef
        .child(`${gameId}/jogadores/${playerId}/status`)
        .set(status);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return false;
    }
  }

  // Atualizar pontuação do jogador
  async updatePlayerScore(gameId, playerId, score) {
    try {
      await this.gamesRef
        .child(`${gameId}/jogadores/${playerId}/pontuacao`)
        .set(score);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar pontuação:", error);
      return false;
    }
  }

  // Finalizar partida
  async endGame(gameId, scores) {
    try {
      await this.gamesRef.child(gameId).update({
        status: "finalizado",
        finalizadoEm: Date.now(),
        pontuacaoFinal: scores,
      });
      return true;
    } catch (error) {
      console.error("Erro ao finalizar partida:", error);
      return false;
    }
  }
}

// Instância global do banco de dados
const firebaseDB = new FirebaseDatabase();
