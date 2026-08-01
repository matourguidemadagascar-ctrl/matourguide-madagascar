// ==========================================
// MA'TOUR GUIDE MADAGASCAR
// script.js — Homepage + Interactive Map + Trip Planner
// ==========================================


// ==========================================
// 1. HEADER — scrolled state
// ==========================================

window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});


// ==========================================
// 2. HERO SLIDER
// ==========================================

const slides = document.querySelectorAll(".slide");

if (slides.length > 0) {
    let currentSlide = 0;

    function changeSlide() {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
    }

    setInterval(changeSlide, 5000);
}


// ==========================================
// 3. BOOKING SEARCH → WhatsApp
// ==========================================

const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const date = document.getElementById("booking-date").value;
        const guests = document.getElementById("booking-guests").value;
        const destination = document.getElementById("booking-destination").value;
        const tripType = document.getElementById("booking-trip-type").value;

        let message = "Bonjour Ma'Tour Guide Madagascar, je suis intéressé(e) par un voyage à "
            + destination + " (" + tripType + ") pour " + guests;

        if (date) {
            message += ", à partir du " + date;
        }

        message += ". Pouvez-vous m'aider à organiser ce voyage ?";

        const url = "https://wa.me/261342278490?text=" + encodeURIComponent(message);
        window.open(url, "_blank");
    });
}





// ==========================================
// 5. TRIP PLANNER
// ==========================================

const PLANNER_DESTINATIONS = {
    nosybe:      { label: "Nosy Be",          onSite: 3, travel: 2 },
    morondava:   { label: "Morondava",        onSite: 4, travel: 2 },
    saintemarie: { label: "Sainte-Marie",     onSite: 3, travel: 2 },
    diego:       { label: "Diego Suarez",     onSite: 3, travel: 2 },
    toliara:     { label: "Tuléar (Toliara)", onSite: 3, travel: 2 }
};

const PLANNER_EXCURSIONS = {
    nosybe: [
        { id: "nosybe-islands",  label: "Island hopping boat trip", price: 45 },
        { id: "nosybe-snorkel",  label: "Snorkeling excursion",     price: 35 }
    ],
    morondava: [
        { id: "morondava-baobabs", label: "Avenue of the Baobabs at sunset", price: 20 },
        { id: "morondava-tsingy",  label: "Tsingy trek",                     price: 60 }
    ],
    saintemarie: [
        { id: "saintemarie-whales", label: "Whale watching (Jul–Sep)", price: 50 }
    ],
    diego: [
        { id: "diego-redtsingy", label: "Red Tsingy tour",       price: 55 },
        { id: "diego-emerald",   label: "Emerald Sea boat trip", price: 40 }
    ],
    toliara: [
        { id: "toliara-reniala", label: "Reniala Forest walk",   price: 15 },
        { id: "toliara-vezo",    label: "Vezo village & sunset", price: 25 }
    ]
};

const PLANNER_ACCOMMODATION_PRICES = { budget: 25, standard: 55, comfort: 110 };
const PLANNER_TRANSPORT_PRICES     = { shared: 40, private: 90, flights: 240 };
const PLANNER_GUIDE_DAILY_RATE     = 35;
const PLANNER_FEES_RATE            = 0.08;
const PLANNER_STORAGE_KEY          = "matourguide-trip-planner";

const NOSYBE_PACKAGE_PRICE_RESIDENT_AR     = 780000;
const NOSYBE_PACKAGE_PRICE_NONRESIDENT_EUR = 199.99;
const NOSYBE_PACKAGE_DURATION_DAYS         = 5;

