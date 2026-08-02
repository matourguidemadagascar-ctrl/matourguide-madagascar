// js/facture.js
// Protection de facture.html + logique de calcul, sauvegarde Firestore et PDF
// Gère aussi le chargement d'une facture existante en édition via ?id=ID

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
    collection,
    addDoc,
    updateDoc,
    getDocs,
    doc,
    getDoc,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

// ---- Coordonnées de l'agence (en-tête de facture) ----
const AGENCY_INFO = {
    nom: "Ma'Tour Guide Madagascar",
    telephone: "+261 34 22 784 90",
    email: "matourguidemadagascar@gmail.com",
    adresse: "Nosy Be, Madagascar", // à confirmer/ajuster si besoin
    agrement: "Décision d'agrément N°349/Mintour/SG/DGAT/DFMT/SSAE/GUIDE-18 du 10/08/2018",
    idNumber: "N° ID : 104-SSAE-18/R",
    autorisation: "Autorisation N°089-MTA/SG/DGT/DAIT/SAT-EDBM.26"
};

const loadingBox = document.getElementById("facture-loading");
const contentBox = document.getElementById("facture-content");
const logoutBtn = document.getElementById("facture-logout");
const form = document.getElementById("facture-form");
const messageBox = document.getElementById("facture-message");

const itemsBody = document.getElementById("fx-items-body");
const addItemBtn = document.getElementById("fx-add-item");
const totalDisplay = document.getElementById("fx-total-display");
const resteDisplay = document.getElementById("fx-reste-display");
const grandTotalDisplay = document.getElementById("fx-grand-total-display");
const acompteInput = document.getElementById("fx-acompte");
const submitBtn = form.querySelector('button[type="submit"]');

let itemRowCount = 0;
let currentFactureId = null; // null = nouvelle facture, sinon = édition d'une facture existante

// ---- Protection de la page ----

