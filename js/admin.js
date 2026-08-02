// js/admin.js
// Protège admin.html : redirige vers login.html si non connecté
// Affiche la liste des factures récentes en direct depuis Firestore

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const loadingBox = document.getElementById("admin-loading");
const contentBox = document.getElementById("admin-content");
const logoutBtn = document.getElementById("admin-logout");
const userEmailLabel = document.getElementById("admin-user-email");

onAuthStateChanged(auth, function (user) {
    if (user) {
        userEmailLabel.textContent = user.email;
        loadingBox.style.display = "none";
        contentBox.classList.add("is-visible");
        chargerFacturesRecentes();
    } else {
        window.location.href = "login.html";
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        signOut(auth).then(function () {
            window.location.href = "login.html";
        });
    });
}

// ---- Liste des factures récentes (temps réel) ----

function chargerFacturesRecentes() {
    const tbody = document.getElementById("admin-factures-body");
    if (!tbody) return;

    const facturesQuery = query(collection(db, "factures"), orderBy("dateCreation", "desc"));

    onSnapshot(facturesQuery, function (snapshot) {
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6">Aucune facture pour le moment.</td></tr>';
            return;
        }

        tbody.innerHTML = "";

        snapshot.forEach(function (docSnap) {
            const f = docSnap.data();
            const dateAffichee = f.date ? formatDateFr(f.date) : "-";
            const statutInfo = getStatutInfo(f.statut);

            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + (f.numero || "-") + "</td>" +
                "<td>" + (f.clientNom || "-") + "</td>" +
                "<td>" + dateAffichee + "</td>" +
                "<td>" + formatMontant(f.total) + "</td>" +
                '<td><span class="statut-badge ' + statutInfo.className + '">' + (f.statut || "-") + "</span></td>" +
                '<td><a href="facture.html?id=' + docSnap.id + '">Voir</a><a href="#" class="fx-delete-link" data-id="' + docSnap.id + '" data-numero="' + (f.numero || "") + '">Supprimer</a></td>';

            tbody.appendChild(tr);
        });

        tbody.querySelectorAll(".fx-delete-link").forEach(function (link) {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const factureId = link.dataset.id;
                const numero = link.dataset.numero;
                const confirmation = window.confirm("Supprimer définitivement la facture N° " + numero + " ? Cette action est irréversible.");
                if (!confirmation) return;

                deleteDoc(doc(db, "factures", factureId)).catch(function (error) {
                    console.error("Erreur lors de la suppression :", error);
                    alert("Erreur lors de la suppression de la facture.");
                });
            });
        });
    }, function (error) {
        console.error("Erreur lors du chargement des factures :", error);
        tbody.innerHTML = '<tr><td colspan="6">Erreur de chargement.</td></tr>';
    });
}

function formatDateFr(isoDate) {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
}

function formatMontant(montant) {
    if (montant == null) return "-";
    return new Intl.NumberFormat("fr-FR").format(montant) + " Ar";
}

function getStatutInfo(statut) {
    switch (statut) {
        case "Payée": return { className: "payee" };
        case "Acompte versé": return { className: "acompte" };
        case "Annulée": return { className: "annulee" };
        default: return { className: "attente" };
    }
}
