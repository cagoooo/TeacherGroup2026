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

  const registrationStates = Object.freeze({
    upcoming: Object.freeze({ label: "尚未開放", description: "報名尚未開始，請於開放後依下方方式辦理。", icon: "bi-hourglass-split" }),
    open: Object.freeze({ label: "報名中", description: "目前可依下方方式報名，額滿可能提前截止。", icon: "bi-check-circle-fill" }),
    closed: Object.freeze({ label: "報名已截止", description: "已超過報名期限，請留意主辦單位後續公告。", icon: "bi-lock-fill" }),
    ended: Object.freeze({ label: "活動已結束", description: "本場活動已結束，請查看其他最新宣導。", icon: "bi-check2-circle" })
  });

  const parseTimestamp = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getRegistrationState = (item, now = new Date()) => {
    const startsAt = parseTimestamp(item.registrationStartsAt);
    const endsAt = parseTimestamp(item.registrationEndsAt);
    const eventEndsAt = parseTimestamp(item.eventEndsAt);
    if (!startsAt || !endsAt || startsAt >= endsAt) return { key: "closed", ...registrationStates.closed };
    if (eventEndsAt && now >= eventEndsAt) return { key: "ended", ...registrationStates.ended };
    if (now < startsAt) return { key: "upcoming", ...registrationStates.upcoming };
    if (now < endsAt) return { key: "open", ...registrationStates.open };
    return { key: "closed", ...registrationStates.closed };
  };

  const statusMarkup = (className, state) => `
    <div class="${className} registration-status registration-status-${state.key}" data-registration-state="${state.key}" aria-live="polite" aria-atomic="true">
      <i class="bi ${state.icon}" aria-hidden="true"></i>
      <span><strong>${state.label}</strong><small>${state.description}</small></span>
    </div>
  `;

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
      const state = getRegistrationState(workshop);
      const registration = workshop.registrationMode === "form"
        ? state.key === "open"
          ? `<a class="button button-primary" href="${safeHref(workshop.registrationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workshop.registrationLabel)} <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>`
          : `<span class="button button-disabled" aria-disabled="true">${state.label}</span>`
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
            ${statusMarkup("workshop-registration-status", state)}
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

  const renderActivityRegistrationState = () => {
    const target = document.querySelector("[data-activity-registration-status]");
    if (!target) return;
    const state = getRegistrationState({
      registrationStartsAt: config.activityRegistrationStartsAt,
      registrationEndsAt: config.activityRegistrationEndsAt,
      eventEndsAt: config.activityEventEndsAt
    });
    target.className = `activity-registration-status registration-status registration-status-${state.key}`;
    target.dataset.registrationState = state.key;
    target.innerHTML = `
      <i class="bi ${state.icon}" aria-hidden="true"></i>
      <span><strong>${state.label}</strong><small>${state.description}</small></span>
    `;

    const action = document.querySelector("[data-activity-registration-action]");
    if (!action) return;
    const isOpen = state.key === "open";
    action.classList.toggle("button-disabled", !isOpen);
    action.classList.toggle("button-primary", isOpen);
    action.dataset.registrationInactive = String(!isOpen);
    if (isOpen) {
      action.href = config.activityRegistrationUrl;
      action.target = "_blank";
      action.removeAttribute("aria-disabled");
      action.removeAttribute("tabindex");
      action.innerHTML = "前往活動報名 <i class=\"bi bi-box-arrow-up-right\" aria-hidden=\"true\"></i>";
    } else {
      action.href = "#activities";
      action.removeAttribute("target");
      action.setAttribute("aria-disabled", "true");
      action.setAttribute("tabindex", "-1");
      action.innerHTML = `${state.label} <i class="bi ${state.icon}" aria-hidden="true"></i>`;
    }
  };

  let registrationRefreshTimer = null;
  const scheduleRegistrationRefresh = () => {
    if (registrationRefreshTimer) window.clearTimeout(registrationRefreshTimer);
    const now = Date.now();
    const timestamps = [
      ...(config.workshops ?? []).flatMap((workshop) => [workshop.registrationStartsAt, workshop.registrationEndsAt, workshop.eventEndsAt]),
      config.activityRegistrationStartsAt,
      config.activityRegistrationEndsAt,
      config.activityEventEndsAt
    ]
      .map(parseTimestamp)
      .filter((date) => date && date.getTime() > now)
      .map((date) => date.getTime());
    const nextTimestamp = Math.min(...timestamps);
    if (!Number.isFinite(nextTimestamp)) return;
    registrationRefreshTimer = window.setTimeout(() => {
      renderWorkshops();
      renderActivityRegistrationState();
      bindUsageEvents();
      scheduleRegistrationRefresh();
    }, Math.max(1000, nextTimestamp - now + 250));
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
      if (element.dataset.usageBound === "true") return;
      element.dataset.usageBound = "true";
      element.addEventListener("click", () => {
        window.TeacherGroupUsage?.record(element.dataset.usageEvent);
      });
    });
  };

  const bindSectionViewEvents = () => {
    if (!("IntersectionObserver" in window)) return;
    const sectionIds = [
      "quick-entry",
      "announcements",
      "activities",
      "workshops",
      "renewal",
      "joining",
      "membership",
      "payment",
      "faq",
      "contact"
    ];
    const tracked = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || tracked.has(entry.target.id)) return;
        tracked.add(entry.target.id);
        window.TeacherGroupUsage?.record(`section_view_${entry.target.id.replace(/-/g, '_')}`);
      });
    }, { threshold: 0.35 });
    sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => observer.observe(section));
  };

  renderActivitySchedule();
  renderActivityReminders();
  renderWorkshops();
  renderActivityRegistrationState();
  scheduleRegistrationRefresh();
  renderQuickEntries();
  renderAnnouncements();
  renderAnnouncementStrip();
  bindUsageEvents();
  bindSectionViewEvents();

  document.querySelector("[data-print-quick-entry]")?.addEventListener("click", () => {
    window.TeacherGroupUsage?.record("print_quick_entry");
    window.print();
  });

  const button = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");

  if (button && nav) {
    const menuLabel = button.querySelector(".visually-hidden");
    const setMenuState = (isOpen, { returnFocus = false, focusFirstLink = false } = {}) => {
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "關閉選單" : "開啟選單");
      if (menuLabel) menuLabel.textContent = isOpen ? "關閉選單" : "開啟選單";
      nav.classList.toggle("is-open", isOpen);
      if (focusFirstLink) nav.querySelector("a")?.focus();
      if (returnFocus) button.focus();
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      setMenuState(!open, { focusFirstLink: !open });
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setMenuState(false, { returnFocus: true });
      }
    });

    document.addEventListener("click", (event) => {
      if (button.getAttribute("aria-expanded") !== "true") return;
      if (nav.contains(event.target) || button.contains(event.target)) return;
      setMenuState(false);
    });
  }

  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"], .mobile-quick-nav a[href^="#"]')];
  const sections = [...new Set(navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean))];

  const focusHashTarget = (hash = window.location.hash) => {
    if (!hash || hash === "#") return;
    const targetId = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(targetId);
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  };

  window.addEventListener("hashchange", () => focusHashTarget());
  focusHashTarget();

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.removeAttribute("aria-current"));
          navLinks
            .filter((link) => link.getAttribute("href") === `#${entry.target.id}`)
            .forEach((link) => link.setAttribute("aria-current", "page"));
        });
      },
      { rootMargin: "-34% 0px -58% 0px", threshold: 0.01 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  const activityRegistrationAction = document.querySelector("[data-activity-registration-action]");
  activityRegistrationAction?.addEventListener("click", (event) => {
    if (activityRegistrationAction.dataset.registrationInactive === "true") event.preventDefault();
  });

  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    const updateBackToTopVisibility = () => {
      backToTop.hidden = window.scrollY < 520;
    };
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    updateBackToTopVisibility();
  }
})();
