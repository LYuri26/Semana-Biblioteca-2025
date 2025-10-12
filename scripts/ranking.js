// ranking.js - Gerenciador do Ranking
class RankingManager {
  constructor() {
    this.rankingData = [];
    this.isLoading = false;
  }

  async loadRanking() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      console.log("📊 Carregando ranking...");

      const rankingSnapshot = await firebaseDB.db
        .ref("birdbox/ranking")
        .orderByChild("pontuacao")
        .limitToLast(50) // Limitar para performance
        .once("value");

      const rankingData = rankingSnapshot.val();
      this.rankingData = this.processRankingData(rankingData);
      this.displayRanking();

      console.log(`✅ Ranking carregado: ${this.rankingData.length} jogadores`);
    } catch (error) {
      console.error("❌ Erro ao carregar ranking:", error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  processRankingData(rankingData) {
    if (!rankingData) return [];

    const processedData = Object.entries(rankingData).map(([id, data]) => ({
      id,
      nome: data.nome || "Jogador Anônimo",
      pontuacao: data.pontuacao || 0,
      data: data.data || Date.now(),
      jogos: data.jogos || 1,
    }));

    // Ordenar por pontuação (decrescente)
    return processedData.sort((a, b) => b.pontuacao - a.pontuacao);
  }

  displayRanking() {
    const rankingBody = document.getElementById("rankingBody");

    if (this.rankingData.length === 0) {
      rankingBody.innerHTML = this.getEmptyStateHTML();
      return;
    }

    rankingBody.innerHTML = this.rankingData
      .map(
        (player, index) => `
            <tr class="ranking-row">
                <td class="text-center fw-bold position-cell">${index + 1}</td>
                <td class="player-name">
                    <div class="d-flex align-items-center">
                        <div class="player-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style="width: 40px; height: 40px; font-size: 0.9rem;">
                            ${player.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-semibold">${this.escapeHtml(
                              player.nome
                            )}</div>
                            <small class="text-muted">${
                              player.jogos
                            } jogo(s)</small>
                        </div>
                    </div>
                </td>
                <td class="text-center">
                    <span class="pontuacao-badge badge bg-primary rounded-pill px-3 py-2">
                        ${player.pontuacao.toLocaleString("pt-BR")} pts
                    </span>
                </td>
                <td class="text-center text-muted">
                    ${this.formatDate(player.data)}
                </td>
            </tr>
        `
      )
      .join("");
  }

  getEmptyStateHTML() {
    return `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="bi bi-trophy"></i>
                    <h4 class="mt-3 mb-2">Nenhum jogador no ranking</h4>
                    <p class="mb-0">Seja o primeiro a jogar e apareça aqui!</p>
                </td>
            </tr>
        `;
  }

  showLoadingState() {
    const rankingBody = document.getElementById("rankingBody");
    rankingBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Carregando ranking...</span>
                    </div>
                    <p class="mt-3 mb-0 text-light">Carregando ranking...</p>
                </td>
            </tr>
        `;
  }

  showErrorState() {
    const rankingBody = document.getElementById("rankingBody");
    rankingBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h4 class="mt-3 mb-2 text-warning">Erro ao carregar</h4>
                    <p class="mb-3 text-light">Não foi possível carregar o ranking.</p>
                    <button class="btn btn-outline-primary" onclick="rankingManager.loadRanking()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Tentar Novamente
                    </button>
                </td>
            </tr>
        `;
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hoje";
    if (diffDays === 2) return "Ontem";
    if (diffDays <= 7) return `Há ${diffDays - 1} dias`;

    return date.toLocaleDateString("pt-BR");
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  setupEventListeners() {
    const backButton = document.getElementById("backMenu");
    if (backButton) {
      backButton.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }

    // Recarregar ranking quando a página ganha foco
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.loadRanking();
      }
    });
  }

  init() {
    this.setupEventListeners();
    this.loadRanking();

    // Atualizar ranking a cada 30 segundos
    setInterval(() => this.loadRanking(), 30000);
  }
}

// Inicialização
const rankingManager = new RankingManager();

document.addEventListener("DOMContentLoaded", function () {
  // Verificar se Firebase está disponível
  if (typeof firebaseDB === "undefined") {
    console.error("❌ Firebase não inicializado");
    document.getElementById("rankingBody").innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5 text-danger">
                    Erro: Firebase não configurado
                </td>
            </tr>
        `;
    return;
  }

  rankingManager.init();
});

// Adicionar ao escopo global para debugging
if (typeof window !== "undefined") {
  window.rankingManager = rankingManager;
}
