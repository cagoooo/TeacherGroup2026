(() => {
  const STORAGE_KEY = "teachergroup-usage-v1";
  const SESSION_KEY = "teachergroup-page-view-v1";
  const analyticsConfig = window.SITE_CONFIG?.usageAnalytics || {};
  const remoteEndpoint = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(String(analyticsConfig.endpoint || ""))
    ? String(analyticsConfig.endpoint)
    : "";
  const remoteEnabled = Boolean(analyticsConfig.enabled && remoteEndpoint);
  const eventNames = Object.freeze([
    "page_view",
    "quick_entry_renewal",
    "quick_entry_joining",
    "quick_entry_activities",
    "quick_entry_contact",
    "announcement_workshops",
    "announcement_activities",
    "announcement_membership",
    "print_quick_entry",
    "section_view_quick_entry",
    "section_view_announcements",
    "section_view_activities",
    "section_view_workshops",
    "section_view_renewal",
    "section_view_joining",
    "section_view_membership",
    "section_view_payment",
    "section_view_faq",
    "section_view_contact"
  ]);

  const blankStats = () => ({
    schema: 1,
    scope: "local-device-only",
    createdAt: new Date().toISOString(),
    lastUpdatedAt: null,
    events: Object.fromEntries(eventNames.map((name) => [name, 0]))
  });

  const readStats = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || stored.schema !== 1 || typeof stored.events !== "object") return blankStats();
      return {
        ...blankStats(),
        ...stored,
        events: { ...blankStats().events, ...stored.events }
      };
    } catch {
      return blankStats();
    }
  };

  const writeStats = (stats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // 無痕模式或瀏覽器禁止儲存時，保持網站主要功能可用。
    }
  };

  const sendRemoteEvent = (eventName) => {
    if (!remoteEnabled) return;
    const payload = JSON.stringify({
      schema: Number(analyticsConfig.schema || 1),
      event: eventName,
      siteVersion: String(window.SITE_VERSION || "unknown"),
      ...(typeof globalThis.crypto?.randomUUID === "function" ? { requestId: crypto.randomUUID() } : {})
    });

    try {
      if (typeof navigator.sendBeacon === "function") {
        const accepted = navigator.sendBeacon(
          remoteEndpoint,
          new Blob([payload], { type: "text/plain;charset=UTF-8" })
        );
        if (accepted) return;
      }
      if (typeof fetch === "function") {
        fetch(remoteEndpoint, {
          method: "POST",
          mode: "no-cors",
          keepalive: true,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: payload
        }).catch(() => {});
      }
    } catch {
      // 遠端統計失敗時不影響網站主要功能與本機統計。
    }
  };

  const record = (eventName) => {
    if (!eventNames.includes(eventName)) return;
    const stats = readStats();
    stats.events[eventName] = Number(stats.events[eventName] || 0) + 1;
    stats.lastUpdatedAt = new Date().toISOString();
    writeStats(stats);
    sendRemoteEvent(eventName);
  };

  const snapshot = () => readStats();
  const exportJson = () => JSON.stringify(snapshot(), null, 2);
  const clear = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  window.TeacherGroupUsage = Object.freeze({
    eventNames,
    record,
    snapshot,
    exportJson,
    clear,
    remoteEnabled
  });

  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      record("page_view");
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  } catch {
    record("page_view");
  }
})();
