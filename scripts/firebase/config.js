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
  // Verificar se o Firebase já foi inicializado
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado com sucesso para o Jogo BirdBox!");
  } else {
    firebase.app(); // Já inicializado, usar a instância existente
    console.log("Firebase já estava inicializado");
  }

  // Inicializar instância do banco de dados
  if (typeof FirebaseDatabase !== "undefined") {
    window.firebaseDB = new FirebaseDatabase();
    console.log("FirebaseDatabase inicializado");
  }

  // Tentar iniciar sistema de pareamento
  setTimeout(() => {
    if (typeof matchingSystem !== "undefined" && matchingSystem.startMatching) {
      matchingSystem.startMatching();
    }
  }, 2000);
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);

  // Tentar novamente após 3 segundos
  setTimeout(() => {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log("Firebase inicializado na segunda tentativa");
    } catch (retryError) {
      console.error("Falha ao inicializar Firebase após retry:", retryError);
    }
  }, 3000);
}
