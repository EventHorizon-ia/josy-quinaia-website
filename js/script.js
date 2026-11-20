/* ===== Configuração: substituir pelos dados reais da Josy ===== */
const CONFIG = {
  whatsapp: "5514996103416", // formato: 55 + DDD + número, só dígitos
  mensagem: "Olá, Josy! Gostaria de agendar uma avaliação.",
  instagram: "https://www.instagram.com/drajosyquinaia/"
};

(() => {
  "use strict";

  // Links de WhatsApp e Instagram
  const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensagem)}`;
  document.querySelectorAll(".js-wa").forEach(a => {
    a.href = wa;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-ig").forEach(a => (a.href = CONFIG.instagram));

  // Ano no rodapé
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  // Header: borda ao rolar
  const hdr = document.querySelector(".hdr");
  const onScroll = () => hdr.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Menu mobile
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("menu");
  const setMenu = open => {
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  let navScrollFrame = null;
  let savedScrollBehavior = null;
  const restoreScrollBehavior = () => {
    if (savedScrollBehavior !== null) {
      document.documentElement.style.scrollBehavior = savedScrollBehavior;
      savedScrollBehavior = null;
    }
  };
  const cancelNavScroll = () => {
    if (navScrollFrame !== null) {
      cancelAnimationFrame(navScrollFrame);
      navScrollFrame = null;
    }
    restoreScrollBehavior();
  };

  window.addEventListener("wheel", cancelNavScroll, { passive: true });
  window.addEventListener("touchstart", cancelNavScroll, { passive: true });
  window.addEventListener("keydown", e => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
      cancelNavScroll();
    }
  });

  document.querySelectorAll('.nav a[href^="#"],.ftr nav a[href^="#"],.hero__copy a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;

      event.preventDefault();
      cancelNavScroll();

      const root = document.documentElement;
      const start = window.scrollY;
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const maxScroll = root.scrollHeight - window.innerHeight;
      const end = Math.max(0, Math.min(maxScroll, start + target.getBoundingClientRect().top - offset));
      const distance = end - start;

      if (window.location.hash !== link.hash) {
        window.history.pushState(null, "", link.hash);
      }
      if (Math.abs(distance) < 1) return;

      const duration = Math.min(2800, Math.max(1100, Math.abs(distance) * 0.9));
      const startedAt = performance.now();
      savedScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      const animate = now => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, start + distance * eased);

        if (progress < 1) {
          navScrollFrame = requestAnimationFrame(animate);
        } else {
          navScrollFrame = null;
          restoreScrollBehavior();
        }
      };

      navScrollFrame = requestAnimationFrame(animate);
    });
  });

  // Entrada ao rolar
  const alvos = document.querySelectorAll(".card,.sec-head,.phil>div,.about>*,.contact>*,.ftr__in>*");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((itens) => {
      itens.forEach(i => {
        if (i.isIntersecting) { i.target.classList.add("in"); io.unobserve(i.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(el => {
      el.classList.add("reveal");
      el.style.setProperty("--d", (([...el.parentNode.children].indexOf(el)) % 4) * 0.09 + "s");
      io.observe(el);
    });
  }
})();
