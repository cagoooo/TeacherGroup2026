(() => {
  const config = window.SITE_CONFIG;

  if (!config) {
    console.error("SITE_CONFIG is unavailable.");
    return;
  }

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const safeHref = (value) => {
    const href = String(value ?? "");
    return /^(https?:|mailto:|#)/i.test(href) ? escapeHtml(href) : "#";
  };

  const safeAsset = (value) => {
    const asset = String(value ?? "");
    return /^assets\/[a-z0-9._/-]+$/i.test(asset) ? escapeHtml(asset) : "assets/favicon.svg";
  };

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

  const renderActivitySchedule = () => {
    const target = document.querySelector('[data-render-list="activity-schedule"]');
    if (!target || !Array.isArray(config.activitySchedule)) return;
    target.innerHTML = config.activitySchedule.map((item) => `
      <li><time datetime="${escapeHtml(item.datetime)}">${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></div></li>
    `).join("");
  };

  const renderActivityReminders = () => {
    const target = document.querySelector('[data-render-list="activity-reminders"]');
    if (!target || !Array.isArray(config.activityReminders)) return;
    target.innerHTML = config.activityReminders.map((item) => {
      if (item.emailKey) {
        const email = config[item.emailKey];
        return `<li><i class="bi bi-check2" aria-hidden="true"></i><span>${escapeHtml(item.textBefore)} <strong>${escapeHtml(config[item.deadlineKey])}</strong> ${escapeHtml(item.textAfter)} <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>${escapeHtml(item.textEnd)}</span></li>`;
      }
      return `<li><i class="bi bi-check2" aria-hidden="true"></i><span>${escapeHtml(item.text)}</span></li>`;
    }).join("");
  };

  const renderWorkshops = () => {
    const target = document.querySelector('[data-render-list="workshops"]');
    if (!target || !Array.isArray(config.workshops)) return;

    target.innerHTML = config.workshops.map((workshop) => {
      const registration = workshop.registrationMode === "form"
        ? `<a class="button button-primary" href="${safeHref(workshop.registrationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workshop.registrationLabel)} <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>`
        : `<div class="workshop-course-code"><span>研習系統課程編號</span><strong>${escapeHtml(workshop.courseCode)}</strong></div>`;

      return `
        <article class="workshop-card ${escapeHtml(workshop.cardClass)}">
          <header class="workshop-card-header">
            <div class="workshop-date" aria-label="${escapeHtml(workshop.ariaDate)}">
              <span>${escapeHtml(workshop.month)}</span><strong>${escapeHtml(workshop.day)}</strong><small>${escapeHtml(workshop.weekday)}</small>
            </div>
            <div>
              <p class="workshop-tag">${escapeHtml(workshop.tag)}</p>
              <h3>${escapeHtml(workshop.title)}</h3>
            </div>
          </header>
          <p class="workshop-card-intro">${escapeHtml(workshop.intro)}</p>
          <dl class="workshop-meta">
            <div><dt><i class="bi bi-calendar3" aria-hidden="true"></i> 時間</dt><dd><time datetime="${escapeHtml(workshop.datetime)}">${escapeHtml(workshop.time)}</time></dd></div>
            <div><dt><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> 地點</dt><dd>${escapeHtml(workshop.venue)}</dd></div>
            <div><dt><i class="bi bi-${workshop.audienceLabel === "對象" ? "person-check-fill" : "people-fill"}" aria-hidden="true"></i> ${escapeHtml(workshop.audienceLabel)}</dt><dd>${escapeHtml(workshop.audience)}</dd></div>
            <div><dt><i class="bi bi-clock-history" aria-hidden="true"></i> 時數</dt><dd><strong>${escapeHtml(workshop.hours)}</strong></dd></div>
          </dl>
          <div class="workshop-card-footer">
            ${registration}
            <p class="workshop-registration-note"><i class="bi bi-alarm-fill" aria-hidden="true"></i><span><strong>${escapeHtml(workshop.registrationWindow)}</strong> ${escapeHtml(workshop.registrationNote)}</span></p>
          </div>
        </article>
      `;
    }).join("");
  };

  const renderQuickEntries = () => {
    const target = document.querySelector('[data-render-list="quick-entries"]');
    if (!target || !Array.isArray(config.quickEntries)) return;
    target.innerHTML = config.quickEntries.map((entry) => `
      <article class="quick-entry-card quick-entry-card-${escapeHtml(entry.tone)}">
        <a class="quick-entry-link" href="${safeHref(entry.href)}" data-usage-event="quick_entry_${escapeHtml(entry.id)}">
          <span class="quick-entry-icon" aria-hidden="true"><i class="bi ${escapeHtml(entry.icon)}"></i></span>
          <span class="quick-entry-copy"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.description)}</small></span>
        </a>
        <img class="quick-entry-qr" src="${safeAsset(entry.qrAsset)}" width="176" height="176" alt="掃描後前往${escapeHtml(entry.title)}說明">
      </article>
    `).join("");
  };

  const getAnnouncementState = (announcement, now = new Date()) => {
    const start = new Date(announcement.startsAt);
    const archive = new Date(announcement.archiveAt);
    if (now < start) return { key: "upcoming", label: "即將開始" };
    if (now >= archive) return { key: "archived", label: "已封存" };
    return { key: "active", label: announcement.pinned ? "置頂・進行中" : "進行中" };
  };

  const sortAnnouncements = (items) => [...items].sort((left, right) => {
    const stateRank = { active: 0, upcoming: 1, archived: 2 };
    const rankDifference = stateRank[left.state.key] - stateRank[right.state.key];
    if (rankDifference) return rankDifference;
    if (left.item.pinned !== right.item.pinned) return left.item.pinned ? -1 : 1;
    return (right.item.priority ?? 0) - (left.item.priority ?? 0);
  });

  const renderAnnouncements = () => {
    const target = document.querySelector('[data-render-list="announcements"]');
    if (!target || !Array.isArray(config.announcements)) return;

    const items = sortAnnouncements(config.announcements.map((item) => ({
      item,
      state: getAnnouncementState(item)
    })));

    target.innerHTML = items.map(({ item, state }) => `
      <article class="announcement-card ${item.pinned ? "announcement-card-pinned" : ""} ${state.key === "archived" ? "announcement-card-archived" : ""}" data-announcement-state="${state.key}">
        <div class="announcement-card-top"><span class="announcement-status">${escapeHtml(state.label)}</span><span>${escapeHtml(item.kind)}</span></div>
        <h3><a href="${safeHref(item.href)}" data-usage-event="announcement_${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></h3>
        <p>${escapeHtml(item.summary)}</p>
        <small>${escapeHtml(item.dateLabel)}</small>
      </article>
    `).join("");

    const empty = document.querySelector(".announcement-empty");
    if (empty) {
      const archivedCount = items.filter(({ state }) => state.key === "archived").length;
      empty.hidden = archivedCount > 0;
      empty.textContent = archivedCount > 0 ? "已封存公告仍保留在上方供查閱。" : "目前沒有已封存的公告。";
    }
  };

  const renderAnnouncementStrip = () => {
    const target = document.querySelector('[data-render-list="announcement-strip"]');
    if (!target || !Array.isArray(config.announcements)) return;
    const active = sortAnnouncements(config.announcements.map((item) => ({
      item,
      state: getAnnouncementState(item)
    }))).find(({ state }) => state.key !== "archived");
    if (!active) return;
    target.innerHTML = `
      <span><i class="bi bi-megaphone-fill" aria-hidden="true"></i> 最新公告｜${escapeHtml(active.item.title)}</span>
      <a href="${safeHref(active.item.href)}" data-usage-event="announcement_${escapeHtml(active.item.id)}">查看公告 <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
    `;
  };

  const bindUsageEvents = () => {
    document.querySelectorAll("[data-usage-event]").forEach((element) => {
      element.addEventListener("click", () => {
        window.TeacherGroupUsage?.record(element.dataset.usageEvent);
      });
    });
  };

  renderActivitySchedule();
  renderActivityReminders();
  renderWorkshops();
  renderQuickEntries();
  renderAnnouncements();
  renderAnnouncementStrip();
  bindUsageEvents();

  document.querySelector("[data-print-quick-entry]")?.addEventListener("click", () => {
    window.TeacherGroupUsage?.record("print_quick_entry");
    window.print();
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
