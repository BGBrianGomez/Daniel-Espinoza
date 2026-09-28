const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#main-links");

if (menuButton && menu) {
  const closeMenu = () => {
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  document.body.classList.add("js-motion");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    revealObserver.observe(element);
  });
}

let scrollFrame = 0;
window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    document.documentElement.style.setProperty("--scroll-progress", String(progress));
    scrollFrame = 0;
  });
}, { passive: true });

const hero = document.querySelector(".hero");
if (hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  let pointerFrame = 0;
  hero.addEventListener("pointermove", (event) => {
    if (pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      hero.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
      hero.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
      pointerFrame = 0;
    });
  }, { passive: true });
}

// When a video link is available, render its player inline in this lesson card.
// Set data-video-src on the corresponding [data-video-slot] element.
function getInlineVideoUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null;
    }
    return url.href;
  } catch {
    return null;
  }
}

document.querySelectorAll("[data-video-slot][data-video-src]").forEach((slot) => {
  const embedUrl = getInlineVideoUrl(slot.dataset.videoSrc);
  if (!embedUrl) return;

  const iframe = document.createElement("iframe");
  iframe.className = "video-player";
  iframe.src = embedUrl;
  iframe.title = slot.dataset.videoTitle || slot.querySelector("strong")?.textContent || "Video de la academia";
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  slot.insertBefore(iframe, slot.firstChild);
  slot.classList.add("has-video-player");
});
