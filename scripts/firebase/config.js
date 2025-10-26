// Configuração do Firebase para o Jogo BirdBox - ATUALIZADA
const firebaseConfig = {
  apiKey: "AIzaSyB_0YHkYWqCG6ULW7fe1C_8lF5g2J_RBr8",
  authDomain: "sb-2025-producao.firebaseapp.com",
  databaseURL: "https://sb-2025-producao-default-rtdb.firebaseio.com",
  projectId: "sb-2025-producao",
  storageBucket: "sb-2025-producao.firebasestorage.app",
  messagingSenderId: "265509159865",
  appId: "1:265509159865:web:47649f0f0c7c269f702c68",
  measurementId: "G-XE8ECKMLF6",
};

// Inicializar Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado com sucesso com NOVA configuração!");
  }

  // Inicializar banco de dados
  if (typeof FirebaseDatabase !== "undefined") {
    window.firebaseDB = new FirebaseDatabase();
    console.log("FirebaseDatabase inicializado com NOVO banco");
  }

  // Iniciar pareamento com delay maior
  setTimeout(() => {
    if (typeof matchingSystem !== "undefined" && matchingSystem.startMatching) {
      console.log("Iniciando sistema de pareamento...");
      matchingSystem.startMatching();
    }
  }, 5000); // Aumentado para 5 segundos
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

setTimeout(async () => {
  if (
    typeof firebaseDB !== "undefined" &&
    firebaseDB.initializeRankingStructure
  ) {
    await firebaseDB.initializeRankingStructure();
    console.log("✅ Estrutura do ranking verificada/criada no NOVO banco");
  }
}, 2000);

/*
// Configuração do Firebase para o Jogo BirdBox
const firebaseConfig = {
  apiKey: "AIzaSyBkJI_IQ4MHbkotHAUlJWGIR3w37kPQ2uQ",
  authDomain: "semana-biblioteca-2025-8a0ef.firebaseapp.com",
  databaseURL:
    "https://semana-biblioteca-2025-8a0ef-default-rtdb.firebaseio.com",
  projectId: "semana-biblioteca-2025-8a0ef",
  storageBucket: "semana-biblioteca-2025-8a0ef.firebasestorage.app",
  messagingSenderId: "934076969739",
  appId: "1:934076969739:web:5bc490def2f04c1d70a80e",
  measurementId: "G-9CMVY799B9",
};

// Inicializar Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado com sucesso!");
  }

  // Inicializar banco de dados
  if (typeof FirebaseDatabase !== "undefined") {
    window.firebaseDB = new FirebaseDatabase();
    console.log("FirebaseDatabase inicializado");
  }

  // Iniciar pareamento com delay maior
  setTimeout(() => {
    if (typeof matchingSystem !== "undefined" && matchingSystem.startMatching) {
      console.log("Iniciando sistema de pareamento...");
      matchingSystem.startMatching();
    }
  }, 5000); // Aumentado para 5 segundos
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

setTimeout(async () => {
  if (
    typeof firebaseDB !== "undefined" &&
    firebaseDB.initializeRankingStructure
  ) {
    await firebaseDB.initializeRankingStructure();
    console.log("✅ Estrutura do ranking verificada/criada");
  }
}, 2000);
*/
