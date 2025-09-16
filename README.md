# 🎮 BirdBox Jogo - Experiência Multiplayer de Sons

![Status](https://img.shields.io/badge/Status-Pronto%20para%20Jogar-brightgreen)
![Multiplayer](https://img.shields.io/badge/Multiplayer-Tempo%20Real-blue)
![Tecnologia](https://img.shields.io/badge/Plataforma-Web%20%2B%20Mobile-orange)
![Acessibilidade](https://img.shields.io/badge/Acessibilidade-Foco%20Auditivo-yellow)

## 🌟 Visão Geral

**BirdBox Jogo** é uma experiência multiplayer inovadora inspirada no universo do livro "Bird Box", onde jogadores devem confiar apenas em sua audição e habilidades de comunicação para cooperarem e vencerem desafios sonoros.

## 🎯 Como Funciona

### 👥 Mecânica de Jogo

- **🤝 Pareamento Automático**: Sistema inteligente conecta jogadores em tempo real
- **🎭 Duas Funções**:
  - **🎧 O Descritor**: Ouve sons ambientes e os descreve verbalmente
  - **🎯 O Adivinhador**: Interpreta as descrições e identifica a fonte sonora
- **⏱️ Rodadas Cronometradas**: Desafios dinâmicos com tempo limitado

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Bootstrap 5), JavaScript ES6+
- **Backend**: Firebase Realtime Database
- **Áudio**: Web Audio API
- **Design**: Interface responsiva e acessível
- **Storage**: LocalStorage para persistência de sessão

## 📦 Estrutura do Projeto

```
Semana-Biblioteca-2025/
├── 🎪 Páginas Principais
│   ├── index.html          # Portal de entrada
│   ├── espera.html         # Sala de espera
│   └── jogo.html          # Arena principal
│
├── 🎨 Estilos Visuais
│   ├── index.css          # Estilo do portal
│   ├── espera.css         # Estilo da espera
│   └── jogo.css           # Estilo do jogo
│
├── ⚙️ Scripts (Modularizados)
│   ├── 🔥 firebase/       # Integração Firebase
│   │   ├── config.js      # Configurações
│   │   └── database.js    # Operações DB
│   │
│   ├── 👤 nome.js         # Gerenciamento de usuário
│   ├── 🧮 fila.js         # Sistema de filas
│   ├── 🤝 pareamento.js   # Algoritmo de matching
│   ├── 🎯 jogo.js         # Núcleo do jogo
│   ├── 🔊 leitor.js       # Controle de áudio
│   ├── 👂 ouvinte.js      # Lógica do descritor
│   ├── ❓ perguntas.js    # Banco de questões
│   ├── 🛠️ util.js         # Utilitários
│   └── ⏳ espera.js       # Gerenciamento de espera
│
├── 📚 Biblioteca de Sons (20+ Ambientes)
│
└── 📊 perguntas.json     # Banco de desafios
```

## 🚀 Configuração Rápida

### 📋 Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge)
- Conta Firebase (gratuita)
- Microfone (recomendado)
- Fones de ouvido (experiência ideal)

### 🔧 Setup em 3 Passos

1. **Crie projeto no [Firebase Console](https://console.firebase.google.com/)**
2. **Configure Realtime Database**
3. **Atualize `config.js` com suas credenciais:**

```javascript
// scripts/firebase/config.js
const firebaseConfig = {
  apiKey: "sua-chave-unica",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-rtdb.firebaseio.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id-exclusivo",
};
```

### 🎮 Execução Local

```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js
npx serve .

# Opção 3: PHP
php -S localhost:8000

# Acesse: http://localhost:8000
```

## 🎯 Como Jogar

### 👤 Para o Descritor

1. 🎧 Use bons fones de ouvido
2. 🔈 Ajuste o volume confortavelmente
3. 🗣️ Descreva com detalhes sensoriais
4. ⏱️ Seja claro e objetivo no tempo

### 👤 Para o Adivinhador

1. 👂 Escute atentamente as dicas
2. 🤔 Associe com as opções disponíveis
3. ✅ Selecione com convicção
4. 🔁 Aprenda com cada rodada

### ⚙️ Configurações Padrão

- **Rodadas**: 5 por partida
- **Tempo**: 45 segundos/rodada
- **Pontuação Base**: 10 pontos/acerto
- **Bônus Sequência**: +5 pontos consecutivos

## 🎨 Personalização

### ➕ Adicionar Novos Sons

1. Adicione arquivo MP3 em `arquivos/sons/`
2. Registre no `perguntas.json`:

```json
{
  "id": 21,
  "som": "meu-novo-som.mp3",
  "pergunta": "O que este som representa?",
  "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "resposta_correta": 0,
  "dificuldade": 3,
  "categoria": "personalizado"
}
```

### 🎨 Customizar Aparência

Modifique as variáveis CSS em `estilos/`:

```css
:root {
  --primary: #2c3e50;
  --secondary: #e74c3c;
  --accent: #f39c12;
  --text: #ecf0f1;
  --background: #34495e;
}
```

## 🌐 Deploy e Hospedagem

### 🚀 Firebase Hosting (Recomendado)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 📊 GitHub Pages

1. Push para repositório GitHub
2. Settings > Pages > Branch main
3. Acesse: `https://lyuri26.github.io/Semana-Biblioteca-2025`

### 🐳 Outras Opções

- **Netlify**: Arraste pasta para deploy
- **Vercel**: Conecte repositório Git
- **Traditional**: Qualquer servidor web

## 🐛 Solução de Problemas

### ❌ Erros Comuns e Soluções

| Problema               | Solução                           |
| ---------------------- | --------------------------------- |
| **Audio não funciona** | Verifique permissões do navegador |
| **Pareamento falha**   | Confirme regras do Firebase       |
| **Conexão lenta**      | Teste em rede estável             |
| **Mobile não carrega** | Use navegador atualizado          |

### 🔧 Debug Avançado

```javascript
// Ative debug no console
localStorage.setItem("debug", "true");
// Recarregue a página para logs detalhados
```

**Desenvolvido com ❤️ para a Semana da Biblioteca 2025**

_"Na escuridão, descobrimos que nossa verdadeira visão vem daquilo que estamos dispostos a ouvir."_
