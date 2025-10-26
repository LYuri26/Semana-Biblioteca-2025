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
      canvas.width = 1080; // Ideal para Instagram
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

  // COMPARTILHAMENTO AUTOMATIZADO PARA MOBILE
  async shareToInstagram() {
    if (!this.shareImageUrl) {
      await this.generateShareImage(this.currentTeam, this.getTeamPosition());
    }

    if (this.isMobile) {
      // Tentar abrir o Instagram diretamente
      const instagramUrl = `instagram://library?assetPath=${encodeURIComponent(
        this.shareImageUrl
      )}`;
      const fallbackUrl = `https://www.instagram.com/create/story/`;

      this.openAppOrFallback(instagramUrl, fallbackUrl, "Instagram");
    } else {
      this.downloadImageWithInstructions("Instagram");
    }
  }

  async shareToTikTok() {
    if (!this.shareImageUrl) {
      await this.generateShareImage(this.currentTeam, this.getTeamPosition());
    }

    if (this.isMobile) {
      // TikTok não tem deep link direto para upload, então usamos o esquema universal
      const tiktokUrl = `tiktok://`;
      const fallbackUrl = `https://www.tiktok.com/upload?`;

      this.openAppOrFallback(tiktokUrl, fallbackUrl, "TikTok");

      // Dar instruções após tentar abrir o app
      setTimeout(() => {
        this.showTikTokInstructions();
      }, 1000);
    } else {
      this.downloadImageWithInstructions("TikTok");
    }
  }

  async shareToTwitter() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      // Tentar abrir app do Twitter/X
      const twitterUrl = `twitter://post?message=${text}`;
      const fallbackUrl = `https://twitter.com/intent/tweet?text=${text}`;

      this.openAppOrFallback(twitterUrl, fallbackUrl, "Twitter");
    } else {
      const url = `https://twitter.com/intent/tweet?text=${text}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  }

  async shareToFacebook() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      // Tentar abrir app do Facebook
      const facebookUrl = `fb://publish/?text=${text}`;
      const fallbackUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;

      this.openAppOrFallback(facebookUrl, fallbackUrl, "Facebook");
    } else {
      const url = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  }

  async shareToWhatsApp() {
    const text = encodeURIComponent(this.shareText);

    if (this.isMobile) {
      // Tentar abrir app do WhatsApp
      const whatsappUrl = `whatsapp://send?text=${text}`;
      const fallbackUrl = `https://api.whatsapp.com/send?text=${text}`;

      this.openAppOrFallback(whatsappUrl, fallbackUrl, "WhatsApp");
    } else {
      const url = `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, "_blank");
    }
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

      // Mostrar instruções para mobile
      if (this.isMobile) {
        setTimeout(() => {
          this.showMobileDownloadInstructions();
        }, 500);
      }
    } catch (error) {
      console.error("❌ Erro ao baixar imagem:", error);
      this.showError("Erro ao baixar imagem. Tente novamente.");
    }
  }

  // Método para abrir app ou fallback
  openAppOrFallback(appUrl, fallbackUrl, appName) {
    // Tentar abrir o app
    window.location.href = appUrl;

    // Se não abrir em 500ms, vai para fallback
    setTimeout(() => {
      if (!document.hidden) {
        console.log(`📱 ${appName} não encontrado, abrindo fallback`);
        window.open(fallbackUrl, "_blank");

        // Mostrar instruções específicas
        if (appName === "Instagram" || appName === "TikTok") {
          this.showImageShareInstructions(appName);
        }
      }
    }, 500);
  }

  // Instruções para compartilhar imagem
  showImageShareInstructions(appName) {
    setTimeout(() => {
      const message = `📸 Para compartilhar no ${appName}:\n\n1. A imagem foi salva automaticamente\n2. Abra o ${appName}\n3. Crie um novo post\n4. Selecione a imagem da galeria\n5. Use as hashtags:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame`;

      if (
        confirm(
          message +
            "\n\nClique em OK para abrir a galeria e selecionar a imagem."
        )
      ) {
        // Tentar abrir a galeria ou file picker
        this.triggerImageDownload();
      }
    }, 1000);
  }

  // Instruções específicas para TikTok
  showTikTokInstructions() {
    const message = `🎵 Para compartilhar no TikTok:\n\n1. Abra o TikTok\n2. Toque em "+" para criar\n3. Selecione "Upload"\n4. Escolha a imagem da galeria\n5. Use as hashtags:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame\n   #SENAIUberaba`;

    alert(message);
    this.triggerImageDownload();
  }

  // Instruções para download em mobile
  showMobileDownloadInstructions() {
    const message = `📱 Imagem salva na galeria!\n\nAgora você pode:\n\n1. Abrir Instagram/TikTok\n2. Criar novo post\n3. Selecionar esta imagem\n4. Usar as hashtags:\n   #SemanaDaBibliotecaSENAIUberaba\n   #BirdBoxGame`;

    alert(message);
  }

  // Download automático da imagem (método auxiliar)
  triggerImageDownload() {
    this.downloadImage();
  }

  // Download com instruções para desktop
  downloadImageWithInstructions(appName) {
    this.downloadImage();
    alert(
      `📸 Para compartilhar no ${appName}:\n\n1. A imagem foi salva no seu dispositivo\n2. Abra o ${appName}\n3. Faça um post com a imagem\n4. Use as hashtags: #SemanaDaBibliotecaSENAIUberaba #BirdBoxGame`
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