const NOSYBE_ISLAND_PACKAGE_ITEMS = [
    { label: "Nosy Iranja", img: "images/nosybe/nosy-iranja.jpg" },
    { label: "Nosy Komba", img: "images/nosybe/nosy-komba.jpg" },
    { label: "Nosy Tanikely", img: "images/nosybe/nosy-tanikely.jpg" },
    { label: "Nosy Sakatia", img: "images/nosybe/nosy-sakatia.jpg" },
    { label: "Parc Lokobe", img: "images/nosybe/parc-lokobe.jpg" },
    { label: "Lemuria Land + distillerie d'ylang-ylang", img: "images/nosybe/lemuria-land.jpg" },
    { label: "Cascade sacrée", img: "images/nosybe/cascade-sacree.jpg" },
    { label: "Arbre sacré", img: "images/nosybe/arbre-sacre.jpg" },
    { label: "Tour de ville de Nosy Be", img: "images/nosybe/tour-de-ville.jpg" },
    { label: "Andilana beach", img: "images/nosybe/andilana-beach.jpg" },
    { label: "Mont Passot", img: "images/montpassot.jpg" }
];

const plannerBox = document.getElementById("planner-box");

if (plannerBox) {

    let plannerCurrentStep = 1;
    const PLANNER_TOTAL_STEPS = 7;

    const destinationsContainer = document.getElementById("planner-destinations");
    const excursionsContainer   = document.getElementById("planner-excursions-list");
    const stepsNav              = document.getElementById("planner-steps-nav");
    const prevBtn               = document.getElementById("planner-prev");
    const nextBtn               = document.getElementById("planner-next");
    const quoteModal            = document.getElementById("quote-modal");
    const quoteSummary          = document.getElementById("quote-summary");

    // ---- Build destination chips ----
    Object.keys(PLANNER_DESTINATIONS).forEach(function (key) {
        const dest = PLANNER_DESTINATIONS[key];
        const chip = document.createElement("label");
        chip.className = "planner-chip";
        chip.innerHTML =
            '<input type="checkbox" class="planner-input" value="' + key + '">' +
            '<span>' + dest.label + '</span>';
        destinationsContainer.appendChild(chip);
    });

    // ---- Helpers ----
    function getSelectedDestinations() {
        return Array.from(document.querySelectorAll(".planner-input:checked")).map(function (el) {
            return el.value;
        });
    }

    function getSelectedExcursions() {
        return Array.from(document.querySelectorAll(".planner-excursion-input:checked")).map(function (el) {
            return {
                id: el.value,
                price: parseFloat(el.dataset.price),
                destination: el.dataset.destination
            };
        });
    }

    function getRadioValue(name) {
        const el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : null;
    }

    function formatPrice(n) {
        return "€" + Math.round(n).toLocaleString("en-US");
    }

    function getEffectiveTravelers() {
        const adults = parseInt(document.getElementById("planner-travelers").value, 10) || 1;

        if (!document.getElementById("planner-has-children").checked) {
            return { adults: adults, units: adults, totalPeople: adults };
        }

        const under2   = parseInt(document.getElementById("planner-children-under2").value, 10) || 0;
        const from2to10 = parseInt(document.getElementById("planner-children-2to10").value, 10) || 0;
        const over11   = parseInt(document.getElementById("planner-children-11plus").value, 10) || 0;

        return {
            adults: adults,
            units: adults + over11 + (from2to10 * 0.5),
            totalPeople: adults + over11 + from2to10 + under2
        };
    }

    // ---- Step navigation ----
    function showStep(step) {
        document.querySelectorAll(".planner-step").forEach(function (el) {
            el.classList.toggle("active", parseInt(el.dataset.step, 10) === step);
        });

        document.querySelectorAll(".step-dot").forEach(function (dot) {
            const n = parseInt(dot.dataset.dot, 10);
            dot.classList.toggle("active", n === step);
            dot.classList.toggle("done", n < step);
        });

        prevBtn.style.visibility = step === 1 ? "hidden" : "visible";
        nextBtn.textContent = step === PLANNER_TOTAL_STEPS ? "Calculate my estimate" : "Next";

        if (step === PLANNER_TOTAL_STEPS) {
            renderExcursions();
        }

        plannerCurrentStep = step;
    }

    prevBtn.addEventListener("click", function () {
        if (plannerCurrentStep > 1) {
            showStep(plannerCurrentStep - 1);
        }
    });

    nextBtn.addEventListener("click", function () {
        if (plannerCurrentStep < PLANNER_TOTAL_STEPS) {
            showStep(plannerCurrentStep + 1);
            return;
        }

        if (packageCheckbox && packageCheckbox.checked) {
            renderPackageEstimate();
        } else {
            computeEstimate();
        }

        document.getElementById("planner-estimate").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    stepsNav.addEventListener("click", function (e) {
        const dot = e.target.closest(".step-dot");
        if (dot) {
            showStep(parseInt(dot.dataset.dot, 10));
        }
    });

    // ---- Destination chip highlight ----
    destinationsContainer.addEventListener("change", function (e) {
        if (e.target.classList.contains("planner-input")) {
            e.target.closest(".planner-chip").classList.toggle("active", e.target.checked);
        }
        updateNosybePackageVisibility();
        updateMorondavaCircuitVisibility();
    });

    // ---- Render excursions ----
    function renderExcursions() {
        updateNosybePackageVisibility();
        updateMorondavaCircuitVisibility();

        const selected = getSelectedDestinations();

        if (selected.length === 0) {
            excursionsContainer.innerHTML = '<p class="planner-note">Select your destinations first to see available excursions.</p>';
            return;
        }

        let html = "";

        selected.forEach(function (key) {
            const dest = PLANNER_DESTINATIONS[key];
            const excursions = PLANNER_EXCURSIONS[key] || [];

            if (excursions.length === 0) return;

            html += '<div class="excursion-group-title">' + dest.label + '</div>';

            excursions.forEach(function (ex) {
                html +=
                    '<label class="excursion-option">' +
                        '<input type="checkbox" class="planner-excursion-input" value="' + ex.id + '" data-price="' + ex.price + '" data-destination="' + key + '">' +
                        '<span class="excursion-option-text">' +
                            '<strong>' + ex.label + '</strong>' +
                            '<span>≈ €' + ex.price + ' / person</span>' +
                        '</span>' +
                    '</label>';
            });
        });

        excursionsContainer.innerHTML = html || '<p class="planner-note">No excursions listed for these destinations yet — ask us directly.</p>';
    }

    // ---- Morondava circuit ----
    const morondavaCircuitDetails = document.getElementById("morondava-circuit-details");

    function updateMorondavaCircuitVisibility() {
        if (!morondavaCircuitDetails) return;
        const selected = getSelectedDestinations();
        morondavaCircuitDetails.classList.toggle("visible", selected.indexOf("morondava") !== -1);
    }

    // ---- Core estimate ----
    function computeEstimate() {
        const destinations = getSelectedDestinations();
        const days = parseInt(document.getElementById("planner-duration").value, 10);
        const travelers = getEffectiveTravelers();
        const accommodationTier = getRadioValue("accommodation") || "standard";
        const transportMode = getRadioValue("transport") || "private";
        const guideSelected = getRadioValue("guide") === "yes";
        const excursions = getSelectedExcursions();

        const result = document.getElementById("planner-result");

        if (destinations.length === 0) {
            result.className = "planner-result warning";
            result.innerHTML = "<strong>Choose at least one destination</strong> to get your estimate.";
            resetEstimateFields();
            return null;
        }

        if (!days || days < 1) {
            result.className = "planner-result warning";
            result.innerHTML = "<strong>Enter your number of days</strong> to check feasibility.";
            resetEstimateFields();
            return null;
        }

        let totalOnSite = 0;
        let totalTravel = 0;

        destinations.forEach(function (key) {
            totalOnSite += PLANNER_DESTINATIONS[key].onSite;
            totalTravel += PLANNER_DESTINATIONS[key].travel;
        });

        const totalNeeded = totalOnSite + totalTravel;
        const diff = days - totalNeeded;
        const numberOfTransfers = destinations.length;
        const nights = Math.max(days - 1, 1);

        const accommodationCost = PLANNER_ACCOMMODATION_PRICES[accommodationTier] * travelers.units * nights;
        const transportCost = PLANNER_TRANSPORT_PRICES[transportMode] * travelers.units * numberOfTransfers;
        const excursionsCost = excursions.reduce(function (sum, ex) {
            return sum + (ex.price * travelers.units);
        }, 0);
        const guideCost = guideSelected ? PLANNER_GUIDE_DAILY_RATE * days : 0;
        const subtotal = accommodationCost + transportCost + excursionsCost + guideCost;
        const feesCost = subtotal * PLANNER_FEES_RATE;
        const total = subtotal + feesCost;

        document.getElementById("est-accommodation").textContent = formatPrice(accommodationCost);
        document.getElementById("est-transport").textContent = formatPrice(transportCost);
        document.getElementById("est-excursions").textContent = formatPrice(excursionsCost);
        document.getElementById("est-guide").textContent = guideSelected ? formatPrice(guideCost) : "Not included";
        document.getElementById("est-fees").textContent = formatPrice(feesCost);
        document.getElementById("est-duration").textContent = totalNeeded + " day(s) recommended";
        document.getElementById("est-transfers").textContent = numberOfTransfers;
        document.getElementById("est-total").textContent = formatPrice(total);

        let verdict, resultClass;

        if (diff >= 2) {
            resultClass = "ok";
            verdict = "<strong>✅ Realistic, with room to spare.</strong> This itinerary needs about " + totalNeeded + " days — you have " + days + ".";
        } else if (diff >= 0) {
            resultClass = "tight";
            verdict = "<strong>✅ Realistic, but tight.</strong> This itinerary needs about " + totalNeeded + " days for the " + days + " you have — expect a fast pace.";
        } else {
            resultClass = "warning";
            verdict = "<strong>⚠️ A bit ambitious.</strong> This itinerary needs about " + totalNeeded + " days, " + Math.abs(diff) + " more than your current trip. Consider removing a destination or adding days.";
        }

        result.className = "planner-result " + resultClass;
        result.innerHTML = verdict + '<p class="planner-note">This is an indicative estimate — <a href="#contact">contact us</a> for a tailor-made itinerary.</p>';

        return {
            destinations: destinations,
            startDate: document.getElementById("planner-start-date").value,
            days: days,
            travelers: travelers.totalPeople,
            accommodationTier: accommodationTier,
            transportMode: transportMode,
            guideSelected: guideSelected,
            excursions: excursions,
            totals: { accommodationCost, transportCost, excursionsCost, guideCost, feesCost, total, totalNeeded, numberOfTransfers }
        };
    }

    function resetEstimateFields() {
        ["est-accommodation", "est-transport", "est-excursions", "est-guide", "est-fees", "est-duration", "est-transfers"].forEach(function (id) {
            document.getElementById(id).textContent = "—";
        });
        document.getElementById("est-total").textContent = "€0";
    }

    // ---- Children toggle ----
    const hasChildrenCheckbox = document.getElementById("planner-has-children");
    const childrenFields = document.getElementById("planner-children-fields");

    hasChildrenCheckbox.addEventListener("change", function () {
        childrenFields.classList.toggle("visible", hasChildrenCheckbox.checked);
        if (packageCheckbox && packageCheckbox.checked) {
            computePackageTotal();
        }
    });

    ["planner-children-under2", "planner-children-2to10", "planner-children-11plus", "planner-travelers"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", function () {
                if (packageCheckbox && packageCheckbox.checked) {
                    computePackageTotal();
                }
            });
        }
    });

    // ---- Nosy Be Package ----
    const packageToggleBox  = document.getElementById("nosybe-package-toggle");
    const packageDetailsBox = document.getElementById("nosybe-package-details");
    const packageCheckbox   = document.getElementById("nosybe-package-check");
    const packagePhotosGrid = document.getElementById("package-photos-grid");

    NOSYBE_ISLAND_PACKAGE_ITEMS.forEach(function (item) {
        const el = document.createElement("div");
        el.className = "package-photo-item";
        el.innerHTML = '<img src="' + item.img + '" alt="' + item.label + '"><span>' + item.label + '</span>';
        packagePhotosGrid.appendChild(el);
    });

    function updateNosybePackageVisibility() {
        const selected = getSelectedDestinations();
        const onlyNosybe = selected.length === 1 && selected[0] === "nosybe";

        packageToggleBox.classList.toggle("visible", onlyNosybe);

        if (!onlyNosybe && packageCheckbox.checked) {
            packageCheckbox.checked = false;
            togglePackageMode(false);
        }
    }

    function togglePackageMode(active) {
        packageDetailsBox.classList.toggle("visible", active);
        if (excursionsContainer) {
            excursionsContainer.style.display = active ? "none" : "block";
        }
        if (active) {
            computePackageTotal();
        }
    }

    packageCheckbox.addEventListener("change", function () {
        togglePackageMode(packageCheckbox.checked);
    });

    document.querySelectorAll('input[name="package-residency"]').forEach(function (radio) {
        radio.addEventListener("change", computePackageTotal);
    });

    function computePackageTotal() {
        const residencyEl = document.querySelector('input[name="package-residency"]:checked');
        if (!residencyEl) return null;

        const residency = residencyEl.value;
        const travelers = getEffectiveTravelers();
        let total, label;

        if (residency === "resident") {
            total = NOSYBE_PACKAGE_PRICE_RESIDENT_AR * travelers.units;
            label = Math.round(total).toLocaleString("en-US") + " Ar";
        } else {
            total = NOSYBE_PACKAGE_PRICE_NONRESIDENT_EUR * travelers.units;
            label = "€" + total.toFixed(2);
        }

        const totalEl = document.getElementById("package-total");
        if (totalEl) {
            totalEl.textContent = "Estimated total: " + label + " (" + travelers.totalPeople + " traveler(s))";
        }

        return { residency: residency, total: total, label: label, travelers: travelers };
    }

    function renderPackageEstimate() {
        const pkg = computePackageTotal();
        if (!pkg) return;

        document.getElementById("est-accommodation").textContent = "Not included";
        document.getElementById("est-transport").textContent = "Included in package";
        document.getElementById("est-excursions").textContent = pkg.label;
        document.getElementById("est-guide").textContent = "Included in package";
        document.getElementById("est-fees").textContent = "—";
        document.getElementById("est-duration").textContent = NOSYBE_PACKAGE_DURATION_DAYS + " days (island excursion)";
        document.getElementById("est-transfers").textContent = "1";
        document.getElementById("est-total").textContent = pkg.label;

        const result = document.getElementById("planner-result");
        result.className = "planner-result ok";
        result.innerHTML = "<strong>✅ Nosy Be island excursion package selected.</strong> " + NOSYBE_PACKAGE_DURATION_DAYS + "-day package — maritime transfers, picnic lunches and land transfers included.";
    }

    // ---- Save / Share ----
    function getPlannerState() {
        return {
            destinations: getSelectedDestinations(),
            startDate: document.getElementById("planner-start-date").value,
            days: document.getElementById("planner-duration").value,
            travelers: document.getElementById("planner-travelers").value,
            hasChildren: hasChildrenCheckbox.checked,
            childrenUnder2: document.getElementById("planner-children-under2").value,
            children2to10: document.getElementById("planner-children-2to10").value,
            children11plus: document.getElementById("planner-children-11plus").value,
            accommodation: getRadioValue("accommodation"),
            transport: getRadioValue("transport"),
            guide: getRadioValue("guide"),
            excursions: getSelectedExcursions().map(function (ex) { return ex.id; }),
            isPackage: packageCheckbox.checked,
            packageResidency: getRadioValue("package-residency")
        };
    }

    function applyPlannerState(state) {
        if (!state) return;

        document.querySelectorAll(".planner-input").forEach(function (input) {
            input.checked = state.destinations.indexOf(input.value) !== -1;
            input.closest(".planner-chip").classList.toggle("active", input.checked);
        });

        if (state.startDate) document.getElementById("planner-start-date").value = state.startDate;
        if (state.days) document.getElementById("planner-duration").value = state.days;
        if (state.travelers) document.getElementById("planner-travelers").value = state.travelers;

        if (state.hasChildren) {
            hasChildrenCheckbox.checked = true;
            childrenFields.classList.add("visible");
            document.getElementById("planner-children-under2").value = state.childrenUnder2 || 0;
            document.getElementById("planner-children-2to10").value = state.children2to10 || 0;
            document.getElementById("planner-children-11plus").value = state.children11plus || 0;
        }

        if (state.accommodation) {
            const el = document.querySelector('input[name="accommodation"][value="' + state.accommodation + '"]');
            if (el) el.checked = true;
        }

        if (state.transport) {
            const el = document.querySelector('input[name="transport"][value="' + state.transport + '"]');
            if (el) el.checked = true;
        }

        if (state.guide) {
            const el = document.querySelector('input[name="guide"][value="' + state.guide + '"]');
            if (el) el.checked = true;
        }

        updateNosybePackageVisibility();
        updateMorondavaCircuitVisibility();
        renderExcursions();

        if (state.excursions && state.excursions.length) {
            state.excursions.forEach(function (id) {
                const el = document.querySelector('.planner-excursion-input[value="' + id + '"]');
                if (el) el.checked = true;
            });
        }

        if (state.isPackage) {
            packageCheckbox.checked = true;
            if (state.packageResidency) {
                const el = document.querySelector('input[name="package-residency"][value="' + state.packageResidency + '"]');
                if (el) el.checked = true;
            }
            togglePackageMode(true);
        }
    }

    document.getElementById("planner-save").addEventListener("click", function () {
        const state = getPlannerState();
        try {
            localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
            document.getElementById("planner-save-note").textContent = "✅ Your itinerary has been saved on this browser.";
        } catch (err) {
            document.getElementById("planner-save-note").textContent = "⚠️ Could not save — your browser may be blocking local storage.";
        }
    });

    document.getElementById("planner-share").addEventListener("click", function () {
        const state = getPlannerState();
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
        const url = window.location.origin + window.location.pathname + "?trip=" + encoded + "#trip-planner";

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                document.getElementById("planner-save-note").textContent = "🔗 Link copied — share it with anyone!";
            }).catch(function () {
                window.prompt("Copy this link:", url);
            });
        } else {
            window.prompt("Copy this link:", url);
        }
    });

    function restoreFromURLOrStorage() {
        const params = new URLSearchParams(window.location.search);
        const tripParam = params.get("trip");

        if (tripParam) {
            try {
                const state = JSON.parse(decodeURIComponent(atob(tripParam)));
                applyPlannerState(state);
                return;
            } catch (err) {}
        }

        try {
            const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
            if (saved) {
                const banner = document.createElement("div");
                banner.className = "planner-restore-banner";
                banner.innerHTML =
                    "<span>You have a saved itinerary on this browser.</span>" +
                    '<button type="button" class="btn btn-outline" id="planner-restore-btn">Restore it</button>';

                plannerBox.parentNode.insertBefore(banner, plannerBox);

                document.getElementById("planner-restore-btn").addEventListener("click", function () {
                    applyPlannerState(JSON.parse(saved));
                    banner.remove();
                });
            }
        } catch (err) {}
    }

    // ---- Quote modal ----
    document.getElementById("planner-quote").addEventListener("click", function () {
        if (packageCheckbox && packageCheckbox.checked) {
            const pkg = computePackageTotal();
            if (!pkg) return;

            quoteSummary.innerHTML =
                "<strong>Request:</strong> Nosy Be island excursion package (" + NOSYBE_PACKAGE_DURATION_DAYS + " days)<br>" +
                "<strong>Pricing:</strong> " + (pkg.residency === "resident" ? "Resident" : "Non-resident") + "<br>" +
                "<strong>Travelers:</strong> " + pkg.travelers.totalPeople + "<br>" +
                "<strong>Estimated total:</strong> " + pkg.label;

            quoteModal.classList.add("open");
            quoteModal.dataset.plannerData = JSON.stringify({ isPackage: true, pkg: pkg });
            return;
        }

        const data = computeEstimate();
        if (!data) {
            document.getElementById("trip-planner").scrollIntoView({ behavior: "smooth" });
            return;
        }

        const destLabels = data.destinations.map(function (key) {
            return PLANNER_DESTINATIONS[key].label;
        }).join(", ");

        const excursionLabels = data.excursions.map(function (ex) {
            const list = PLANNER_EXCURSIONS[ex.destination] || [];
            const found = list.find(function (e) { return e.id === ex.id; });
            return found ? found.label : ex.id;
        }).join(", ") || "None selected";

        quoteSummary.innerHTML =
            "<strong>Destinations:</strong> " + destLabels + "<br>" +
            "<strong>Start date:</strong> " + (data.startDate || "Not specified") + "<br>" +
            "<strong>Duration:</strong> " + data.days + " day(s)<br>" +
            "<strong>Travelers:</strong> " + data.travelers + "<br>" +
            "<strong>Accommodation:</strong> " + data.accommodationTier + "<br>" +
            "<strong>Transport:</strong> " + data.transportMode + "<br>" +
            "<strong>Guide:</strong> " + (data.guideSelected ? "Yes" : "No") + "<br>" +
            "<strong>Excursions:</strong> " + excursionLabels + "<br>" +
            "<strong>Estimated total:</strong> " + formatPrice(data.totals.total);

        quoteModal.classList.add("open");
        quoteModal.dataset.plannerData = JSON.stringify(data);
    });

    document.getElementById("quote-modal-close").addEventListener("click", function () {
        quoteModal.classList.remove("open");
    });

    quoteModal.addEventListener("click", function (e) {
        if (e.target === quoteModal) {
            quoteModal.classList.remove("open");
        }
    });

    document.getElementById("quote-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const stored = JSON.parse(quoteModal.dataset.plannerData || "{}");
        const name = document.getElementById("quote-name").value;
        const email = document.getElementById("quote-email").value;
        const phone = document.getElementById("quote-phone").value;
        const preferences = document.getElementById("quote-preferences").value;

        let message = "Bonjour Ma'Tour Guide Madagascar, je souhaite une proposition personnalisée.\n\n";
        message += "Nom: " + name + "\nEmail: " + email + (phone ? "\nTéléphone: " + phone : "") + "\n\n";

        if (stored.isPackage) {
            message += "Demande: Excursion des îles de Nosy Be uniquement (" + NOSYBE_PACKAGE_DURATION_DAYS + " jours)\n";
            message += "Tarif: " + (stored.pkg.residency === "resident" ? "résident" : "non-résident") + "\n";
            message += "Voyageurs: " + stored.pkg.travelers.totalPeople + "\n";
            message += "Total estimé: " + stored.pkg.label + "\n";
        } else {
            const data = stored;
            const destLabels = (data.destinations || []).map(function (key) {
                return PLANNER_DESTINATIONS[key].label;
            }).join(", ");

            message += "Destinations: " + destLabels + "\n";
            message += "Dates: " + (data.startDate || "à définir") + ", " + data.days + " jours\n";
            message += "Voyageurs: " + data.travelers + "\n";
            message += "Hébergement: " + data.accommodationTier + "\n";
            message += "Transport: " + data.transportMode + "\n";
            message += "Guide: " + (data.guideSelected ? "oui" : "non") + "\n";
            message += "Budget estimé: " + formatPrice(data.totals ? data.totals.total : 0) + "\n";
        }

        if (preferences) {
            message += "Préférences: " + preferences + "\n";
        }

        const url = "https://wa.me/261342278490?text=" + encodeURIComponent(message);
        window.open(url, "_blank");
        quoteModal.classList.remove("open");
    });

    restoreFromURLOrStorage();
    updateMorondavaCircuitVisibility();
    showStep(1);
}