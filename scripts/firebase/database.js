// database.js - VERSÃO COMPLETAMENTE CORRIGIDA

class FirebaseDatabase {
  constructor() {
    this.db = firebase.database();
    this.playersRef = this.db.ref("birdbox/players");
    this.queueRef = this.db.ref("birdbox/queue");
    this.gamesRef = this.db.ref("birdbox/games");
    this.questionsRef = this.db.ref("birdbox/questions");
  }

  // Adicionar jogador à fila - CORREÇÃO TOTAL
  async addPlayerToQueue(playerId, playerName) {
    try {
      console.log(`🎯 Tentando adicionar ${playerName} (${playerId}) à fila`);

      // VERIFICAÇÃO CRÍTICA: jogador já está na fila?
      const alreadyInQueue = await this.isPlayerInQueue(playerId);
      if (alreadyInQueue) {
        console.log(`⚠️ ${playerName} já está na fila, ignorando...`);
        return true; // Retorna true pois já está na fila
      }

      // VERIFICAÇÃO CRÍTICA: jogador já está em jogo ativo?
      const inActiveGame = await this.isPlayerInActiveGame(playerId);
      if (inActiveGame) {
        console.log(
          `❌ ${playerName} já está em jogo ativo, não pode entrar na fila`
        );
        return false;
      }

      // Obter fila atual ordenada por timestamp
      const queueSnapshot = await this.queueRef
        .orderByChild("timestamp")
        .once("value");
      const queue = queueSnapshot.val() || {};

      const queueArray = Object.entries(queue)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Calcular nova posição
      const position = queueArray.length + 1;
      const papel = position % 2 === 1 ? "ouvinte" : "leitor";

      console.log(
        `✅ ${playerName} adicionado à fila: posição ${position}, ${papel}`
      );

      // Adicionar à fila
      await this.queueRef.child(playerId).set({
        nome: playerName,
        timestamp: Date.now(),
        status: "esperando",
        position: position,
        papel: papel,
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
      console.log(`🗑️ ${playerId} removido da fila`);
      return true;
    } catch (error) {
      console.error("Erro ao remover da fila:", error);
      return false;
    }
  }

  // Obter fila ordenada - CORRIGIDO
  async getOrderedQueue() {
    try {
      const snapshot = await this.queueRef
        .orderByChild("timestamp")
        .once("value");
      const queue = snapshot.val();

      if (!queue) return [];

      const queueArray = Object.entries(queue)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.timestamp - b.timestamp);

      console.log(`📊 Fila obtida: ${queueArray.length} jogadores`);
      queueArray.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.nome} (${player.id})`);
      });

      return queueArray;
    } catch (error) {
      console.error("Erro ao obter fila ordenada:", error);
      return [];
    }
  }
  async saveTeamScore(gameId, teamName, score) {
    try {
      console.log(
        `💾 Salvando DUPLA no ranking: ${teamName} - ${score} pontos`
      );

      // 🎯 VERIFICAR SE JÁ EXISTE ANTES DE SALVAR
      const existingSnapshot = await this.db
        .ref("birdbox/ranking")
        .orderByChild("gameId")
        .equalTo(gameId)
        .once("value");

      if (existingSnapshot.exists()) {
        console.log("📊 Dupla já existe no ranking, atualizando...");
        const existingKey = Object.keys(existingSnapshot.val())[0];

        await this.db.ref(`birdbox/ranking/${existingKey}`).update({
          nome: teamName,
          pontuacao: score,
          ultimaAtualizacao: new Date().toISOString(),
        });
      } else {
        // 🎯 SALVAR NOVA DUPLA
        const rankingRef = this.db.ref("birdbox/ranking").push();

        await rankingRef.set({
          nome: teamName,
          pontuacao: score,
          data: Date.now(),
          jogos: 1,
          ultimaAtualizacao: new Date().toISOString(),
          gameId: gameId,
          tipo: "dupla",
        });
      }

      console.log(
        `✅ Dupla salva/atualizada no ranking: ${teamName} - ${score} pontos`
      );
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar dupla no ranking:", error);
      return false;
    }
  }
  // MÉTODO PARA CALCULAR PONTUAÇÃO TOTAL DA DUPLA
  async calculateTeamScore(gameId) {
    try {
      const gameSnapshot = await this.db
        .ref(`birdbox/games/${gameId}/jogadores`)
        .once("value");
      const players = gameSnapshot.val();

      if (!players) return 0;

      let totalScore = 0;
      Object.values(players).forEach((player) => {
        totalScore += player.pontuacao || 0;
      });

      console.log(`📊 Pontuação total da dupla: ${totalScore}`);
      return totalScore;
    } catch (error) {
      console.error("❌ Erro ao calcular pontuação da dupla:", error);
      return 0;
    }
  }

  // 🎯 MÉTODO PARA GERAR NOME DA DUPLA
  async generateTeamName(gameId) {
    try {
      const gameSnapshot = await this.db
        .ref(`birdbox/games/${gameId}/jogadores`)
        .once("value");
      const players = gameSnapshot.val();

      if (!players) return "Dupla Anônima";

      const playerNames = Object.values(players)
        .map((p) => p.nome)
        .filter((name) => name && name.trim() !== "");

      if (playerNames.length === 2) {
        return `${playerNames[0]} & ${playerNames[1]}`;
      } else if (playerNames.length === 1) {
        return `${playerNames[0]} & Parceiro`;
      } else {
        return "Dupla Misteriosa";
      }
    } catch (error) {
      console.error("❌ Erro ao gerar nome da dupla:", error);
      return "Dupla do BirdBox";
    }
  }
  async initializeRankingStructure() {
    try {
      const rankingRef = this.db.ref("birdbox/ranking");
      const snapshot = await rankingRef.once("value");

      if (!snapshot.exists()) {
        console.log("🏗️ Criando estrutura inicial do ranking...");
        await rankingRef.set({
          _initialized: true,
          _createdAt: Date.now(),
          _description: "Ranking do BirdBox Game",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao inicializar ranking:", error);
    }
  }
  // Criar jogo - CORREÇÃO RADICAL
  async createNewGame(player1Id, player1Data, player2Id, player2Data) {
    try {
      console.log(`🎮 CRIANDO JOGO: ${player1Data.nome} + ${player2Data.nome}`);

      // VERIFICAÇÃO EXTREMA: são jogadores diferentes?
      if (player1Id === player2Id) {
        console.log(
          `❌ ERRO CRÍTICO: Mesmo jogador (${player1Id}) tentando criar jogo consigo mesmo`
        );
        await this.removePlayerFromQueue(player1Id);
        return null;
      }

      // VERIFICAÇÃO: ambos ainda na fila?
      const player1InQueue = await this.isPlayerInQueue(player1Id);
      const player2InQueue = await this.isPlayerInQueue(player2Id);

      if (!player1InQueue || !player2InQueue) {
        console.log(
          `❌ Um dos jogadores saiu da fila: ${
            player1InQueue ? "P1 OK" : "P1 FALTOU"
          }, ${player2InQueue ? "P2 OK" : "P2 FALTOU"}`
        );
        return null;
      }

      const gameId = this.generateGameId();

      // Definir papéis corretamente
      const player1Papel =
        player1Data.position % 2 === 1 ? "ouvinte" : "leitor";
      const player2Papel =
        player2Data.position % 2 === 1 ? "ouvinte" : "leitor";

      // CORREÇÃO: garantir um ouvinte e um leitor
      const finalPlayer1Papel = player1Papel;
      const finalPlayer2Papel =
        player1Papel === "ouvinte" ? "leitor" : "ouvinte";

      console.log(
        `📊 Papéis: ${player1Data.nome}=${finalPlayer1Papel}, ${player2Data.nome}=${finalPlayer2Papel}`
      );

      // Obter perguntas
      const questions = await this.getRandomQuestions(5);
      if (questions.length === 0) {
        console.log("❌ Nenhuma pergunta disponível, cancelando jogo");
        return null;
      }

      const gameData = {
        jogadores: {
          [player1Id]: {
            nome: player1Data.nome,
            papel: finalPlayer1Papel,
            pontuacao: 0,
            status: "conectado",
            ready: false,
          },
          [player2Id]: {
            nome: player2Data.nome,
            papel: finalPlayer2Papel,
            pontuacao: 0,
            status: "conectado",
            ready: false,
          },
        },
        status: "ativo",
        timestamp: Date.now(),
        currentQuestionIndex: 0,
        selectedQuestions: questions,
        round: 1,
        maxRounds: 5,
        duracao: 0,
      };

      // 🔒 ORDEM CRÍTICA

      // 1. PRIMEIRO remover da fila
      await this.removePlayerFromQueue(player1Id);
      await this.removePlayerFromQueue(player2Id);

      // 2. DEPOIS criar jogo
      await this.gamesRef.child(gameId).set(gameData);

      // 3. FINALMENTE atualizar referências
      await this.db.ref(`birdbox/players/${player1Id}/currentGame`).set(gameId);
      await this.db.ref(`birdbox/players/${player2Id}/currentGame`).set(gameId);

      console.log(`🎉 JOGO CRIADO: ${gameId}`);
      console.log(`   👂 ${player1Data.nome} (${finalPlayer1Papel})`);
      console.log(`   📖 ${player2Data.nome} (${finalPlayer2Papel})`);
      console.log(`   📝 ${questions.length} perguntas`);

      return gameId;
    } catch (error) {
      console.error("❌ ERRO ao criar jogo:", error);
      return null;
    }
  }

  // Obter perguntas aleatórias - CORRIGIDO
  async getRandomQuestions(count) {
    try {
      const snapshot = await this.questionsRef.once("value");
      const allQuestions = snapshot.val();

      if (!allQuestions) {
        console.log("⚠️ Nenhuma pergunta no banco, usando padrão...");
        // Perguntas padrão de emergência
        return [
          {
            id: 1,
            pergunta: "Qual é o seu livro favorito?",
            opcoes: ["A", "B", "C", "D"],
            resposta: 0,
          },
          {
            id: 2,
            pergunta: "Quem escreveu Dom Casmurro?",
            opcoes: ["Machado", "Aluísio", "José", "Carlos"],
            resposta: 0,
          },
          {
            id: 3,
            pergunta: "O que é um soneto?",
            opcoes: ["Poema", "Romance", "Conto", "Crônica"],
            resposta: 0,
          },
        ];
      }

      const questionArray = Object.values(allQuestions);
      const shuffled = [...questionArray].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      console.log(`📝 ${selected.length} perguntas selecionadas`);
      return selected;
    } catch (error) {
      console.error("Erro ao obter perguntas:", error);
      return [];
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

  // Verificar se jogador está em jogo ativo
  async isPlayerInActiveGame(playerId) {
    try {
      const gameIdSnapshot = await this.db
        .ref(`birdbox/players/${playerId}/currentGame`)
        .once("value");
      const gameId = gameIdSnapshot.val();

      if (!gameId) return false;

      const gameSnapshot = await this.db
        .ref(`birdbox/games/${gameId}`)
        .once("value");
      const gameData = gameSnapshot.val();

      return gameData && gameData.status === "ativo";
    } catch (error) {
      console.error("Erro ao verificar jogo ativo:", error);
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

  // Gerar ID único para a partida
  generateGameId() {
    return "game_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Parar de ouvir mudanças na fila
  stopListeningToQueue(listener) {
    this.queueRef.off("value", listener);
  }
}

// Instância global do banco de dados
const firebaseDB = new FirebaseDatabase();
