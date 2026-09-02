(() => {
  const config = window.SITE_CONFIG;

  if (!config) {
    console.error("SITE_CONFIG is unavailable.");
    return;
  }

  document.querySelectorAll("[data-value]").forEach((element) => {
    const value = config[element.dataset.value];
    if (value !== undefined) element.textContent = value;
  });

  document.querySelectorAll("[data-href]").forEach((element) => {
    const value = config[element.dataset.href];
    if (value) element.href = value;
  });

  document.querySelectorAll("[data-tel]").forEach((element) => {
    const value = config[element.dataset.tel];
    if (value) element.href = `tel:${value.replace(/[^+\d]/g, "")}`;
  });

  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");

  if (button && nav) {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        button.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.removeAttribute("aria-current"));
          const active = document.querySelector(`.site-nav a[href="#${entry.target.id}"]`);
          active?.setAttribute("aria-current", "page");
        });
      },
      { rootMargin: "-34% 0px -58% 0px", threshold: 0.01 }
    );
    sections.forEach((section) => observer.observe(section));
  }
})();
