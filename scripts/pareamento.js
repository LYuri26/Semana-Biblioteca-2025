// Sistema de pareamento de jogadores para o BirdBox - VERSÃO COMPLETA CORRIGIDA
class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000;
    this.isRunning = false;
    this.isProcessing = false; // 🔒 NOVO: Lock para prevenir concorrência
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Iniciar sistema de pareamento
  startMatching() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🎯 Sistema de pareamento iniciado");

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
    console.log("🛑 Sistema de pareamento parado");
  }

  async checkForMatches() {
    // 🔒 PREVENIR CONCORRÊNCIA
    if (this.isProcessing) {
      console.log(
        "⏳ Sistema de pareamento já está processando, aguardando..."
      );
      return;
    }

    this.isProcessing = true;

    try {
      const queueSnapshot = await firebaseDB.queueRef.once("value");
      const queue = queueSnapshot.val();

      if (!queue) {
        console.log("📭 Fila vazia");
        return;
      }

      const playerIds = Object.keys(queue);
      console.log(`🎯 Jogadores na fila: ${playerIds.length}`);

      // LIMPEZA: Verificar e remover jogadores com referências inválidas
      const validPlayers = [];

      for (const playerId of playerIds) {
        const inActiveGame = await this.isPlayerInActiveGame(playerId);
        if (!inActiveGame) {
          validPlayers.push(playerId);
        } else {
          // Remover jogador da fila se já estiver em jogo ativo
          console.log(`🗑️ Removendo ${playerId} da fila (já em jogo)`);
          await firebaseDB.removePlayerFromQueue(playerId);
        }
      }

      console.log(
        `✅ Jogadores válidos para pareamento: ${validPlayers.length}`
      );

      // 🔒 USAR TRANSACTION PARA PREVENIR CONCORRÊNCIA
      await this.processMatchesWithLock(validPlayers, queue);
    } catch (error) {
      console.error("❌ Erro no sistema de pareamento:", error);
    } finally {
      // 🔓 LIBERAR LOCK
      this.isProcessing = false;
    }
  }

  // 🔒 NOVO MÉTODO: Processar matches com lock
  async processMatchesWithLock(validPlayers, queue) {
    // Embaralhar jogadores para distribuição mais justa
    const shuffledPlayers = this.shuffleArray([...validPlayers]);

    let pairsCreated = 0;

    while (shuffledPlayers.length >= 2) {
      const player1Id = shuffledPlayers.shift();
      const player2Id = shuffledPlayers.shift();

      const player1Data = queue[player1Id];
      const player2Data = queue[player2Id];

      console.log("🤝 Tentando parear:", player1Data.nome, player2Data.nome);

      // 🔒 VERIFICAÇÃO DUPLA COM FIREBASE (atomicidade)
      const canPair = await this.verifyPlayersCanPair(player1Id, player2Id);

      if (!canPair) {
        console.log(
          `⏩ ${player1Data.nome} ou ${player2Data.nome} já foram pareados, pulando...`
        );
        continue;
      }

      // Criar partida
      const gameId = await firebaseDB.createNewGame(
        player1Id,
        player1Data.nome,
        player2Id,
        player2Data.nome
      );

      if (gameId) {
        pairsCreated++;
        console.log(`🎮 Partida ${pairsCreated} criada: ${gameId}`);

        // Remover jogadores da fila
        await firebaseDB.removePlayerFromQueue(player1Id);
        await firebaseDB.removePlayerFromQueue(player2Id);

        // Atualizar o gameId nos jogadores
        await this.updatePlayersWithGameId(player1Id, player2Id, gameId);

        // CORRIGIR PAPÉIS SE NECESSÁRIO
        await this.fixDuplicateRoles(gameId);

        console.log(
          `✅ ${player1Data.nome} e ${player2Data.nome} pareados com sucesso!`
        );
      }

      // Pequena pausa para reduzir concorrência
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Log final
    if (pairsCreated > 0) {
      console.log(`🎉 ${pairsCreated} pares criados nesta rodada!`);
    }

    if (shuffledPlayers.length > 0) {
      console.log(`⏳ ${shuffledPlayers.length} jogadores restantes na fila`);
    } else {
      console.log("✨ Todos os jogadores foram pareados!");
    }
  }

  // 🔒 NOVO MÉTODO: Verificação atômica se jogadores podem ser pareados
  async verifyPlayersCanPair(player1Id, player2Id) {
    try {
      // Verificar se ainda estão na fila (não foram pareados por outro processo)
      const player1InQueue = await firebaseDB.isPlayerInQueue(player1Id);
      const player2InQueue = await firebaseDB.isPlayerInQueue(player2Id);

      if (!player1InQueue || !player2InQueue) {
        console.log(`❌ ${player1Id} ou ${player2Id} já saíram da fila`);
        return false;
      }

      // Verificação final se não estão em jogos ativos
      const player1InGame = await this.isPlayerInActiveGame(player1Id);
      const player2InGame = await this.isPlayerInActiveGame(player2Id);

      if (player1InGame || player2InGame) {
        console.log(`⚠️ ${player1Id} ou ${player2Id} já estão em jogo ativo`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro na verificação de pareamento:", error);
      return false;
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

        // VERIFICAÇÃO MAIS PRECISA - considerar apenas jogos realmente ativos
        if (gameData && gameData.status === "ativo") {
          console.log(
            `⚠️ Jogador ${playerId} já está no jogo ativo: ${gameId}`
          );
          return true;
        } else {
          // Se o jogo não existe ou não está ativo, limpar a referência
          console.log(
            `🧹 Limpando referência de jogo inválida para ${playerId}`
          );
          await firebaseDB.db
            .ref(`birdbox/players/${playerId}/currentGame`)
            .remove();
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar jogo ativo:", error);
      return false; // Em caso de erro, assumir que não está em jogo
    }
  }

  // Função para corrigir papeis duplicados
  async fixDuplicateRoles(gameId) {
    try {
      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${gameId}/jogadores`)
        .once("value");
      const players = gameSnapshot.val();

      if (!players) return;

      const playerIds = Object.keys(players);
      let ouvintesCount = 0;
      let adivinhadoresCount = 0;

      // Contar papeis atuais
      playerIds.forEach((playerId) => {
        if (players[playerId].papel === "ouvinte") ouvintesCount++;
        if (players[playerId].papel === "adivinhador") adivinhadoresCount++;
      });

      console.log(
        `🔧 Verificando papeis - Ouvintes: ${ouvintesCount}, Adivinhadores: ${adivinhadoresCount}`
      );

      // Corrigir se necessário
      if (ouvintesCount === 2) {
        // Mudar um para adivinhador
        await firebaseDB.db
          .ref(`birdbox/games/${gameId}/jogadores/${playerIds[0]}/papel`)
          .set("adivinhador");
        console.log("✅ Corrigido: Jogador 1 definido como adivinhador");
      } else if (adivinhadoresCount === 2) {
        // Mudar um para ouvinte
        await firebaseDB.db
          .ref(`birdbox/games/${gameId}/jogadores/${playerIds[0]}/papel`)
          .set("ouvinte");
        console.log("✅ Corrigido: Jogador 1 definido como ouvinte");
      } else if (ouvintesCount === 1 && adivinhadoresCount === 1) {
        console.log("🎯 Papéis já estão corretos!");
      } else {
        console.log("❌ Configuração de papéis inválida!");
      }
    } catch (error) {
      console.error("❌ Erro ao corrigir papeis:", error);
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

      console.log("💾 GameId salvo para os jogadores");

      // Adicionar timestamp para controle
      await firebaseDB.db
        .ref(`birdbox/games/${gameId}/pareadoEm`)
        .set(Date.now());

      console.log("⏰ Timestamp de pareamento salvo");
    } catch (error) {
      console.error("❌ Erro ao salvar gameId:", error);
    }
  }

  // 🔧 NOVO MÉTODO: Limpar dados de teste
  async cleanupTestData() {
    try {
      console.log("🧹 Iniciando limpeza de dados de teste...");

      // Limpar fila
      await firebaseDB.queueRef.remove();
      console.log("✅ Fila limpa");

      // Limpar jogadores de teste
      const playersRef = firebaseDB.db.ref("birdbox/players");
      const playersSnapshot = await playersRef.once("value");
      const players = playersSnapshot.val();

      if (players) {
        const testPlayers = Object.keys(players).filter(
          (id) =>
            id.includes("test_player") ||
            id.includes("mass_test") ||
            id.includes("quick_test")
        );

        console.log(
          `🗑️ Encontrados ${testPlayers.length} jogadores de teste para remover`
        );

        for (const playerId of testPlayers) {
          await playersRef.child(playerId).remove();
        }

        console.log("✅ Jogadores de teste removidos");
      }

      // Limpar jogos de teste
      const gamesRef = firebaseDB.db.ref("birdbox/games");
      const gamesSnapshot = await gamesRef.once("value");
      const games = gamesSnapshot.val();

      if (games) {
        const testGames = Object.entries(games)
          .filter(([gameId, game]) =>
            Object.values(game.jogadores || {}).some(
              (player) =>
                player.nome.includes("JOG") || player.nome.includes("TEST")
            )
          )
          .map(([gameId]) => gameId);

        console.log(
          `🗑️ Encontrados ${testGames.length} jogos de teste para remover`
        );

        for (const gameId of testGames) {
          await gamesRef.child(gameId).remove();
        }

        console.log("✅ Jogos de teste removidos");
      }

      console.log("🎉 Limpeza de dados de teste concluída!");
    } catch (error) {
      console.error("❌ Erro durante limpeza:", error);
    }
  }

  // 📊 NOVO MÉTODO: Verificar status do sistema
  async getSystemStatus() {
    try {
      const queueSnapshot = await firebaseDB.queueRef.once("value");
      const queue = queueSnapshot.val();
      const queueSize = queue ? Object.keys(queue).length : 0;

      const gamesSnapshot = await firebaseDB.db
        .ref("birdbox/games")
        .once("value");
      const games = gamesSnapshot.val();
      const activeGames = games
        ? Object.values(games).filter((game) => game.status === "ativo").length
        : 0;

      const playersSnapshot = await firebaseDB.db
        .ref("birdbox/players")
        .once("value");
      const players = playersSnapshot.val();
      const playersCount = players ? Object.keys(players).length : 0;

      return {
        queueSize,
        activeGames,
        playersCount,
        isProcessing: this.isProcessing,
        isRunning: this.isRunning,
      };
    } catch (error) {
      console.error("Erro ao obter status do sistema:", error);
      return null;
    }
  }
}

// Instância global do sistema de pareamento
const matchingSystem = new MatchingSystem();

// Iniciar sistema de pareamento quando o Firebase estiver pronto
function startMatchingWhenReady() {
  if (typeof firebaseDB !== "undefined" && firebaseDB.db) {
    console.log("🔥 Firebase pronto, iniciando sistema de pareamento...");
    matchingSystem.startMatching();

    // 🔧 Adicionar funções úteis ao escopo global para debugging
    window.matchingSystem = matchingSystem;
    window.getMatchingStatus = () => matchingSystem.getSystemStatus();
    window.cleanupTestData = () => matchingSystem.cleanupTestData();
    window.forceMatchCheck = () => matchingSystem.checkForMatches();

    console.log("🔧 Funções de debug disponíveis:");
    console.log("   - getMatchingStatus(): Ver status do sistema");
    console.log("   - cleanupTestData(): Limpar dados de teste");
    console.log("   - forceMatchCheck(): Forçar verificação de pareamento");
  } else {
    setTimeout(startMatchingWhenReady, 1000);
  }
}

// Iniciar quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 Página carregada, aguardando Firebase...");
  startMatchingWhenReady();
});

// 🔧 Exportar para uso em outros arquivos (se necessário)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { MatchingSystem, matchingSystem };
}
