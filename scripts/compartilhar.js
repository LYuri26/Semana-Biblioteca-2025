// compartilhar.js - Sistema Avançado de Compartilhamento MOBILE - CORRIGIDO

class ShareManager {
  constructor() {
    this.currentTeam = null;
    this.shareImageUrl = null;
    this.shareText = "";
    this.isMobile = this.detectMobile();
    this.init();
  }

  init() {
    console.log("🚀 Sistema de compartilhamento mobile inicializado");
  }

  // Detectar se é dispositivo móvel
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Detectar se é iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Detectar se é Android
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  // Abrir modal de compartilhamento para uma dupla específica
  async openShareModal(teamIndex) {
    try {
      const rankingData = window.rankingManager?.rankingData;
      if (!rankingData || !rankingData[teamIndex]) {
        console.error("❌ Dados da dupla não encontrados");
        return;
      }

      this.currentTeam = rankingData[teamIndex];
      const position = teamIndex + 1;

      // Gerar texto para compartilhamento
      this.shareText = this.generateShareText(this.currentTeam, position);

      // Gerar imagem para compartilhamento
      await this.generateShareImage(this.currentTeam, position);

      // Mostrar modal
      this.showModal();
    } catch (error) {
      console.error("❌ Erro ao abrir modal de compartilhamento:", error);
      this.showError("Erro ao preparar compartilhamento");
    }
  }

  // Gerar texto para compartilhamento
  generateShareText(team, position) {
    return `🏆 Nossa dupla "${team.nome}" está em ${position}º lugar no BirdBox com ${team.pontuacao} pontos! 

🎮 Venha jogar conosco na Biblioteca do SENAI Uberaba!
📍 Biblioteca SENAI Uberaba
⏰ Semana da Biblioteca

#SemanaDaBibliotecaSENAIUberaba #BirdBoxGame #SENAIUberaba`;
  }

  // Gerar imagem para compartilhamento
  async generateShareImage(team, position) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");

      // Fundo gradiente moderno
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#1a1a3a");
      gradient.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Adicionar padrão de fundo sutil
      this.drawBackgroundPattern(ctx, canvas.width, canvas.height);

      // Logo SENAI Uberaba
      this.drawSenaiLogo(ctx, canvas.width);

      // Título principal
      ctx.fillStyle = "#4361ee";
      ctx.font = 'bold 64px "Arial", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BIRD BOX GAME", canvas.width / 2, 180);

      // Card da dupla
      this.drawTeamCard(ctx, team, position, canvas.width);

      // Informações do evento
      this.drawEventInfo(ctx, canvas.width);

      // Hashtags
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = 'bold 28px "Arial", sans-serif';
      ctx.fillText(
        "#SemanaDaBibliotecaSENAIUberaba",
        canvas.width / 2,
        canvas.height - 60
      );
      ctx.font = '24px "Arial", sans-serif';
      ctx.fillText(
        "#BirdBoxGame #SENAIUberaba",
        canvas.width / 2,
        canvas.height - 25
      );

      // Converter para URL de dados
      this.shareImageUrl = canvas.toDataURL("image/png");

      // Atualizar preview no modal
      this.updatePreview(canvas);

