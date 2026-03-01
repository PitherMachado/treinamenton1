
(function(){
  const deck = document.getElementById("deck");
  const slides = Array.from(deck.querySelectorAll(".slide"));
  const dots = document.getElementById("dots");
  const bar = document.getElementById("progressBar");

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function currentIndex(){
    const top = deck.scrollTop;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetTop - top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function goTo(i){
    i = clamp(i, 0, slides.length - 1);
    slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Dots
  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.title = s.dataset.title ? `${i+1}. ${s.dataset.title}` : `Slide ${i+1}`;
    b.addEventListener("click", () => goTo(i));
    dots.appendChild(b);
  });

  function refreshUI(){
    const i = currentIndex();
    const pct = (i) / Math.max(1, (slides.length - 1));
    bar.style.transform = `scaleX(${pct})`;
    Array.from(dots.children).forEach((d, idx) => d.classList.toggle("is-active", idx === i));
  }

  // next/back handlers
  deck.addEventListener("click", (e) => {
    const t = e.target.closest("[data-next],[data-prev],[data-go]");
    if (!t) return;

    const i = currentIndex();
    if (t.hasAttribute("data-next")) return goTo(i + 1);
    if (t.hasAttribute("data-prev")) return goTo(i - 1);
    if (t.hasAttribute("data-go")) return goTo(parseInt(t.getAttribute("data-go"), 10));
  });

  // keyboard
  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    const i = currentIndex();
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); goTo(i + 1); }
    if (e.key === "ArrowLeft"  || e.key === "PageUp") { e.preventDefault(); goTo(i - 1); }
    if (e.key.toLowerCase() === "home") { e.preventDefault(); goTo(0); }
    if (e.key.toLowerCase() === "end")  { e.preventDefault(); goTo(slides.length - 1); }
  });

  // overview mode (zoom out)
  const state = { overview:false };
  function toggleOverview(){
    state.overview = !state.overview;
    document.body.classList.toggle("is-overview", state.overview);
    refreshUI();
  }

  deck.addEventListener("scroll", () => requestAnimationFrame(refreshUI));
  window.addEventListener("resize", () => requestAnimationFrame(refreshUI));
  refreshUI();

  window.DeckUI = { goTo, toggleOverview };

  // Intersection observer para animar entrada do slide
const obs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) en.target.classList.add("is-visible");
  });
},{ root: deck, threshold: 0.35 });

slides.forEach(s => obs.observe(s));
})();
