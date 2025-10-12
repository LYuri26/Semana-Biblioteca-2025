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
