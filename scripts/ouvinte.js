// Gerenciador do ouvinte
class ListenerManager {
  // Configurar UI do ouvinte
  static setupUI(gameManager) {
    const playButton = document.getElementById("playSound");
    const replayButton = document.getElementById("replaySound");

    if (playButton && replayButton) {
      playButton.addEventListener("click", () =>
        ListenerManager.playCurrentSound()
      );
      replayButton.addEventListener("click", () =>
        ListenerManager.playCurrentSound()
      );
    }

    gameManager.audioPlayer = document.getElementById("soundPlayer");
    if (gameManager.audioPlayer) {
      gameManager.audioPlayer.addEventListener("ended", () => {
        if (replayButton) replayButton.disabled = false;
      });
    }

    // Configurar botões de navegação
    ListenerManager.setupNavigationButtons(gameManager);

    ListenerManager.updateInterface(1, gameManager.totalRounds);
  }

  // Configurar botões de navegação
  static setupNavigationButtons(gameManager) {
    const nextButton = document.getElementById("nextRound");
    const prevButton = document.getElementById("prevRound");
    const finishButton = document.getElementById("finishGame");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        gameManager.advanceToNextRound();
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (gameManager.currentRound > 1) {
          gameManager.currentRound--;
          gameManager.updateRoundDisplay();
          gameManager.loadQuestionForCurrentRound();
        }
      });
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        gameManager.playerFinishedGame();
      });
    }
  }

  // Preparar áudio
  static prepareAudio(question) {
    const audioPlayer = document.getElementById("soundPlayer");
    if (audioPlayer && question) {
      const soundPath = `../arquivos/sons/${question.som}`;
      audioPlayer.src = soundPath;

      const playButton = document.getElementById("playSound");
      const replayButton = document.getElementById("replaySound");

      if (playButton) playButton.disabled = false;
      if (replayButton) replayButton.disabled = true;
    }
  }

  // Reproduzir som atual
  static playCurrentSound() {
    const audioPlayer = document.getElementById("soundPlayer");
    if (audioPlayer) {
      audioPlayer.play().catch((error) => {
        console.error("Erro ao reproduzir áudio:", error);
        alert("Erro ao reproduzir o som. Verifique se o arquivo existe.");
      });

      const playButton = document.getElementById("playSound");
      if (playButton) playButton.disabled = true;

      const replayButton = document.getElementById("replaySound");
      if (replayButton) replayButton.disabled = true;
    }
  }

  // Atualizar interface
  static updateInterface(currentRound, totalRounds) {
    const statusElement = document.getElementById("partnerStatus");
    if (statusElement) {
      statusElement.textContent = "Descreva o som para seu parceiro";
    }

    const roundInfo = document.getElementById("roundInfo");
    if (roundInfo) {
      roundInfo.textContent = `Rodada ${currentRound} de ${totalRounds}`;
    }
  }

  // Simular descrição (para teste)
  static simulateDescription(question) {
    if (question) {
      const description = question.descricao;
      firebaseDB.db
        .ref(`birdbox/games/${gameManager.gameId}/currentDescription`)
        .set(description)
        .then(() => {
          console.log("Descrição enviada para o parceiro");
        })
        .catch((error) => {
          console.error("Erro ao enviar descrição:", error);
        });
    }
  }
}
