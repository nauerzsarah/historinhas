import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDhxLt_kdbuobSjLw7OcD-SqUxehRS_ZRA",
    authDomain: "historias-e-leitura.firebaseapp.com",
    projectId: "historias-e-leitura",
    storageBucket: "historias-e-leitura.firebasestorage.app",
    messagingSenderId: "301281175179",
    appId: "1:301281175179:web:c0bcce077c9d608fef568e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
