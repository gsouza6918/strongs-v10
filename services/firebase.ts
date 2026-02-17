import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// --- INSTRUÇÕES PARA O USUÁRIO ---
// 1. Copie o objeto 'firebaseConfig' do seu Console do Firebase (Configurações do Projeto).
// 2. Substitua os valores abaixo pelos seus novos valores.

const firebaseConfig = {
  apiKey: "AIzaSyCcqFI5GyL9dgfC_ZPiR61pU7pLUEDpD9w",
  authDomain: "strongs-v2-51d43.firebaseapp.com",
  databaseURL: "https://strongs-v2-51d43-default-rtdb.firebaseio.com",
  projectId: "strongs-v2-51d43",
  storageBucket: "strongs-v2-51d43.firebasestorage.app",
  messagingSenderId: "282461406755",
  appId: "1:282461406755:web:bf8ef8eaefb3aa1289d396"
};

// Verificamos se o usuário já configurou o arquivo para evitar erros de conexão
// Se a apiKey ainda for o texto padrão, consideramos não configurado.
export const isConfigured = firebaseConfig.apiKey !== "COLE_SUA_NOVA_API_KEY_AQUI" && 
                            !firebaseConfig.databaseURL.includes("SEU_NOVO_ID");

let app;
let db: Database | undefined;

// Só inicializamos se as chaves tiverem sido trocadas
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

export { db };