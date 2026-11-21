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

  // Avaliações do Google (carregadas de /api/reviews; a chave fica no servidor)
  const lista = document.getElementById("reviews-list");
  if (lista) {
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, cls, txt) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (txt) n.textContent = txt;
      return n;
    };
    const https = u => typeof u === "string" && u.startsWith("https://");
    const link = (cls, txt, href) => {
      const a = el("a", cls, txt);
      a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
      return a;
    };
    const estrela = (cheia, i) => {
      const s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", "0 0 24 24");
      s.setAttribute("aria-hidden", "true");
      s.setAttribute("class", "star" + (cheia ? " is-on" : ""));
      s.style.setProperty("--i", i);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z");
      s.appendChild(p);
      return s;
    };
    const estrelas = nota => {
      const w = el("div", "review__stars");
      w.setAttribute("role", "img");
      w.setAttribute("aria-label", nota + " de 5 estrelas");
      for (let i = 0; i < 5; i++) w.appendChild(estrela(i < nota, i));
      return w;
    };
    const mensagem = txt => {
      lista.classList.add("is-empty");
      lista.replaceChildren(el("p", "reviews__empty", txt));
    };
    const revelar = cards => {
      if (!("IntersectionObserver" in window)) return;
      const o = new IntersectionObserver(itens => {
        itens.forEach(i => {
          if (i.isIntersecting) { i.target.classList.add("in"); o.unobserve(i.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      cards.forEach((c, i) => {
        c.classList.add("rv");
        c.style.setProperty("--d", (i % 3) * 0.1 + "s");
        o.observe(c);
      });
    };

    const cartao = r => {
      const nota = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
      const card = el("article", "review");

      const avatar = el("div", "review__avatar");
      const inicial = () => { avatar.textContent = r.author.trim().charAt(0).toUpperCase(); };
      if (https(r.photo)) {
        const img = document.createElement("img");
        img.src = r.photo;
        img.alt = "Foto de " + r.author;
        img.width = 60; img.height = 60; img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.addEventListener("error", () => { img.remove(); inicial(); });
        avatar.appendChild(img);
      } else {
        inicial();
      }

      const nome = el("h3", "review__name");
      if (https(r.profileUrl)) nome.appendChild(link(null, r.author, r.profileUrl));
      else nome.textContent = r.author;

      const meta = el("div", "review__meta");
      meta.appendChild(estrelas(nota));
      if (r.when) meta.appendChild(el("span", "review__when", r.when));

      const quem = el("div");
      quem.append(nome, meta);
      const head = el("div", "review__head");
      head.append(avatar, quem);
      card.appendChild(head);
      if (r.text) card.appendChild(el("p", "review__text", r.text));
      return card;
    };

    const resumo = document.getElementById("reviews-summary");
    const desenharResumo = d => {
      if (!resumo || typeof d.rating !== "number") return;
      const total = Number.isInteger(d.total) ? d.total : 0;
      resumo.replaceChildren(
        el("span", "reviews__score", d.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })),
        estrelas(Math.round(d.rating)),
        el("span", "reviews__count", total ? total + (total === 1 ? " avaliação no Google" : " avaliações no Google") : "Avaliações no Google")
      );
      if (https(d.mapsUrl)) resumo.appendChild(link("reviews__link", "Ver no Google", d.mapsUrl));
      resumo.hidden = false;
    };

    mensagem("Carregando avaliações…");
    const ctrl = new AbortController();
    const limite = setTimeout(() => ctrl.abort(), 10000);
    fetch("/api/reviews", { headers: { Accept: "application/json" }, signal: ctrl.signal })
      .then(r => r.json().catch(() => null).then(corpo => {
        if (!r.ok) {
          // O visitante vê só a mensagem amigável; o motivo técnico fica no console (F12).
          console.warn("[Avaliações] /api/reviews falhou (HTTP " + r.status + ")", corpo || "(sem JSON: a função /api não foi encontrada ou não está rodando)");
          throw new Error("HTTP " + r.status);
        }
        return corpo;
      }))
      .then(d => {
        if (!d || !Array.isArray(d.reviews) || !d.reviews.length) {
          mensagem("Ainda não há avaliações para exibir.");
          return;
        }
        const cards = d.reviews.filter(r => r && r.author).map(cartao);
        lista.classList.remove("is-empty");
        lista.replaceChildren(...cards);
        desenharResumo(d);
        revelar(cards);
      })
      .catch(e => {
        if (!/^HTTP /.test(e && e.message)) console.warn("[Avaliações] Não foi possível chamar /api/reviews:", e);
        mensagem("Não foi possível carregar as avaliações agora. Tente novamente mais tarde.");
      })
      .finally(() => clearTimeout(limite));
  }

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
