window.addEventListener("DOMContentLoaded", async () => {
  const rankingBody = document.getElementById("rankingBody");
  const backMenu = document.getElementById("backMenu");

  backMenu.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  try {
    const snapshot = await firebaseDB.gamesRef.once("value");
    const games = snapshot.val();

    if (!games) {
      rankingBody.innerHTML =
        "<tr><td colspan='4'>Nenhuma partida finalizada ainda.</td></tr>";
      return;
    }

    let scores = [];

    Object.values(games).forEach((game) => {
      if (game.status === "finalizado" && game.jogadores) {
        const jogadores = Object.values(game.jogadores);

        if (jogadores.length === 2) {
          const nomeDupla = `${jogadores[0].nome} + ${jogadores[1].nome}`;
          const pontuacaoDupla =
            (jogadores[0].pontuacao || 0) + (jogadores[1].pontuacao || 0);

          scores.push({
            dupla: nomeDupla,
            pontuacao: pontuacaoDupla,
            data: game.finalizadoEm
              ? new Date(game.finalizadoEm).toLocaleDateString("pt-BR")
              : "-",
          });
        }
      }
    });

    // Ordenar por pontuação decrescente
    scores.sort((a, b) => b.pontuacao - a.pontuacao);

    // Pegar só top 10
    scores = scores.slice(0, 10);

    rankingBody.innerHTML = "";

    scores.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}º</td>
        <td>${entry.dupla}</td>
        <td>${entry.pontuacao}</td>
        <td>${entry.data}</td>
      `;
      rankingBody.appendChild(row);
    });

    if (scores.length === 0) {
      rankingBody.innerHTML =
        "<tr><td colspan='4'>Nenhuma dupla registrada.</td></tr>";
    }
  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    rankingBody.innerHTML =
      "<tr><td colspan='4'>Erro ao carregar ranking.</td></tr>";
  }
});
