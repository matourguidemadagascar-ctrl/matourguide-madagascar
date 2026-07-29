// ==========================================
// MA'TOUR GUIDE MADAGASCAR
// JAVASCRIPT VERSION 0.4.1
// ==========================================



// ==========================================
// NAVIGATION DYNAMIQUE
// Change le menu au défilement
// ==========================================


window.addEventListener("scroll", function () {


    const navbar = document.getElementById("navbar");


    if(navbar){


        if(window.scrollY > 50){


            navbar.classList.add("scrolled");


        }else{


            navbar.classList.remove("scrolled");


        }


    }


});






// ==========================================
// HERO IMAGE SLIDER
// Changement automatique des images
// ==========================================



const slides = document.querySelectorAll(".slide");



if(slides.length > 0){


    let currentSlide = 0;



    function changeSlide(){


        // Retirer l'image actuelle

        slides[currentSlide].classList.remove("active");



        // Passer à l'image suivante

        currentSlide++;




        // Revenir à la première image

        if(currentSlide >= slides.length){


            currentSlide = 0;


        }




        // Afficher la nouvelle image

        slides[currentSlide].classList.add("active");



    }



    // Changement toutes les 5 secondes

    setInterval(changeSlide,5000);



}



// ==========================================
// BOOKING SEARCH
// Le formulaire n'a pas de backend : on
// prépare un message WhatsApp pré-rempli avec
// les critères choisis, comme le reste du site.
// ==========================================


const bookingForm = document.getElementById("booking-form");


if(bookingForm){


    bookingForm.addEventListener("submit", function(e){


        e.preventDefault();


        const date = document.getElementById("booking-date").value;

        const guests = document.getElementById("booking-guests").value;

        const destination = document.getElementById("booking-destination").value;

        const tripType = document.getElementById("booking-trip-type").value;


        let message = "Bonjour Ma'Tour Guide Madagascar, je suis intéressé(e) par un voyage à "
            + destination + " (" + tripType + ") pour " + guests;


        if(date){

            message += ", à partir du " + date;

        }


        message += ". Pouvez-vous m'aider à organiser ce voyage ?";


        const url = "https://wa.me/261342278490?text=" + encodeURIComponent(message);


        window.open(url, "_blank");


    });


}



// ==========================================
// TRIP PLANNER
// Le client choisit ses destinations + son
// nombre de jours, on estime si c'est jouable.
//
// Ces durées sont indicatives (jours sur place
// + jours de transfert aller-retour depuis Tana
// pour chaque région) — à ajuster si besoin pour
// coller à vos itinéraires réels.
// ==========================================


const PLANNER_DESTINATIONS = {

    nosybe:      { label: "Nosy Be",          onSite: 3, travel: 2 },
    morondava:   { label: "Morondava",        onSite: 4, travel: 2 },
    saintemarie: { label: "Sainte-Marie",     onSite: 3, travel: 2 },
    diego:       { label: "Diego Suarez",     onSite: 3, travel: 2 },
    toliara:     { label: "Tuléar (Toliara)", onSite: 3, travel: 2 }

};


// Mettre en évidence les destinations sélectionnées (style "chip")

document.querySelectorAll(".planner-input").forEach(function(input){

    input.addEventListener("change", function(){

        input.closest(".planner-chip").classList.toggle("active", input.checked);

    });

});


const plannerButton = document.getElementById("planner-check");


if(plannerButton){


    plannerButton.addEventListener("click", function(){


        const result = document.getElementById("planner-result");

        const checked = Array.from(document.querySelectorAll(".planner-input:checked")).map(function(el){ return el.value; });

        const daysInput = document.getElementById("planner-duration");

        const days = parseInt(daysInput.value, 10);


        // Aucune destination cochée

        if(checked.length === 0){

            result.className = "planner-result warning";

            result.innerHTML = "<strong>Choisissez au moins une destination</strong> pour que nous puissions estimer votre itinéraire.";

            return;

        }


        // Pas de nombre de jours valide

        if(!days || days < 1){

            result.className = "planner-result warning";

            result.innerHTML = "<strong>Indiquez votre nombre de jours</strong> pour que nous puissions vérifier la faisabilité.";

            return;

        }


        let totalOnSite = 0;

        let totalTravel = 0;


        const lines = checked.map(function(key){

            const dest = PLANNER_DESTINATIONS[key];

            totalOnSite += dest.onSite;

            totalTravel += dest.travel;

            return "<li>" + dest.label + " — " + dest.onSite + " jour(s) sur place + " + dest.travel + " jour(s) de transfert</li>";

        });


        const totalNeeded = totalOnSite + totalTravel;

        const diff = days - totalNeeded;


        let verdict;

        let resultClass;


        if(diff >= 2){

            resultClass = "ok";

            verdict = "<strong>✅ Réalisable, avec de la marge.</strong> Cet itinéraire demande environ " + totalNeeded + " jours — vous en avez " + days + ".";

        }else if(diff >= 0){

            resultClass = "tight";

            verdict = "<strong>✅ Réalisable, mais serré.</strong> Cet itinéraire demande environ " + totalNeeded + " jours pour les " + days + " dont vous disposez — prévoyez un rythme soutenu.";

        }else{

            resultClass = "warning";

            verdict = "<strong>⚠️ Un peu juste.</strong> Cet itinéraire demande environ " + totalNeeded + " jours, soit " + Math.abs(diff) + " de plus que votre séjour actuel. Retirez une destination ou prolongez votre voyage.";

        }


        result.className = "planner-result " + resultClass;

        result.innerHTML =
            verdict +
            "<ul>" + lines.join("") + "</ul>" +
            "<p class=\"planner-note\">Ces durées sont indicatives — <a href=\"#contact\">contactez-nous</a> pour un itinéraire sur mesure.</p>";


    });


}




// ==========================================
// EAST COAST — CHAPITRES RÉVÉLÉS AU SCROLL
// N'a d'effet que sur east-coast.html, où les
// éléments .chapter-panel existent.
// ==========================================


const chapterPanels = document.querySelectorAll(".chapter-panel");


if(chapterPanels.length > 0){


    const chapterObserver = new IntersectionObserver(function(entries){

        entries.forEach(function(entry){

            if(entry.isIntersecting){

                entry.target.classList.add("is-visible");

            }

        });

    }, { threshold: 0.25 });


    chapterPanels.forEach(function(panel){

        chapterObserver.observe(panel);

    });


}



// ==========================================
// PREPARATION FUTURE
// Animations, réservation, formulaire...
// ==========================================