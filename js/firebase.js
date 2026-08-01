// js/firebase.js
// Initialisation Firebase — partagée par login.html, admin.html, facture.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgLpf3I_bi7pB4b_PfCapT2RWwM4m_fs0",
  authDomain: "ma-tourguidemadagascar.firebaseapp.com",
  projectId: "ma-tourguidemadagascar",
  storageBucket: "ma-tourguidemadagascar.firebasestorage.app",
  messagingSenderId: "944127557606",
  appId: "1:944127557606:web:c636af24c1709dc5722027",
  measurementId: "G-WL5DPNV7PT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);