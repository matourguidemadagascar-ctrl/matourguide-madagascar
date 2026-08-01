// js/auth.js
// Logique de connexion pour login.html

import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const errorBox = document.getElementById("login-error");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        errorBox.classList.remove("is-visible");
        errorBox.textContent = "";

        signInWithEmailAndPassword(auth, email, password)
            .then(function () {
                window.location.href = "admin.html";
            })
            .catch(function (error) {
                let message = "Une erreur est survenue. Réessaie.";

                if (error.code === "auth/invalid-credential" ||
                    error.code === "auth/wrong-password" ||
                    error.code === "auth/user-not-found") {
                    message = "Email ou mot de passe incorrect.";
                } else if (error.code === "auth/invalid-email") {
                    message = "Adresse email invalide.";
                } else if (error.code === "auth/too-many-requests") {
                    message = "Trop de tentatives. Réessaie dans quelques minutes.";
                }

                errorBox.textContent = message;
                errorBox.classList.add("is-visible");
            });
    });
}