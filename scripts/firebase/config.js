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
firebase.initializeApp(firebaseConfig);
console.log("Firebase inicializado com sucesso para o Jogo BirdBox!");
