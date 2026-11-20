/* ===== Configuração: substituir pelos dados reais da Josy ===== */
const CONFIG = {
  whatsapp: "5500000000000", // formato: 55 + DDD + número, só dígitos
  mensagem: "Olá, Josy! Gostaria de agendar uma avaliação.",
  instagram: "https://www.instagram.com/" // trocar pelo link do perfil
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

  // Entrada ao rolar
  const alvos = document.querySelectorAll(".card,.sec-head,.phil>div,.gal>.ph,.about>*,.contact>*,.ftr__in>*");
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
