import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// SUBSTITUA ESTES DADOS PELOS DADOS QUE VOCÊ COPIOU NO CONSOLE DO FIREBASE
// Acesse: Console Firebase > Configurações do Projeto > Geral > Seus aplicativos
const firebaseConfig = {
  apiKey: "AIzaSyBI71QOO1k8b_0B9oweIJDD6v44yKolyu0",
  authDomain: "strongs-brazil.firebaseapp.com",
  databaseURL: "https://strongs-brazil-default-rtdb.firebaseio.com",
  projectId: "strongs-brazil",
  storageBucket: "strongs-brazil.firebasestorage.app",
  messagingSenderId: "1024925581751",
  appId: "1:1024925581751:web:b02d40cb7ad4aec40da832",
  measurementId: "G-TN3GJVR4FF"
};

// Verificamos se o usuário já configurou o arquivo (se mudou os valores padrão)
export const isConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI" && 
                            !firebaseConfig.databaseURL.includes("seu-projeto-default");

let app;
let db: Database | undefined;

// Só tentamos conectar se estiver configurado, para evitar erros no console
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

export { db };