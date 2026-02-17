import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// --- INSTRUÇÕES PARA O USUÁRIO ---
// 1. Copie o objeto 'firebaseConfig' do seu Console do Firebase (Configurações do Projeto).
// 2. Substitua os valores abaixo pelos seus novos valores.

const firebaseConfig = {
  apiKey: "COLE_SUA_NOVA_API_KEY_AQUI",
  authDomain: "SEU_NOVO_ID.firebaseapp.com",
  databaseURL: "https://SEU_NOVO_ID-default-rtdb.firebaseio.com",
  projectId: "SEU_NOVO_ID",
  storageBucket: "SEU_NOVO_ID.firebasestorage.app",
  messagingSenderId: "SEUS_NUMEROS",
  appId: "1:SEUS_NUMEROS:web:SEUS_CODIGOS",
  measurementId: "G-SEU_CODIGO"
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