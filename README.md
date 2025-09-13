# BirdBox Jogo 🎮👂🕹️

Projeto multiplayer inspirado no livro **Bird Box**, desenvolvido em **HTML, CSS (Bootstrap) e JavaScript puro** com integração ao **Firebase Realtime Database**. O jogo desafia jogadores a cooperarem usando apenas a audição e a comunicação verbal.

## 🎯 Conceito do Jogo

Em um mundo onde os jogadores não podem ver, a cooperação através da audição torna-se essencial:

- **Um jogador** ouve sons ambientes e os descreve verbalmente
- **O outro jogador** recebe as descrições e deve identificar a fonte sonora correta
- **Formação aleatória de duplas** - o sistema emparelha jogadores automaticamente

## 📁 Estrutura de Diretórios Atualizada

```
birdbox-jogo/
├── publico/                         # Público principal
│   ├── index.html                   # Página inicial - entrada do jogador
│   ├── espera.html                  # Sala de espera por parceiro
│   ├── jogo.html                    # Tela principal do jogo
│   ├── estilos/                     # Estilos CSS organizados
│   │   ├── principal.css            # Estilos globais e utilitários
│   │   ├── index.css                # Estilos específicos da página inicial
│   │   ├── espera.css               # Estilos da sala de espera
│   │   └── jogo.css                 # Estilos da tela de jogo
│   ├── scripts/                     # Lógica JavaScript organizada
│   │   ├── firebase/                # Integração com Firebase
│   │   │   ├── config.js            # Configuração do Firebase
│   │   │   └── database.js          # Operações de banco de dados
│   │   ├── nome.js                  # Gerenciamento de nome do jogador
│   │   ├── fila.js                  # Sistema de fila de espera
│   │   ├── pareamento.js            # Lógica de formação de duplas
│   │   ├── jogo.js                  # Funcionalidades principais do jogo
│   │   ├── audio.js                 # Controle de reprodução de áudio
│   │   ├── util.js                  # Funções utilitárias
│   │   └── espera.js                # Script específico da sala de espera
│   └── arquivos/                    # Arquivos de mídia e dados
│       ├── sons/                    # Biblioteca de sons ambientes
│       │   ├── ambiente/
│       │   │   ├── floresta.mp3
│       │   │   ├── cidade.mp3
│       │   │   ├── rio.mp3
│       │   │   ├── tempestade.mp3
│       │   │   └── vento.mp3
│       │   └── efeitos/
│       │       ├── correto.mp3
│       │       ├── erro.mp3
│       │       ├── match.mp3
│       │       └── fim-jogo.mp3
│       ├── imagens/                 # Assets visuais
│       │   ├── icones/
│       │   │   ├── som-ativo.svg
│       │   │   ├── som-mudo.svg
│       │   │   ├── vendado.svg
│       │   │   └── fones.svg
│       │   └── fundos/
│       │       ├── bg-inicio.jpg
│       │       ├── bg-espera.jpg
│       │       ├── bg-jogo.jpg
│       │       └── overlay.png
│       └── dados/
│           └── perguntas.json       # Banco de perguntas local (backup)
├── LEIAME.md                        # Este arquivo
└── .gitignore                       # Arquivos ignorados pelo Git
```

## 🚀 Funcionamento Técnico

### 1. Fluxo do Jogador

1. **Entrada**: Jogador digita nome em `index.html`
2. **Fila**: Entra na fila de espera (`espera.html`)
3. **Pareamento**: Sistema forma duplas aleatórias automaticamente
4. **Jogo**: Redireciona para `jogo.html` com ID da partida
5. **Execução**: Um ouve/descreve, outro identifica
6. **Término**: Pontuação final e opção de jogar novamente

### 2. Integração com Firebase

- **Configuração**: Credenciais em `scripts/firebase/config.js`
- **Estrutura de Dados**:
  - `birdbox/players/`: Registro de jogadores
  - `birdbox/queue/`: Fila de espera por parceiros
  - `birdbox/games/`: Partidas em andamento
  - `birdbox/questions/`: Banco de perguntas (opcional)

### 3. Recursos Técnicos

- **Design Responsivo**: Bootstrap 5 + CSS personalizado
- **Audio API**: Reprodução de sons ambientes
- **Tempo Real**: Atualizações instantâneas via Firebase
- **Persistência**: localStorage para dados de sessão
- **Fallback**: Banco local de perguntas (JSON)