      resolve(this.shareImageUrl);
    });
  }

  // Desenhar padrão de fundo
  drawBackgroundPattern(ctx, width, height) {
    ctx.fillStyle = "rgba(67, 97, 238, 0.05)";
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Desenhar logo SENAI
  drawSenaiLogo(ctx, width) {
    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 42px "Arial", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("SENAI UBERABA", width / 2, 80);

    // Linha decorativa
    ctx.strokeStyle = "#4361ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 100);
    ctx.lineTo(width / 2 + 120, 100);
    ctx.stroke();
  }

  // Desenhar card da dupla
  drawTeamCard(ctx, team, position, width) {
    const centerX = width / 2;
    const cardY = 280;
    const cardWidth = 700;
    const cardHeight = 350;

    // Fundo do card com gradiente
    const cardGradient = ctx.createLinearGradient(
      centerX - cardWidth / 2,
      cardY,
      centerX + cardWidth / 2,
      cardY + cardHeight
    );
    cardGradient.addColorStop(0, "rgba(67, 97, 238, 0.3)");
    cardGradient.addColorStop(1, "rgba(247, 37, 133, 0.3)");

    ctx.fillStyle = cardGradient;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;

    // Card com bordas arredondadas
    this.drawRoundedRect(
      ctx,
      centerX - cardWidth / 2,
      cardY,
      cardWidth,
      cardHeight,
      25
    );
    ctx.fill();
    ctx.stroke();

    // Posição
    ctx.fillStyle = this.getPositionColor(position);
    ctx.font = 'bold 80px "Arial", sans-serif';
    ctx.fillText(`#${position}`, centerX, cardY + 90);

    // Nome da dupla (truncar se for muito longo)
    const teamName = this.truncateText(team.nome, 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 42px "Arial", sans-serif';
    ctx.fillText(teamName, centerX, cardY + 160);

    // Pontuação
    ctx.fillStyle = "#a0e0ff";
    ctx.font = 'bold 36px "Arial", sans-serif';
    ctx.fillText(`${team.pontuacao} Pontos`, centerX, cardY + 220);
  }

  // Desenhar informações do evento
  drawEventInfo(ctx, width) {
    const centerX = width / 2;
    const startY = 700;

    ctx.fillStyle = "#25d366";
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.fillText("🎮 Venha Jogar na Biblioteca!", centerX, startY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = '26px "Arial", sans-serif';
    ctx.fillText("📍 Biblioteca SENAI Uberaba", centerX, startY + 45);
    ctx.fillText("⏰ Semana da Biblioteca", centerX, startY + 85);
  }

  // Truncar texto muito longo
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  // Desenhar retângulo com bordas arredondadas
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Obter cor baseada na posição
  getPositionColor(position) {
    switch (position) {
      case 1:
        return "#FFD700"; // Ouro
      case 2:
        return "#C0C0C0"; // Prata
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return "#4361ee"; // Azul
    }
  }

  // Atualizar preview no modal
  updatePreview(canvas) {
    const preview = document.getElementById("sharePreview");
    if (preview) {
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = this.shareImageUrl;
      img.alt = "Preview compartilhamento";
      img.style.width = "100%";
      img.style.borderRadius = "10px";
      img.style.maxWidth = "300px";
      img.style.margin = "0 auto";
      img.style.display = "block";
      preview.appendChild(img);
    }
  }

  // Mostrar modal
  showModal() {
    const modal = document.getElementById("shareModal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  // Fechar modal
  closeModal() {
    const modal = document.getElementById("shareModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  // MÉTODOS DE COMPARTILHAMENTO CORRIGIDOS - PARA CRIAR POSTAGEM DIRETAMENTE
  async shareToInstagram() {
    if (!this.shareImageUrl) {
      await this.generateShareImage(this.currentTeam, this.getTeamPosition());
    }

    if (this.isMobile) {
      // Primeiro baixa a imagem para a galeria
      await this.downloadImageToGallery();

      if (this.isIOS()) {
        // iOS - Instagram Stories
        const instagramUrl = `instagram-stories://share?source_application=com.birdbox.game&backgroundImage=${encodeURIComponent(
          this.shareImageUrl
        )}&sticker=birdbox`;
        window.location.href = instagramUrl;

        // Fallback para criar post normal
        setTimeout(() => {
          if (!document.hidden) {
            const fallbackUrl = `instagram://camera`;
            window.location.href = fallbackUrl;
            this.showInstagramInstructions();
          }
        }, 1500);
      } else if (this.isAndroid()) {
        // Android - Instagram com intent de compartilhamento
        this.shareViaAndroidIntent("com.instagram.android", "Instagram");
      }
    } else {
      this.downloadImageWithInstructions("Instagram");
    }
  }

  async shareToTikTok() {
    if (!this.shareImageUrl) {
      await this.generateShareImage(this.currentTeam, this.getTeamPosition());
    }

    if (this.isMobile) {
      // Baixa a imagem primeiro
      await this.downloadImageToGallery();

      if (this.isIOS()) {
        // iOS - TikTok - Tenta abrir a criação de conteúdo
        const tiktokUrl = `snssdk1233://compose`;
        window.location.href = tiktokUrl;
      } else if (this.isAndroid()) {
        // Android - TikTok com intent
        this.shareViaAndroidIntent("com.zhiliaoapp.musically", "TikTok");
      }

      // Instruções após tentar abrir o app
      setTimeout(() => {
        this.showTikTokInstructions();
      }, 1500);
    } else {
      this.downloadImageWithInstructions("TikTok");
    }
  }

  async shareToTwitter() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      if (this.isIOS()) {
        // iOS Twitter - Abre composer com o texto
        const twitterUrl = `twitter://post?message=${text}`;
        window.location.href = twitterUrl;
      } else if (this.isAndroid()) {
        // Android Twitter/X - Abre composer
        const twitterUrl = `intent://compose?text=${text}#Intent;package=com.twitter.android;scheme=twitter;end;`;
        window.location.href = twitterUrl;
      }

      // Fallback
      setTimeout(() => {
        if (!document.hidden) {
          const fallbackUrl = `https://twitter.com/intent/tweet?text=${text}`;
          window.open(fallbackUrl, "_blank");
        }
      }, 1000);
    } else {
      const url = `https://twitter.com/intent/tweet?text=${text}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  }

  async shareToFacebook() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      if (this.isIOS()) {
        // iOS Facebook - Abre composer
        const facebookUrl = `fb://publish/?text=${text}`;
        window.location.href = facebookUrl;
      } else if (this.isAndroid()) {
        // Android Facebook - Abre composer
        const facebookUrl = `intent://post?text=${text}#Intent;package=com.facebook.katana;scheme=fb;end;`;
        window.location.href = facebookUrl;
      }

      // Fallback
      setTimeout(() => {
        if (!document.hidden) {
          const fallbackUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
          window.open(fallbackUrl, "_blank");
        }
      }, 1000);
    } else {
      const url = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  }

  async shareToWhatsApp() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      if (this.isIOS()) {
        // iOS WhatsApp - Abre chat com texto pré-preenchido
        const whatsappUrl = `whatsapp://send?text=${text}`;
        window.location.href = whatsappUrl;
      } else if (this.isAndroid()) {
        // Android WhatsApp - Abre chat com texto
        const whatsappUrl = `intent://send?text=${text}#Intent;package=com.whatsapp;scheme=whatsapp;end;`;
        window.location.href = whatsappUrl;
      }

      // Fallback
      setTimeout(() => {
        if (!document.hidden) {
          const fallbackUrl = `https://api.whatsapp.com/send?text=${text}`;
          window.open(fallbackUrl, "_blank");
        }
      }, 1000);
    } else {
      const url = `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, "_blank");
    }
  }

  // Método para baixar imagem para galeria (simulado)
  async downloadImageToGallery() {
    return new Promise((resolve) => {
      this.downloadImage();
      // Dar tempo para o download completar
      setTimeout(resolve, 1000);
    });
  }

  // Compartilhamento via Intent do Android
  shareViaAndroidIntent(packageName, appName) {
    try {
      // Tenta usar a Web Share API primeiro
      if (navigator.share) {
        this.shareNative();
        return;
      }

      // Fallback para download + instruções
      this.downloadImage();
      setTimeout(() => {
        this.showImageShareInstructions(appName);
      }, 500);
    } catch (error) {
      console.error(`❌ Erro ao compartilhar no ${appName}:`, error);
      this.downloadImage();
      this.showImageShareInstructions(appName);
    }
  }

  // Instruções específicas para Instagram
  showInstagramInstructions() {
    const message = `📸 Para postar no Instagram:\n\n1. A imagem foi salva na sua galeria\n2. Toque no ícone ➕ para criar novo post\n3. Selecione a imagem da galeria\n4. Ajuste o post e adicione:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame\n   #SENAIUberaba`;

    // Mostra alerta após um delay para não interferir com a abertura do app
    setTimeout(() => {
      if (
        confirm(
          message +
            "\n\nClique em OK se precisar de ajuda para encontrar a imagem."
        )
      ) {
        this.showExtraHelp("Instagram");
      }
    }, 2000);
  }

  // Instruções específicas para TikTok
  showTikTokInstructions() {
    const message = `🎵 Para postar no TikTok:\n\n1. Abra o TikTok\n2. Toque em "+" para criar\n3. Selecione "Upload"\n4. Escolha a imagem da galeria\n5. Adicione as hashtags:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame\n   #SENAIUberaba`;

    setTimeout(() => {
      alert(message);
    }, 1500);
  }

  // Instruções para compartilhar imagem
  showImageShareInstructions(appName) {
    const message = `📸 Para compartilhar no ${appName}:\n\n1. A imagem foi salva automaticamente\n2. Abra o ${appName}\n3. Crie um novo post\n4. Selecione a imagem da galeria\n5. Use as hashtags:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame\n   #SENAIUberaba`;

    setTimeout(() => {
      alert(message);
    }, 500);
  }

  // Ajuda extra para encontrar a imagem
  showExtraHelp(appName) {
    const helpMessage = `🔍 Dica para encontrar a imagem:\n\n1. Abra a Galeria de Fotos\n2. Procure na pasta "Downloads"\n3. O nome do arquivo é: "birdbox-${this.currentTeam.nome
      .replace(/\s+/g, "-")
      .toLowerCase()}.png"\n4. Ou procure a imagem mais recente`;

    alert(helpMessage);
  }

  // MÉTODO CORRIGIDO: Download da imagem
  downloadImage() {
    if (!this.shareImageUrl) {
      this.showError("❌ Erro ao gerar imagem para download");
      return;
    }

    try {
      const link = document.createElement("a");
      link.download = `birdbox-${this.currentTeam.nome
        .replace(/\s+/g, "-")
        .toLowerCase()}.png`;
      link.href = this.shareImageUrl;

      // Disparar download automaticamente
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("📥 Imagem salva automaticamente para compartilhamento");
    } catch (error) {
      console.error("❌ Erro ao baixar imagem:", error);
      this.showError("Erro ao baixar imagem. Tente novamente.");
    }
  }

  // Download com instruções para desktop
  downloadImageWithInstructions(appName) {
    this.downloadImage();
    alert(
      `📸 Para compartilhar no ${appName}:\n\n1. A imagem foi salva no seu dispositivo\n2. Abra o ${appName}\n3. Crie um novo post com a imagem\n4. Use as hashtags: #SemanaDaBibliotecaSENAIUberaba #BirdBoxGame #SENAIUberaba`
    );
  }

  // Obter posição da equipe atual
  getTeamPosition() {
    if (!this.currentTeam || !window.rankingManager?.rankingData) return 1;

    const index = window.rankingManager.rankingData.findIndex(
      (team) => team.id === this.currentTeam.id
    );
    return index >= 0 ? index + 1 : 1;
  }

  // Compartilhamento nativo (se disponível)
  async shareNative() {
    if (navigator.share) {
      try {
        // Primeiro baixa a imagem para garantir que está disponível
        if (!this.shareImageUrl) {
          await this.generateShareImage(
            this.currentTeam,
            this.getTeamPosition()
          );
        }

        // Converter data URL para blob para compartilhamento nativo
        const response = await fetch(this.shareImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `birdbox-${this.currentTeam.nome}.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: "BirdBox Game - Minha Conquista!",
          text: this.shareText,
          files: [file],
        });

        console.log("✅ Compartilhamento nativo realizado");
      } catch (error) {
        console.log("❌ Compartilhamento nativo cancelado ou não suportado");
        // Fallback para download
        this.downloadImage();
      }
    } else {
      console.log("📱 Compartilhamento nativo não suportado");
      this.downloadImage();
    }
  }

  // Mostrar erro
  showError(message) {
    alert(message);
  }
}

// Inicializar gerenciador de compartilhamento
const shareManager = new ShareManager();

// Adicionar função global para ser chamada da tabela
if (typeof window !== "undefined") {
  window.shareTeam = function (teamIndex) {
    shareManager.openShareModal(teamIndex);
  };

  // Adicionar função global para download
  window.downloadShareImage = function () {
    shareManager.downloadImage();
  };

  // Adicionar funções globais para compartilhamento específico
  window.shareToInstagram = function () {
    shareManager.shareToInstagram();
  };

  window.shareToTikTok = function () {
    shareManager.shareToTikTok();
  };

  window.shareToTwitter = function () {
    shareManager.shareToTwitter();
  };

  window.shareToFacebook = function () {
    shareManager.shareToFacebook();
  };

  window.shareToWhatsApp = function () {
    shareManager.shareToWhatsApp();
  };

  window.shareNative = function () {
    shareManager.shareNative();
  };

  // Adicionar botão de compartilhamento nativo se disponível
  if (navigator.share) {
    document.addEventListener("DOMContentLoaded", function () {
      const shareButtons = document.querySelectorAll(".btn-share-team");
      shareButtons.forEach((button) => {
        button.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      });
    });
  }
}
