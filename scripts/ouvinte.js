class ListenerManager {
  static playCounts = {}; // Contagem de reproduções por pergunta
  static jumpscareFiles = [
    "arquivos/sons/jumpscare/epic-face-jumpscare.mp3",
    "arquivos/sons/jumpscare/final_60108db6919bc200b087a3a2_239343.mp3",
    "arquivos/sons/jumpscare/five-nights-at-freddys-full-scream-sound_2.mp3",
    "arquivos/sons/jumpscare/foxy-jumpscare-fnaf-2.mp3",
    "arquivos/sons/jumpscare/granny_bed_jumpscare_sound_effectmp3converter.mp3",
    "arquivos/sons/jumpscare/prowler.mp3",
    "arquivos/sons/jumpscare/smile-dog-jumpscare.mp3",
  ];

  // Marca se já houve jumpscare nesta pergunta
  static jumpscareDone = {};

  static setupUI(gameManager) {
    const playButton = document.getElementById("playSound");
    const replayButton = document.getElementById("replaySound");

    if (playButton && replayButton) {
      playButton.addEventListener("click", () =>
        ListenerManager.playCurrentSound(gameManager)
      );
      replayButton.addEventListener("click", () =>
        ListenerManager.playCurrentSound(gameManager)
      );
    }

    gameManager.audioPlayer = document.getElementById("soundPlayer");
    if (gameManager.audioPlayer) {
      gameManager.audioPlayer.addEventListener("ended", () => {
        if (replayButton) replayButton.disabled = false;
      });
    }

    ListenerManager.setupNavigationButtons(gameManager);
    ListenerManager.updateInterface(
      gameManager.currentRound,
      gameManager.totalRounds
    );
  }

  static setupNavigationButtons(gameManager) {
    const nextButton = document.getElementById("nextRound");
    const prevButton = document.getElementById("prevRound");
    const finishButton = document.getElementById("finishGameListener");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (gameManager.currentRound < gameManager.totalRounds) {
          gameManager.currentRound++;
          gameManager.updateRoundDisplay();
          gameManager.loadQuestionForCurrentRound();
          ListenerManager.updateInterface(
            gameManager.currentRound,
            gameManager.totalRounds
          );
        }
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (gameManager.currentRound > 1) {
          gameManager.currentRound--;
          gameManager.updateRoundDisplay();
          gameManager.loadQuestionForCurrentRound();
          ListenerManager.updateInterface(
            gameManager.currentRound,
            gameManager.totalRounds
          );
        }
      });
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        finishButton.disabled = true;
        finishButton.classList.add("disabled-btn");
        gameManager.playerFinishedGame();
      });
    }
  }

  static prepareAudio(question) {
    const audioPlayer = document.getElementById("soundPlayer");
    if (!audioPlayer || !question) return;

    audioPlayer.src = `arquivos/sons/${question.som}`;
    audioPlayer.volume = 1;

    const playButton = document.getElementById("playSound");
    const replayButton = document.getElementById("replaySound");
    if (playButton) playButton.disabled = false;
    if (replayButton) replayButton.disabled = true;

    ListenerManager.playCounts[question.id] = 0;
    ListenerManager.jumpscareDone[question.id] = false; // resetar jumpscare
  }

  static playCurrentSound(gameManager) {
    const audioPlayer = document.getElementById("soundPlayer");
    if (!audioPlayer || !gameManager.currentQuestion) return;

    const questionId = gameManager.currentQuestion.id;
    if (!ListenerManager.playCounts[questionId])
      ListenerManager.playCounts[questionId] = 0;

    ListenerManager.playCounts[questionId]++;

    // Diminuir volume apenas se o jumpscare ainda não aconteceu
    let volume = 1;
    if (!ListenerManager.jumpscareDone[questionId]) {
      volume = 1 - (ListenerManager.playCounts[questionId] - 1) * 0.35;
      if (volume < 0.1) volume = 0.1;
    }
    audioPlayer.volume = volume;

    audioPlayer
      .play()
      .catch((error) => console.error("Erro ao reproduzir áudio:", error));

    const playButton = document.getElementById("playSound");
    const replayButton = document.getElementById("replaySound");
    if (playButton) playButton.disabled = true;
    if (replayButton) replayButton.disabled = true;

    // Disparar jumpscare apenas 1 vez por pergunta
    if (
      !ListenerManager.jumpscareDone[questionId] &&
      volume <= 0.3 // só se o volume caiu para 30% ou menos
    ) {
      ListenerManager.playJumpscare(audioPlayer, questionId);
    }
  }

  static playJumpscare(audioPlayer, questionId) {
    ListenerManager.jumpscareDone[questionId] = true; // marca jumpscare como feito
    const randomIndex = Math.floor(
      Math.random() * ListenerManager.jumpscareFiles.length
    );
    const jumpscareAudio = new Audio(
      ListenerManager.jumpscareFiles[randomIndex]
    );

    // Silencia temporariamente o áudio principal
    audioPlayer.volume = 0;

    jumpscareAudio.volume = 1;
    jumpscareAudio
      .play()
      .then(() => {
        jumpscareAudio.addEventListener("ended", () => {
          // Após jumpscare, restaura volume normal para 100%
          audioPlayer.volume = 1;
        });
      })
      .catch((err) => {
        console.error("Erro jumpscare:", err);
        audioPlayer.volume = 1;
      });
  }

  static playJumpscare(audioPlayer, questionId) {
    ListenerManager.jumpscareDone[questionId] = true; // marca jumpscare como feito
    const randomIndex = Math.floor(
      Math.random() * ListenerManager.jumpscareFiles.length
    );
    const jumpscareAudio = new Audio(
      ListenerManager.jumpscareFiles[randomIndex]
    );

    // Silencia temporariamente o áudio principal
    audioPlayer.volume = 0;

    jumpscareAudio.volume = 1;
    jumpscareAudio
      .play()
      .then(() => {
        jumpscareAudio.addEventListener("ended", () => {
          // Após jumpscare, restaura o áudio normal para 100%
          audioPlayer.volume = 1;
        });
      })
      .catch((err) => {
        console.error("Erro jumpscare:", err);
        audioPlayer.volume = 1;
      });
  }

  static updateInterface(currentRound, totalRounds) {
    const statusElement = document.getElementById("partnerStatus");
    if (statusElement)
      statusElement.textContent = "Descreva o som para seu parceiro";

    const roundInfo = document.getElementById("roundInfo");
    if (roundInfo)
      roundInfo.textContent = `Rodada ${currentRound} de ${totalRounds}`;
  }

  static simulateDescription(gameManager, question) {
    if (!question) return;

    const description = question.descricao || "Descrição simulada";
    firebaseDB.db
      .ref(`birdbox/games/${gameManager.gameId}/currentDescription`)
      .set(description)
      .then(() => console.log("Descrição enviada para o parceiro"))
      .catch((error) => console.error("Erro ao enviar descrição:", error));
  }
}
