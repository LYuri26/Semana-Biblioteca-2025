# BirdBox Jogo 🎮

Projeto simples inspirado no livro _Bird Box_, feito em **HTML, CSS (Bootstrap) e JavaScript**.  
O jogo é pensado para funcionar em **duplas**:

- Um jogador escuta o som e descreve oralmente.
- O outro jogador vê quatro opções e deve escolher a correta.

---

## Estrutura de Pastas

```

birdbox-jogo/
├─ publico/
│  ├─ index.html           # Página inicial (antigo inicio.html)
│  ├─ espera.html          # tela de espera até formar dupla
│  ├─ jogo.html            # tela principal do jogo
│  ├─ estilos/
│  │  └─ principal.css     # ajustes de estilo em cima do Bootstrap
│  ├─ scripts/
│  │  ├─ firebase/
│  │  │  ├─ config.js      # configuração do Firebase
│  │  │  └─ database.js    # funções do banco de dados
│  │  ├─ nome.js           # captura e guarda o nome do jogador
│  │  ├─ fila.js           # lógica de fila (monta dupla aleatória)
│  │  ├─ pareamento.js     # cuida da formação de pares e redireciona
│  │  ├─ jogo.js           # lógica do jogo (funções principais)
│  │  ├─ audio.js          # toca os sons
│  │  └─ util.js           # funções auxiliares (embaralhar etc.)
│  └─ arquivos/
│     ├─ sons/             # sons locais (teste)
│     └─ dados/
│        └─ perguntas.json # perguntas + opções + resposta correta
└─ LEIAME.md               # instruções do projeto

```

---

## Funcionamento

1.  O jogador abre `inicio.html` e digita seu nome.
2.  Vai para `espera.html` até que o sistema forme a dupla.
3.  Ao iniciar, os dois jogadores entram em `jogo.html`.
4.  As perguntas e opções ficam em `perguntas.json`.
5.  Um jogador descreve o som, o outro escolhe a opção correta.
6.  O jogo termina quando o jogador responsável pelas respostas clicar em **Encerrar**.

---

## Requisitos

- Navegador moderno com suporte a HTML5 e JavaScript.
- Bootstrap via CDN (já referenciado nos HTMLs).
- Sons adicionados na pasta `publico/arquivos/sons/`.
- Perguntas configuradas em `publico/arquivos/dados/perguntas.json`.