## 🛠️ Configuração e Instalação

### Pré-requisitos

- Navegador moderno com suporte a JavaScript ES6+
- Conta Firebase (gratuita)
- Servidor web local (opcional, pode abrir direto no navegador)

### Setup do Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative o **Realtime Database**
3. Substitua as credenciais em `scripts/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-sender-id",
  appId: "seu-app-id",
};
```

### Configuração de Regras do Banco (Firebase Console)

```json
{
  "rules": {
    "birdbox": {
      "queue": {
        ".read": true,
        ".write": true
      },
      "games": {
        ".read": "auth != null", // Ou ajuste conforme necessidade
        ".write": "auth != null"
      }
    }
  }
}
```

## 🎮 Como Jogar

1. **Acesse** o jogo através de `index.html`
2. **Digite** seu nome (mínimo 2 caracteres)
3. **Aguarde** o sistema encontrar um parceiro
4. **Escute** atentamente (jogador ouvinte)
5. **Descreva** o que ouve (jogador ouvinte)
6. **Selecione** a opção correta (jogador adivinhador)
7. **Avance** para a próxima rodada
8. **Finalize** quando completar todas as perguntas

## 📊 Estrutura de Dados das Perguntas

Exemplo de `perguntas.json`:

```json
{
  "perguntas": [
    {
      "id": 1,
      "som": "floresta.mp3",
      "pergunta": "Que ambiente sonoro é este?",
      "opcoes": ["Floresta", "Cidade", "Praia", "Deserto"],
      "resposta_correta": 0,
      "dificuldade": 2,
      "categoria": "natureza"
    },
    {
      "id": 2,
      "som": "chuva.mp3",
      "pergunta": "Que fenômeno meteorológico é este?",
      "opcoes": ["Chuva", "Vento", "Trovão", "Granizo"],
      "resposta_correta": 0,
      "dificuldade": 1,
      "categoria": "clima"
    }
  ]
}
```

## 🔧 Personalização

### Adicionar Novos Sons

1. Adicione arquivos de áudio em `arquivos/sons/ambiente/`
2. Atualize o `perguntas.json` com as novas entradas
3. Referencie corretamente o nome do arquivo

### Modificar Estilo

- Edite os arquivos CSS em `estilos/`
- Cores principais estão definidas como variáveis CSS
- Layout responsivo com breakpoints móveis

### Ajustar Dificuldade

- Modifique o campo `dificuldade` nas perguntas
- Ajuste o número de rodadas em `scripts/jogo.js`

## 🌐 Hospedagem

### Opção 1: GitHub Pages

1. Faça push para um repositório GitHub
2. Ative GitHub Pages nas configurações do repositório
3. Acesse via `https://seuusuario.github.io/birdbox-jogo`

### Opção 2: Firebase Hosting (Recomendado)

```bash
# Instale o CLI do Firebase
npm install -g firebase-tools

# Login e configuração
firebase login
firebase init hosting

# Deploy
firebase deploy
```

### Opção 3: Servidor Local

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (se tiver serve instalado)
npx serve publico
```

## 🐛 Solução de Problemas

### Erro de Conexão Firebase

- Verifique as credenciais no `config.js`
- Confirme as regras de segurança do banco

### Áudio Não Reproduz

- Servidor deve servir arquivos com headers corretos
- Verifique caminhos dos arquivos de som

### Pareamento Não Funciona

- Verifique se há pelo menos 2 jogadores na fila
- Confirme as permissões de escrita no Firebase

## 📝 Próximas Melhorias

- [ ] Sistema de convite para amigos específicos
- [ ] Chat por texto durante o jogo
- [ ] Ranking de jogadores
- [ ] Modo solo contra o tempo
- [ ] Mais categorias de sons
- [ ] Efeitos sonoros imersivos
- [ ] Temas visuais alternativos

## 📞 Suporte

Para issues e dúvidas:

1. Verifique a documentação do Firebase
2. Confirme se todos os arquivos estão nos paths corretos
3. Teste em diferentes navegadores

## 📄 Licença

Este projeto é opensource e está sob licença MIT. Sinta-se à vontade para modificar e distribuir.

---

**Desenvolvido para a Semana da Biblioteca 2025** 📚🎉

_Inspirado no livro "Bird Box" de Josh Malerman - uma experiência de cooperação e confiança através dos sentidos._
