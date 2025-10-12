// pareamento.js - VERSÃO RADICALMENTE CORRIGIDA

class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000;
    this.isRunning = false;
    this.isProcessing = false;
    this.processingLock = false; // Lock adicional
  }

  startMatching() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🎯 SISTEMA DE PAREAMENTO INICIADO");

    this.checkForMatches();
    this.checkInterval = setInterval(() => {
      this.checkForMatches();
    }, this.checkDelay);
  }

  async checkForMatches() {
    // 🔒 DUPLO LOCK para prevenir concorrência
    if (this.isProcessing || this.processingLock) {
      return;
    }

    this.isProcessing = true;
    this.processingLock = true;

    try {
      const orderedQueue = await firebaseDB.getOrderedQueue();

      if (orderedQueue.length < 2) {
        if (orderedQueue.length === 1) {
          console.log(`⏳ 1 jogador na fila: ${orderedQueue[0].nome}`);
        }
        return;
      }

      console.log(`🔍 ${orderedQueue.length} jogadores na fila:`);
      orderedQueue.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.nome} (${player.papel})`);
      });

      // LÓGICA SIMPLES: processar UM par por vez
      const player1 = orderedQueue[0];
      const player2 = orderedQueue[1];

      console.log(`🤝 TENTANDO PAR: ${player1.nome} + ${player2.nome}`);

      const canPair = await this.verifyPlayersCanPair(player1.id, player2.id);

      if (canPair) {
        console.log(`✅ PAR APROVADO, criando jogo...`);

        const gameId = await firebaseDB.createNewGame(
          player1.id,
          player1,
          player2.id,
          player2
        );

        if (gameId) {
          console.log(`🎉 JOGO CRIADO: ${gameId}`);
          console.log(`   👥 ${player1.nome} + ${player2.nome}`);

          // Log do estado da fila
          const newQueueSize = orderedQueue.length - 2;
          console.log(`📊 FILA ATUAL: ${newQueueSize} jogador(es) restante(s)`);
        } else {
          console.log(
            `❌ FALHA ao criar jogo para: ${player1.nome} + ${player2.nome}`
          );
        }
      }
    } catch (error) {
      console.error("❌ ERRO NO PAREAMENTO:", error);
    } finally {
      // 🔓 LIBERAR LOCKS
      this.isProcessing = false;
      setTimeout(() => {
        this.processingLock = false;
      }, 1000); // Delay extra de segurança
    }
  }

  async verifyPlayersCanPair(player1Id, player2Id) {
    try {
      console.log(`🔍 VERIFICAÇÃO DE PAR: ${player1Id} + ${player2Id}`);

      // Verificação básica: ambos na fila
      const player1InQueue = await firebaseDB.isPlayerInQueue(player1Id);
      const player2InQueue = await firebaseDB.isPlayerInQueue(player2Id);

      if (!player1InQueue || !player2InQueue) {
        console.log("❌ Um ou ambos os jogadores saíram da fila");
        return false;
      }

      // Verificação extra: não estão em jogo ativo
      const player1InGame = await firebaseDB.isPlayerInActiveGame(player1Id);
      const player2InGame = await firebaseDB.isPlayerInActiveGame(player2Id);

      if (player1InGame || player2InGame) {
        console.log("❌ Um ou ambos os jogadores já estão em jogo");
        // Limpar jogadores problemáticos
        if (player1InGame) await firebaseDB.removePlayerFromQueue(player1Id);
        if (player2InGame) await firebaseDB.removePlayerFromQueue(player2Id);
        return false;
      }

      console.log("✅ PAR VERIFICADO E APROVADO");
      return true;
    } catch (error) {
      console.error("Erro na verificação:", error);
      return false;
    }
  }

  stopMatching() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.isRunning = false;
    console.log("🛑 SISTEMA DE PAREAMENTO PARADO");
  }
}

// Instância global
const matchingSystem = new MatchingSystem();

// Inicialização segura
function startMatchingWhenReady() {
  if (typeof firebaseDB !== "undefined" && firebaseDB.db) {
    console.log("🔥 FIREBASE PRONTO, iniciando pareamento em 5 segundos...");
    setTimeout(() => {
      matchingSystem.startMatching();
    }, 5000);
  } else {
    setTimeout(startMatchingWhenReady, 1000);
  }
}

// Iniciar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMatchingWhenReady);
} else {
  startMatchingWhenReady();
}
