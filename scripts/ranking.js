// ranking.js - VERSÃO COMPLETAMENTE CORRIGIDA

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
      console.log("📊 Carregando ranking de DUPLAS...");

      // 🎯 BUSCAR TODAS AS DUPLAS DO RANKING
      const rankingSnapshot = await firebaseDB.db
        .ref("birdbox/ranking")
        .once("value");

      const rankingData = rankingSnapshot.val();
      console.log("📦 Dados brutos do ranking:", rankingData);

      this.rankingData = this.processRankingData(rankingData);
      this.displayRanking();

      console.log(`✅ Ranking carregado: ${this.rankingData.length} duplas`);
    } catch (error) {
      console.error("❌ Erro ao carregar ranking:", error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  processRankingData(rankingData) {
    if (!rankingData) {
      console.log("📭 Nenhum dado no ranking");
      return [];
    }

    const processedData = [];

    Object.entries(rankingData).forEach(([id, data]) => {
      // 🎯 FILTRAR APENAS ENTIDADES VÁLIDAS (não metadados)
      if (id.startsWith("_")) {
        return; // Ignorar metadados como _initialized, _createdAt, etc.
      }

      // 🎯 VERIFICAR SE É UMA DUPLA VÁLIDA
      if (
        data &&
        typeof data === "object" &&
        data.nome &&
        data.pontuacao !== undefined
      ) {
        processedData.push({
          id,
          nome: data.nome,
          pontuacao: parseInt(data.pontuacao) || 0,
          data: data.data || Date.now(),
          jogos: data.jogos || 1,
          gameId: data.gameId,
          tipo: data.tipo || "dupla",
        });
      }
    });

    console.log(`🎯 ${processedData.length} duplas válidas encontradas`);

    // Ordenar por pontuação (decrescente) e pegar top 20
    return processedData.sort((a, b) => b.pontuacao - a.pontuacao).slice(0, 20);
  }

  displayRanking() {
    const rankingBody = document.getElementById("rankingBody");

    if (this.rankingData.length === 0) {
      rankingBody.innerHTML = this.getEmptyStateHTML();
      return;
    }

    rankingBody.innerHTML = this.rankingData
      .map(
        (dupla, index) => `
        <tr class="ranking-row">
          <td class="text-center fw-bold position-cell">
            <div class="position-badge ${
              index < 3 ? "top-" + (index + 1) : ""
            }">
              ${index + 1}
            </div>
          </td>
          <td class="player-name">
            <div class="d-flex align-items-center">
              <div class="dupla-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                   style="width: 40px; height: 40px; font-size: 0.9rem;">
                👥
              </div>
              <div>
                <div class="fw-semibold">${this.escapeHtml(dupla.nome)}</div>
                <small class="text-muted">Dupla</small>
              </div>
            </div>
          </td>
          <td class="text-center">
            <span class="pontuacao-badge badge bg-success rounded-pill px-3 py-2">
              ${dupla.pontuacao.toLocaleString("pt-BR")} pts
            </span>
          </td>
        </tr>
      `
      )
      .join("");

    // Adicionar estilos para as primeiras posições
    this.addRankingStyles();
  }

  addRankingStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .position-badge {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        font-weight: bold;
      }
      .top-1 {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #000;
      }
      .top-2 {
        background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
        color: #000;
      }
      .top-3 {
        background: linear-gradient(135deg, #CD7F32, #A66A28);
        color: #000;
      }
      .dupla-avatar {
        background: linear-gradient(135deg, #667eea, #764ba2) !important;
      }
    `;
    document.head.appendChild(style);
  }

  getEmptyStateHTML() {
    return `
      <tr>
        <td colspan="3" class="text-center py-5">
          <i class="bi bi-trophy" style="font-size: 3rem; color: #6c757d;"></i>
          <h4 class="mt-3 mb-2 text-light">Ranking Vazio</h4>
          <p class="mb-0 text-muted">Nenhuma dupla registrada ainda</p>
          <small class="text-muted">Jogue uma partida para aparecer aqui!</small>
        </td>
      </tr>
    `;
  }

  showLoadingState() {
    const rankingBody = document.getElementById("rankingBody");
    rankingBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Carregando ranking...</span>
          </div>
          <p class="mt-3 mb-0 text-light">Carregando ranking de duplas...</p>
        </td>
      </tr>
    `;
  }

  showErrorState() {
    const rankingBody = document.getElementById("rankingBody");
    rankingBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-5">
          <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
          <h4 class="mt-3 mb-2 text-light">Erro ao carregar</h4>
          <p class="mb-0 text-muted">Não foi possível carregar o ranking</p>
          <button class="btn btn-primary mt-3" onclick="rankingManager.loadRanking()">
            Tentar Novamente
          </button>
        </td>
      </tr>
    `;
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
        <td colspan="3" class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle"></i>
          <h4 class="mt-3 mb-2">Erro de Configuração</h4>
          <p class="mb-0">Firebase não configurado corretamente</p>
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
