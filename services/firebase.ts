import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// --- INSTRUÇÕES ---
// 1. Vá no console do Firebase > Configurações do Projeto
// 2. Role até "Seus aplicativos" e copie as chaves do objeto firebaseConfig
// 3. Cole os valores abaixo:

const firebaseConfig = {
  apiKey: "AIzaSyCTdnAaGBdrF5GiOY46XiD1ItAaksDRzhM",
  authDomain: "strongs-brazil-bddea.firebaseapp.com",
  databaseURL: "https://strongs-brazil-bddea-default-rtdb.firebaseio.com",
  projectId: "strongs-brazil-bddea",
  storageBucket: "strongs-brazil-bddea.firebasestorage.app",
  messagingSenderId: "447630113773",
  appId: "1:447630113773:web:8cdef57f44ae0933ab05e4",
  measurementId: "G-VD7QWV7DY7"
};

// Verificamos se o usuário já configurou o arquivo
export const isConfigured = firebaseConfig.apiKey !== "COLE_SUA_NOVA_API_KEY_AQUI" && 
                            !firebaseConfig.databaseURL.includes("SEU_NOVO_PROJETO");

let app;
let db: Database | undefined;

// Só tentamos conectar se estiver configurado, para evitar erros no console
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