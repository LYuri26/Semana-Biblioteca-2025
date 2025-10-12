// Script para criar partículas de fundo e funcionalidades da página inicial
document.addEventListener("DOMContentLoaded", function () {
  initializeParticles();
  initializeEventListeners();
  initializeFormValidation();
});

function initializeParticles() {
  const particlesContainer = document.getElementById("particles");
  const particleCount = 25;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    // Propriedades aleatórias para as partículas
    const size = Math.random() * 8 + 4;
    const posX = Math.random() * 100;
    const delay = Math.random() * 20;
    const duration = Math.random() * 10 + 20;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;

    particlesContainer.appendChild(particle);
  }
}

function initializeEventListeners() {
  // Abrir modal de regras
  document.getElementById("openRules").addEventListener("click", () => {
    const rulesModal = new bootstrap.Modal(
      document.getElementById("rulesModal")
    );
    rulesModal.show();
  });

  // Abrir ranking
  document.getElementById("openRanking").addEventListener("click", () => {
    showLoadingState(document.getElementById("openRanking"));
    setTimeout(() => {
      window.location.href = "ranking.html";
    }, 800);
  });

  // Foco automático no campo de nome
  const playerNameInput = document.getElementById("playerName");
  if (playerNameInput) {
    setTimeout(() => {
      playerNameInput.focus();
    }, 1000);
  }
}

function initializeFormValidation() {
  const form = document.getElementById("playerForm");
  const playerNameInput = document.getElementById("playerName");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleFormSubmission();
  });

  // Validação em tempo real - CORREÇÃO: aspas duplas consistentes
  playerNameInput.addEventListener("input", function () {
    validatePlayerName(this.value);
  });

  // Prevenir caracteres especiais
  playerNameInput.addEventListener("keypress", function (e) {
    const charCode = e.charCode;
    // Permitir apenas letras, números e espaços
    if (
      !(
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122) ||
        (charCode >= 48 && charCode <= 57) ||
        charCode === 32
      )
    ) {
      e.preventDefault();
    }
  });
}

function validatePlayerName(name) {
  const trimmedName = name.trim();
  const submitButton = document.getElementById("enterGame");

  if (trimmedName.length >= 2 && trimmedName.length <= 20) {
    submitButton.disabled = false;
    return true;
  } else {
    submitButton.disabled = true;
    return false;
  }
}

function handleFormSubmission() {
  const playerName = document.getElementById("playerName").value.trim();
  const submitButton = document.getElementById("enterGame");

  if (!validatePlayerName(playerName)) {
    showMessage("Por favor, digite um nome válido (2-20 caracteres)", "error");
    return;
  }

  showLoadingState(submitButton);

  // Simular processamento (substituir pela lógica real)
  setTimeout(() => {
    if (savePlayerName(playerName)) {
      showMessage(`Bem-vindo, ${playerName}! Conectando ao jogo...`, "success");
      setTimeout(() => {
        window.location.href = "game.html";
      }, 1500);
    } else {
      showMessage("Erro ao salvar nome. Tente novamente.", "error");
      submitButton.classList.remove("btn-loading");
      submitButton.disabled = false;
    }
  }, 2000);
}

function savePlayerName(name) {
  try {
    // Salvar no localStorage temporariamente
    localStorage.setItem("playerName", name);
    localStorage.setItem("playerJoinTime", new Date().toISOString());
    return true;
  } catch (error) {
    console.error("Erro ao salvar nome:", error);
    return false;
  }
}

function showLoadingState(button) {
  button.classList.add("btn-loading");
  button.disabled = true;
}

function showMessage(message, type = "info") {
  // Remover mensagens anteriores
  const existingMessage = document.querySelector(".alert-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `alert-message alert alert-${
    type === "error" ? "danger" : type
  } position-fixed`;
  messageDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => messageDiv.remove(), 300);
    }
  }, 5000);
}

// Adicionar estilos para animações das mensagens
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .alert-message {
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(style);

// Prevenir F5 e Ctrl+R
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R")) {
    e.preventDefault();
    showMessage("Use os botões de navegação do jogo", "info");
  }
});

// Detectar saída da página
window.addEventListener("beforeunload", function (e) {
  // Opcional: Salvar estado do jogador
  const playerName = document.getElementById("playerName").value;
  if (playerName.trim()) {
    localStorage.setItem("playerName", playerName.trim());
  }
});
