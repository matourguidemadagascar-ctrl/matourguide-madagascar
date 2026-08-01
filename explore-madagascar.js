// ==========================================
// EXPLORE MADAGASCAR — carte SVG interactive
// Module autonome, indépendant de script.js
// ==========================================

(function () {

    const EXPLORE_MD_DESTINATIONS = {
        diego: {
            title: "Diego Suarez",
            image: "images/diegosuarez.jpg",
            description: "Mer d'Émeraude, Montagne d'Ambre et Tsingy Rouge, à la pointe nord de l'île.",
            highlights: ["Mer d'Émeraude", "Montagne d'Ambre", "Tsingy Rouge", "Trois Baies"],
            days: "4–5 jours conseillés",
            link: "diego-suarez.html"
        },
        nosybe: {
            title: "Nosy Be",
            image: "images/nosybe.jpg",
            description: "L'île aux parfums : lagons turquoise, îlots secrets et vie marine exceptionnelle.",
            highlights: ["Nosy Iranja", "Nosy Komba", "Snorkeling", "Mont Passot"],
            days: "3–4 jours conseillés",
            link: "nosybe.html"
        },
        eastcoast: {
            title: "East Coast & Sainte-Marie",
            image: "images/saintemarie.jpg",
            description: "Forêts tropicales, baleines à bosse et ambiance créole le long de la côte est.",
            highlights: ["Andasibe", "Baleines (juil.–sept.)", "Île Sainte-Marie", "Canal des Pangalanes"],
            days: "5–6 jours conseillés",
            link: "east-coast.html"
        },
        morondava: {
            title: "Morondava",
            image: "images/morondava.jpg",
            description: "L'Allée des Baobabs, la forêt de Kirindy et les Tsingy de Bemaraha classés UNESCO.",
            highlights: ["Allée des Baobabs", "Tsingy de Bemaraha", "Forêt de Kirindy", "Gorges de Manambolo"],
            days: "4 jours conseillés",
            link: "morondava.html"
        },
        tulear: {
            title: "Tuléar (Toliara)",
            image: "images/toliara.jpg",
            description: "Canyons du Parc Isalo, forêt épineuse de Reniala et côte Vezo turquoise.",
            highlights: ["Parc National Isalo", "Anakao & Nosy Ve", "Réserve Anja", "Réserve Reniala"],
            days: "3–5 jours conseillés",
            link: "tulear.html"
        }
    };

    function initExploreMadagascar() {

        const stage       = document.getElementById("exploreMdStage");
        const points       = document.querySelectorAll(".explore-md-point");
        const tooltip      = document.getElementById("exploreMdTooltip");
        const connections  = document.getElementById("exploreMdConnections");
        const panel        = document.getElementById("exploreMdPanel");
        const closeBtn     = document.getElementById("exploreMdClose");

        if (!stage || points.length === 0) return;

        let activeId = null;

        // ---- Lignes de connexion entre points ----
        function buildConnections(fromId) {
            connections.innerHTML = "";
            const from = document.querySelector('.explore-md-point[data-id="' + fromId + '"]');
            if (!from) return;

            const fx = from.dataset.x;
            const fy = from.dataset.y;

            points.forEach(function (p) {
                if (p.dataset.id === fromId) return;
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", fx);
                line.setAttribute("y1", fy);
                line.setAttribute("x2", p.dataset.x);
                line.setAttribute("y2", p.dataset.y);
                requestAnimationFrame(function () { line.classList.add("is-visible"); });
                connections.appendChild(line);
            });
        }

        function clearConnections() {
            connections.innerHTML = "";
        }

        // ---- Tooltip (hover / focus) ----
        function showTooltip(pointEl) {
            const data = EXPLORE_MD_DESTINATIONS[pointEl.dataset.id];
            if (!data) return;

            tooltip.querySelector(".tooltip-title").textContent = data.title;
            tooltip.querySelector(".tooltip-desc").textContent = data.description;
            tooltip.querySelector(".tooltip-days").textContent = data.days;

            const stageRect = stage.getBoundingClientRect();
            const svg = pointEl.closest("svg");
            const pt = svg.createSVGPoint();
            pt.x = pointEl.dataset.x;
            pt.y = pointEl.dataset.y;
            const screenPt = pt.matrixTransform(svg.getScreenCTM());

            const left = screenPt.x - stageRect.left + 18;
            const top = screenPt.y - stageRect.top - 10;

            tooltip.style.left = left + "px";
            tooltip.style.top = top + "px";
            tooltip.classList.add("is-visible");

            buildConnections(pointEl.dataset.id);
        }

        function hideTooltip() {
            tooltip.classList.remove("is-visible");
            if (!activeId) clearConnections();
        }

        // ---- Panneau d'information (click) ----
        function openPanel(id) {
            const data = EXPLORE_MD_DESTINATIONS[id];
            if (!data) return;

            document.getElementById("exploreMdImg").src = data.image;
            document.getElementById("exploreMdImg").alt = data.title;
            document.getElementById("exploreMdTitle").textContent = data.title;
            document.getElementById("exploreMdDesc").textContent = data.description;
            document.getElementById("exploreMdDays").textContent = data.days;
            document.getElementById("exploreMdLink").href = data.link;

            const list = document.getElementById("exploreMdHighlights");
            list.innerHTML = data.highlights.map(function (h) {
                return "<li>" + h + "</li>";
            }).join("");

            points.forEach(function (p) {
                p.classList.toggle("is-active", p.dataset.id === id);
            });

            stage.classList.add("has-active");
            panel.classList.add("is-open");
            buildConnections(id);
            activeId = id;
        }

        function closePanel() {
            panel.classList.remove("is-open");
            stage.classList.remove("has-active");
            points.forEach(function (p) { p.classList.remove("is-active"); });
            clearConnections();
            activeId = null;
        }

        // ---- Événements ----
        points.forEach(function (point) {
            point.addEventListener("mouseenter", function () { showTooltip(point); });
            point.addEventListener("mouseleave", hideTooltip);
            point.addEventListener("focus", function () { showTooltip(point); });
            point.addEventListener("blur", hideTooltip);

            point.addEventListener("click", function (e) {
                e.stopPropagation();
                if (activeId === point.dataset.id) {
                    closePanel();
                } else {
                    openPanel(point.dataset.id);
                }
            });

            point.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    point.click();
                }
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener("click", closePanel);
        }

        document.addEventListener("click", function (e) {
            if (!panel.classList.contains("is-open")) return;
            if (panel.contains(e.target) || e.target.closest(".explore-md-point")) return;
            closePanel();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && activeId) {
                closePanel();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initExploreMadagascar);
    } else {
        initExploreMadagascar();
    }

})();