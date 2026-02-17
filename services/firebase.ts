import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCcqFI5GyL9dgfC_ZPiR61pU7pLUEDpD9w",
  authDomain: "strongs-v2-51d43.firebaseapp.com",
  databaseURL: "https://strongs-v2-51d43-default-rtdb.firebaseio.com",
  projectId: "strongs-v2-51d43",
  storageBucket: "strongs-v2-51d43.firebasestorage.app",
  messagingSenderId: "282461406755",
  appId: "1:282461406755:web:bf8ef8eaefb3aa1289d396"
};

// Verificação de configuração
export const isConfigured = firebaseConfig.apiKey !== "COLE_SUA_NOVA_API_KEY_AQUI" && 
                            !firebaseConfig.databaseURL.includes("SEU_NOVO_ID");

let app: any;
let db: any;

if (isConfigured) {
  try {
    // Access initializeApp directly
    app = initializeApp(firebaseConfig);
    // Correção: Passamos a URL explicitamente para garantir a conexão
    db = getDatabase(app, firebaseConfig.databaseURL);
    console.log("Firebase conectado com sucesso!");
  } catch (error: any) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

export { db };