onAuthStateChanged(auth, function (user) {
    if (user) {
        loadingBox.style.display = "none";
        contentBox.classList.add("is-visible");
        initFormulaire();
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

// ---- Initialisation : nouvelle facture OU édition d'une facture existante ----

function initFormulaire() {
    const params = new URLSearchParams(window.location.search);
    const factureId = params.get("id");
    const clientId = params.get("client");

    setDefaultDate();

    if (factureId) {
        // Mode édition : on charge la facture existante
        chargerFactureExistante(factureId);
    } else {
        // Mode nouvelle facture
        setNextInvoiceNumber();
        if (clientId) prefillClientFromURL(clientId);
        addItemRow(); // une première ligne vide par défaut
    }
}

// ---- Date du jour par défaut ----

function setDefaultDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("fx-date").value = today;
}

// ---- Numéro de facture auto (001, 002, ...) mais modifiable ----

function setNextInvoiceNumber() {
    const facturesQuery = query(collection(db, "factures"), orderBy("numero", "desc"), limit(1));

    getDocs(facturesQuery).then(function (snapshot) {
        if (snapshot.empty) {
            document.getElementById("fx-numero").value = "001";
            return;
        }

        const lastNumero = snapshot.docs[0].data().numero || "000";
        const numericPart = parseInt(lastNumero.replace(/\D/g, ""), 10) || 0;
        const next = (numericPart + 1).toString().padStart(3, "0");
        document.getElementById("fx-numero").value = next;
    }).catch(function () {
        // en cas d'erreur (ex: première facture), on garde 001 par défaut
    });
}

// ---- Pré-remplissage optionnel si on arrive depuis clients.html ----

function prefillClientFromURL(clientId) {
    getDoc(doc(db, "clients", clientId)).then(function (snap) {
        if (!snap.exists()) return;
        const data = snap.data();
        document.getElementById("fx-client-nom").value = data.nom || "";
        document.getElementById("fx-client-email").value = data.email || "";
        document.getElementById("fx-client-telephone").value = data.telephone || "";
        document.getElementById("fx-client-adresse").value = data.adresse || "";
    }).catch(function () {
        // pas grave si ça échoue, le champ reste vide et modifiable manuellement
    });
}

// ---- Chargement d'une facture existante (mode édition) ----

function chargerFactureExistante(factureId) {
    getDoc(doc(db, "factures", factureId)).then(function (snap) {
        if (!snap.exists()) {
            showMessage("⚠️ Facture introuvable. Un nouveau formulaire a été affiché.", "is-error");
            setNextInvoiceNumber();
            addItemRow();
            return;
        }

        const data = snap.data();
        currentFactureId = factureId;

        // Informations générales
        document.getElementById("fx-numero").value = data.numero || "";
        document.getElementById("fx-date").value = data.date || "";

        // Client
        if (data.client) {
            document.getElementById("fx-client-nom").value = data.client.nom || "";
            document.getElementById("fx-client-email").value = data.client.email || "";
            document.getElementById("fx-client-telephone").value = data.client.telephone || "";
            document.getElementById("fx-client-adresse").value = data.client.adresse || "";
        }

        // Voyage
        if (data.voyage) {
            document.getElementById("fx-destination").value = data.voyage.destination || "";
            document.getElementById("fx-participants").value = data.voyage.participants || 1;
            document.getElementById("fx-date-debut").value = data.voyage.dateDebut || "";
            document.getElementById("fx-date-fin").value = data.voyage.dateFin || "";
            document.getElementById("fx-programme").value = data.voyage.programme || "";
        }

        // Prestations (reconstruit les lignes à partir des données enregistrées)
        itemsBody.innerHTML = "";
        if (data.items && data.items.length > 0) {
            data.items.forEach(function (item) {
                addItemRow(item.service, item.quantite, item.prixUnitaire);
            });
        } else {
            addItemRow();
        }

        // Acompte / paiement
        acompteInput.value = data.acompte || 0;
        document.getElementById("fx-mode-paiement").value = data.modePaiement || "Espèces";

        // Inclus / non inclus
        document.getElementById("fx-inclus").value = (data.inclus || []).join("\n");
        document.getElementById("fx-non-inclus").value = (data.nonInclus || []).join("\n");

        // Statut
        document.getElementById("fx-statut").value = data.statut || "En attente";

        recalculate();

        // Adapter le bouton et le titre pour indiquer le mode édition
        if (submitBtn) submitBtn.textContent = "💾 Mettre à jour la facture";
        const heading = document.querySelector(".admin-topbar h1");
        if (heading) heading.textContent = "Modifier la facture N° " + (data.numero || "");

    }).catch(function (error) {
        console.error("Erreur lors du chargement de la facture :", error);
        showMessage("⚠️ Erreur lors du chargement de la facture.", "is-error");
        setNextInvoiceNumber();
        addItemRow();
    });
}

// ---- Lignes de prestations dynamiques ----

function addItemRow(service, qte, prix) {
    itemRowCount++;
    const rowId = itemRowCount;

    const tr = document.createElement("tr");
    tr.dataset.rowId = rowId;
    tr.innerHTML =
        '<td><input type="text" class="fx-item-service" placeholder="ex: Tour Nosy Be 3 jours"></td>' +
        '<td><input type="number" class="fx-item-qte" min="1" value="1"></td>' +
        '<td><input type="number" class="fx-item-prix" min="0" value="0"></td>' +
        '<td><span class="fx-item-total">0</span> Ar</td>' +
        '<td><button type="button" class="fx-item-remove" title="Supprimer">&times;</button></td>';

    itemsBody.appendChild(tr);

    if (service !== undefined) tr.querySelector(".fx-item-service").value = service;
    if (qte !== undefined) tr.querySelector(".fx-item-qte").value = qte;
    if (prix !== undefined) tr.querySelector(".fx-item-prix").value = prix;

    tr.querySelector(".fx-item-qte").addEventListener("input", recalculate);
    tr.querySelector(".fx-item-prix").addEventListener("input", recalculate);
    tr.querySelector(".fx-item-remove").addEventListener("click", function () {
        tr.remove();
        recalculate();
    });
}

addItemBtn.addEventListener("click", function () {
    addItemRow();
});
acompteInput.addEventListener("input", recalculate);

// ---- Calcul des totaux ----

function recalculate() {
    let total = 0;

    document.querySelectorAll("#fx-items-body tr").forEach(function (tr) {
        const qte = parseFloat(tr.querySelector(".fx-item-qte").value) || 0;
        const prix = parseFloat(tr.querySelector(".fx-item-prix").value) || 0;
        const lineTotal = qte * prix;
        tr.querySelector(".fx-item-total").textContent = lineTotal.toLocaleString("fr-FR");
        total += lineTotal;
    });

    const acompte = parseFloat(acompteInput.value) || 0;
    const reste = Math.max(total - acompte, 0);

    totalDisplay.textContent = total.toLocaleString("fr-FR") + " Ar";
    resteDisplay.textContent = reste.toLocaleString("fr-FR") + " Ar";
    grandTotalDisplay.textContent = total.toLocaleString("fr-FR") + " Ar";
}

// ---- Rassembler toutes les données du formulaire ----

function collectFactureData() {
    const items = [];
    document.querySelectorAll("#fx-items-body tr").forEach(function (tr) {
        const service = tr.querySelector(".fx-item-service").value.trim();
        const qte = parseFloat(tr.querySelector(".fx-item-qte").value) || 0;
        const prix = parseFloat(tr.querySelector(".fx-item-prix").value) || 0;
        if (service) {
            items.push({ service: service, quantite: qte, prixUnitaire: prix, total: qte * prix });
        }
    });

    const total = items.reduce(function (sum, item) { return sum + item.total; }, 0);
    const acompte = parseFloat(acompteInput.value) || 0;

    return {
        numero: document.getElementById("fx-numero").value.trim(),
        date: document.getElementById("fx-date").value,
        client: {
            nom: document.getElementById("fx-client-nom").value.trim(),
            email: document.getElementById("fx-client-email").value.trim(),
            telephone: document.getElementById("fx-client-telephone").value.trim(),
            adresse: document.getElementById("fx-client-adresse").value.trim()
        },
        voyage: {
            destination: document.getElementById("fx-destination").value.trim(),
            participants: document.getElementById("fx-participants").value,
            dateDebut: document.getElementById("fx-date-debut").value,
            dateFin: document.getElementById("fx-date-fin").value,
            programme: document.getElementById("fx-programme").value.trim()
        },
        items: items,
        total: total,
        acompte: acompte,
        reste: Math.max(total - acompte, 0),
        modePaiement: document.getElementById("fx-mode-paiement").value,
        inclus: document.getElementById("fx-inclus").value.split("\n").map(s => s.trim()).filter(Boolean),
        nonInclus: document.getElementById("fx-non-inclus").value.split("\n").map(s => s.trim()).filter(Boolean),
        statut: document.getElementById("fx-statut").value
    };
}

// ---- Enregistrement Firestore (création OU mise à jour) ----

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = collectFactureData();

    if (!data.client.nom) {
        showMessage("⚠️ Le nom du client est requis.", "is-error");
        return;
    }

    if (currentFactureId) {
        // Mode édition : on met à jour le document existant
        updateDoc(doc(db, "factures", currentFactureId), Object.assign({}, data, {
            clientNom: data.client.nom
        }))
        .then(function () {
            showMessage("✅ Facture mise à jour avec succès.", "is-success");
        })
        .catch(function (error) {
            showMessage("⚠️ Erreur lors de la mise à jour.", "is-error");
            console.error(error);
        });
    } else {
        // Mode création : nouvelle facture
        addDoc(collection(db, "factures"), Object.assign({}, data, {
            clientNom: data.client.nom,
            dateCreation: serverTimestamp()
        }))
        .then(function (docRef) {
            showMessage("✅ Facture enregistrée avec succès.", "is-success");
            currentFactureId = docRef.id;
            // Met à jour l'URL sans recharger la page, pour que la facture soit désormais "en édition"
            const newUrl = window.location.pathname + "?id=" + docRef.id;
            window.history.replaceState({}, "", newUrl);
            if (submitBtn) submitBtn.textContent = "💾 Mettre à jour la facture";
        })
        .catch(function (error) {
            showMessage("⚠️ Erreur lors de l'enregistrement.", "is-error");
            console.error(error);
        });
    }
});

