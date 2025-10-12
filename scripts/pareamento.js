// pareamento.js - VERSÃO CORRIGIDA (LIMPEZA DA FILA GARANTIDA)

class MatchingSystem {
  constructor() {
    this.checkInterval = null;
    this.checkDelay = 3000;
    this.isRunning = false;
    this.isProcessing = false;
    this.processingLock = false;
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
    if (this.isProcessing || this.processingLock) return;

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

      const player1 = orderedQueue[0];
      const player2 = orderedQueue[1];

      console.log(`🤝 TENTANDO PAR: ${player1.nome} + ${player2.nome}`);

      const canPair = await this.verifyPlayersCanPair(player1.id, player2.id);

      if (canPair) {
        console.log(`✅ PAR APROVADO, criando jogo com perguntas únicas...`);
        const gameCreated = await this.createNewGameWithUniqueQuestions(
          player1,
          player2
        );

        if (gameCreated) {
          console.log(`🎉 JOGO CRIADO: ${player1.nome} + ${player2.nome}`);

          // 🎯 LIMPEZA GARANTIDA DA FILA - MESMO EM CASO DE ERRO PARCIAL
          await this.guaranteedQueueCleanup(player1.id, player2.id);

          const newQueueSize = orderedQueue.length - 2;
          console.log(`📊 FILA ATUAL: ${newQueueSize} jogador(es) restante(s)`);
        } else {
          console.log(
            `❌ FALHA ao criar jogo para: ${player1.nome} + ${player2.nome}`
          );
          // 🎯 LIMPEZA EM CASO DE FALHA
          await this.guaranteedQueueCleanup(player1.id, player2.id);
        }
      }
    } catch (error) {
      console.error("❌ ERRO NO PAREAMENTO:", error);
    } finally {
      this.isProcessing = false;
      setTimeout(() => {
        this.processingLock = false;
      }, 1000);
    }
  }

  // 🎯 MÉTODO NOVO: LIMPEZA GARANTIDA DA FILA
  async guaranteedQueueCleanup(player1Id, player2Id) {
    console.log("🧹 Executando limpeza garantida da fila...");

    const cleanupPromises = [];

    // Tentar remover player1
    cleanupPromises.push(
      firebaseDB
        .removePlayerFromQueue(player1Id)
        .then(() => console.log(`✅ ${player1Id} removido da fila`))
        .catch((error) =>
          console.error(`❌ Erro ao remover ${player1Id}:`, error)
        )
    );

    // Tentar remover player2
    cleanupPromises.push(
      firebaseDB
        .removePlayerFromQueue(player2Id)
        .then(() => console.log(`✅ ${player2Id} removido da fila`))
        .catch((error) =>
          console.error(`❌ Erro ao remover ${player2Id}:`, error)
        )
    );

    // Aguardar todas as operações de limpeza
    await Promise.allSettled(cleanupPromises);
    console.log("✅ Limpeza da fila concluída");
  }

  // 🎯 MÉTODO CORRIGIDO: Criar jogo com perguntas únicas
  async createNewGameWithUniqueQuestions(player1, player2) {
    let gameCreated = false;

    try {
      console.log(`🎲 Gerando perguntas únicas para nova dupla...`);

      // 🎯 CARREGAR PERGUNTAS DO JSON DIRETAMENTE
      const response = await fetch("arquivos/dados/perguntas.json");
      if (!response.ok) throw new Error("Erro ao carregar perguntas");

      const data = await response.json();
      const allQuestions = data.perguntas;
      const wrongOptionsPool = data.opcoes_erradas || [];
      const totalRounds = data.configuracoes?.total_rodadas || 4;

      if (allQuestions.length < totalRounds) {
        console.warn(
          `⚠️ Poucas perguntas disponíveis: ${allQuestions.length}, necessário: ${totalRounds}`
        );
      }

      // 🎯 EMBARALHAR E SELECIONAR PERGUNTAS ÚNICAS
      const shuffledQuestions = this.shuffleArray([...allQuestions]);
      const selectedQuestions = shuffledQuestions.slice(0, totalRounds);

      // 🎯 PREPARAR PERGUNTAS COM ESTRUTURA CORRETA
      const preparedQuestions = selectedQuestions.map((question, index) => {
        const optionsData = this.prepareQuestionOptions(
          question,
          wrongOptionsPool
        );
        return {
          id: question.id || `q_${Date.now()}_${index}`,
          pergunta:
            question.pergunta ||
            `Identifique o som: ${
              question.opcoes?.[question.resposta_correta] || "Som desconhecido"
            }`,
          som: question.som || question.audio,
          opcoes: question.opcoes || [],
          resposta_correta:
            question.resposta_correta !== undefined
              ? question.resposta_correta
              : 0,
          dica: question.dica || "",
          imagem: question.imagem || "",
          displayOptions: optionsData.options,
          correctDisplayIndex: optionsData.correctIndex,
        };
      });

      console.log(`✅ ${preparedQuestions.length} perguntas únicas geradas`);

      // 🎯 CRIAR O JOGO COM AS PERGUNTAS PERSONALIZADAS
      const gameId = `game_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const gameData = {
        id: gameId,
        jogadores: {
          [player1.id]: {
            nome: player1.nome,
            papel: player1.papel,
            pontuacao: 0,
            status: "conectado",
            ready: false,
            finalizado: false,
            respostas: {},
            tempoRespostas: {},
          },
          [player2.id]: {
            nome: player2.nome,
            papel: player2.papel,
            pontuacao: 0,
            status: "conectado",
            ready: false,
            finalizado: false,
            respostas: {},
            tempoRespostas: {},
          },
        },
        perguntas: preparedQuestions,
        currentQuestionIndex: 0,
        status: "ativo",
        criadoEm: Date.now(),
        duracao: 0,
        finalizadoEm: null,
        rodadaAtual: 1,
        tempoInicioRodada: null,
        historicoRespostas: {},
      };

      // 🎯 SALVAR NO FIREBASE
      await firebaseDB.db.ref(`birdbox/games/${gameId}`).set(gameData);

      // 🎯 ATUALIZAR REFERÊNCIA DOS JOGADORES
      await firebaseDB.db
        .ref(`birdbox/players/${player1.id}/currentGame`)
        .set(gameId);
      await firebaseDB.db
        .ref(`birdbox/players/${player2.id}/currentGame`)
        .set(gameId);

      console.log(
        `🎉 JOGO CRIADO: ${gameId} com ${preparedQuestions.length} perguntas únicas`
      );

      gameCreated = true;
      return gameCreated;
    } catch (error) {
      console.error("❌ ERRO ao criar jogo com perguntas únicas:", error);

      // 🎯 FALLBACK: criar jogo sem perguntas específicas
      console.log("🔄 Tentando criar jogo com método tradicional...");
      try {
        const gameId = await firebaseDB.createNewGame(
          player1.id,
          player1,
          player2.id,
          player2
        );
        gameCreated = true;
        return gameCreated;
      } catch (fallbackError) {
        console.error("❌ ERRO no fallback também:", fallbackError);
        gameCreated = false;
        return gameCreated;
      }
    }
  }

  // 🎯 MÉTODO: Preparar opções de perguntas (mantido igual)
  prepareQuestionOptions(question, wrongOptionsPool) {
    try {
      const options = [];
      const correctAnswer =
        question.opcoes?.[question.resposta_correta] || "Resposta Correta";
      options.push(correctAnswer);

      const totalOptions = 4;

      const filteredWrongOptions = wrongOptionsPool.filter(
        (opt) =>
          opt !== correctAnswer &&
          !question.opcoes?.includes(opt) &&
          opt &&
          opt.trim() !== ""
      );

      let availableWrongOptions = [...filteredWrongOptions];
      if (availableWrongOptions.length < totalOptions - 1) {
        const otherQuestionOptions = (question.opcoes || []).filter(
          (opt) => opt !== correctAnswer
        );
        availableWrongOptions = [
          ...availableWrongOptions,
          ...otherQuestionOptions,
        ];
      }

      if (availableWrongOptions.length < totalOptions - 1) {
        const defaultOptions = ["Opção A", "Opção B", "Opção C", "Opção D"];
        availableWrongOptions = [...availableWrongOptions, ...defaultOptions];
      }

      const shuffledWrongOptions = this.shuffleArray(availableWrongOptions);
      const neededWrongOptions = shuffledWrongOptions.slice(
        0,
        totalOptions - 1
      );
      options.push(...neededWrongOptions);

      const shuffledOptions = this.shuffleArray(options);

      const correctIndex = shuffledOptions.findIndex(
        (opt) => opt === correctAnswer
      );

      const finalCorrectIndex = correctIndex !== -1 ? correctIndex : 0;

      return {
        options: shuffledOptions,
        correctIndex: finalCorrectIndex,
      };
    } catch (error) {
      console.error("❌ Erro ao preparar opções:", error);
      return {
        options: ["Opção A", "Opção B", "Opção C", "Opção D"],
        correctIndex: 0,
      };
    }
  }

  // 🎯 MÉTODO: Embaralhar array (mantido igual)
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  async verifyPlayersCanPair(player1Id, player2Id) {
    try {
      console.log(`🔍 VERIFICAÇÃO DE PAR: ${player1Id} + ${player2Id}`);

      // Verificação básica: ambos na fila
      const player1InQueue = await firebaseDB.isPlayerInQueue(player1Id);
      const player2InQueue = await firebaseDB.isPlayerInQueue(player2Id);

      if (!player1InQueue || !player2InQueue) {
        console.log("❌ Um ou ambos os jogadores saíram da fila");

        // 🎯 LIMPEZA IMEDIATA SE ALGUÉM SAIU
        if (player1InQueue) await firebaseDB.removePlayerFromQueue(player1Id);
        if (player2InQueue) await firebaseDB.removePlayerFromQueue(player2Id);

        return false;
      }

      // Verificação extra: não estão em jogo ativo
      const player1InGame = await firebaseDB.isPlayerInActiveGame(player1Id);
      const player2InGame = await firebaseDB.isPlayerInActiveGame(player2Id);

      if (player1InGame || player2InGame) {
        console.log("❌ Um ou ambos os jogadores já estão em jogo");

        // 🎯 LIMPEZA IMEDIATA
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

  // 🎯 MÉTODO: Status do sistema
  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      processingLock: this.processingLock,
      checkDelay: this.checkDelay,
    };
  }

  // 🎯 MÉTODO: Atualizar configurações
  updateConfig(newConfig) {
    if (newConfig.checkDelay && newConfig.checkDelay >= 1000) {
      this.checkDelay = newConfig.checkDelay;
      console.log(
        `⚙️ Delay de verificação ajustado para: ${this.checkDelay}ms`
      );

      if (this.isRunning) {
        this.stopMatching();
        this.startMatching();
      }
    }
  }
}

// 🎯 FUNÇÃO DE INICIALIZAÇÃO SEGURA
function startMatchingWhenReady() {
  if (typeof firebaseDB !== "undefined" && firebaseDB.db) {
    console.log("🔥 FIREBASE PRONTO, iniciando pareamento em 5 segundos...");
    setTimeout(() => {
      matchingSystem.startMatching();
    }, 5000);
  } else {
    console.log("⏳ Aguardando Firebase ficar pronto...");
    setTimeout(startMatchingWhenReady, 1000);
  }
}

// 🎯 FUNÇÕES GLOBAIS PARA CONTROLE
function stopMatchingSystem() {
  matchingSystem.stopMatching();
}

function restartMatchingSystem() {
  matchingSystem.stopMatching();
  setTimeout(() => {
    matchingSystem.startMatching();
  }, 1000);
}

// 🎯 INSTÂNCIA GLOBAL
const matchingSystem = new MatchingSystem();

// 🎯 ADICIONAR AO ESCOPO GLOBAL
if (typeof window !== "undefined") {
  window.matchingSystem = matchingSystem;
  window.stopMatchingSystem = stopMatchingSystem;
  window.restartMatchingSystem = restartMatchingSystem;
}

// 🎯 INICIAR AUTOMATICAMENTE
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMatchingWhenReady);
} else {
  startMatchingWhenReady();
}

// 🎯 EXPORT PARA MÓDULOS
if (typeof module !== "undefined" && module.exports) {
  module.exports = { MatchingSystem, matchingSystem };
}