function showMessage(text, className) {
    messageBox.textContent = text;
    messageBox.className = className;
}

// ---- Génération PDF ----

document.getElementById("fx-download-pdf").addEventListener("click", function () {
    const data = collectFactureData();
    generatePDF(data);
});

function generatePDF(data) {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const marginX = 18;
    let y = 20;

    // ---- En-tête agence ----
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(AGENCY_INFO.nom, marginX, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    y += 6;
    pdf.text(AGENCY_INFO.adresse, marginX, y);
    y += 5;
    pdf.text(AGENCY_INFO.telephone + "  ·  " + AGENCY_INFO.email, marginX, y);
    y += 5;
    pdf.text(AGENCY_INFO.agrement, marginX, y);
    y += 5;
    pdf.text(AGENCY_INFO.idNumber + "  ·  " + AGENCY_INFO.autorisation, marginX, y);

    // ---- Titre facture ----
    y += 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("FACTURE N° " + data.numero, marginX, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Date : " + formatDateFr(data.date), 150, y);

    // ---- Client ----
    y += 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Client", marginX, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    y += 6;
    pdf.text(data.client.nom, marginX, y);
    if (data.client.telephone) { y += 5; pdf.text(data.client.telephone, marginX, y); }
    if (data.client.email) { y += 5; pdf.text(data.client.email, marginX, y); }
    if (data.client.adresse) { y += 5; pdf.text(data.client.adresse, marginX, y); }

    // ---- Résumé du voyage (cage) ----
    y += 12;
    pdf.setDrawColor(180);
    pdf.rect(marginX, y, 174, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.text("Résumé du voyage", marginX + 4, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const voyageLine1 = "Destination : " + (data.voyage.destination || "—") + "   |   Participants : " + (data.voyage.participants || "—");
    const voyageLine2 = "Dates : " + formatDateFr(data.voyage.dateDebut) + " → " + formatDateFr(data.voyage.dateFin);
    pdf.text(voyageLine1, marginX + 4, y + 14);
    pdf.text(voyageLine2, marginX + 4, y + 20);
    const programmeLines = pdf.splitTextToSize(data.voyage.programme || "", 166);
    pdf.text(programmeLines.slice(0, 2), marginX + 4, y + 26);
    y += 36;

    // ---- Tableau des prestations ----
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Service", marginX, y);
    pdf.text("Qté", 118, y);
    pdf.text("Prix unit. (Ar)", 138, y);
    pdf.text("Total (Ar)", 170, y);
    y += 2;
    pdf.setDrawColor(0);
    pdf.line(marginX, y, 192, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    data.items.forEach(function (item) {
        y += 6;
        pdf.text(item.service, marginX, y);
        pdf.text(String(item.quantite), 118, y);
        pdf.text(item.prixUnitaire.toLocaleString("fr-FR"), 138, y);
        pdf.text(item.total.toLocaleString("fr-FR"), 170, y);
    });

    y += 4;
    pdf.line(marginX, y, 192, y);

    // ---- Totaux ----
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Acompte versé : " + data.acompte.toLocaleString("fr-FR") + " Ar", 120, y);
    y += 6;
    pdf.text("Reste à payer : " + data.reste.toLocaleString("fr-FR") + " Ar", 120, y);
    y += 6;
    pdf.text("Mode de paiement : " + data.modePaiement, 120, y);
    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("TOTAL : " + data.total.toLocaleString("fr-FR") + " Ar", 120, y);

    // ---- Inclus / non inclus ----
    y += 14;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Inclus", marginX, y);
    pdf.text("Non inclus", 105, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const maxLines = Math.max(data.inclus.length, data.nonInclus.length, 1);
    for (let i = 0; i < maxLines; i++) {
        y += 5.5;
        if (data.inclus[i]) pdf.text("• " + data.inclus[i], marginX, y);
        if (data.nonInclus[i]) pdf.text("• " + data.nonInclus[i], 105, y);
    }

    // ---- Statut ----
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Statut : " + data.statut, marginX, y);

    // ---- Signatures ----
    y += 20;
    if (y > 255) { pdf.addPage(); y = 30; }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.text("Signature du client", marginX, y);
    pdf.text("Signature de l'agence", 120, y);
    pdf.rect(marginX, y + 4, 70, 28);
    pdf.rect(120, y + 4, 70, 28);

    pdf.save("Facture_MaTourGuide_" + data.numero + ".pdf");
}

// ---- Formatage date FR ----

function formatDateFr(isoDate) {
    if (!isoDate) return "—";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
}