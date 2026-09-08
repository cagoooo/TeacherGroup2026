(() => {
  const STORAGE_KEY = "teachergroup-usage-v1";
  const SESSION_KEY = "teachergroup-page-view-v1";
  const eventNames = Object.freeze([
    "page_view",
    "quick_entry_renewal",
    "quick_entry_joining",
    "quick_entry_activities",
    "quick_entry_contact",
    "announcement_workshops",
    "announcement_activities",
    "announcement_membership",
    "print_quick_entry"
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

  const record = (eventName) => {
    if (!eventNames.includes(eventName)) return;
    const stats = readStats();
    stats.events[eventName] = Number(stats.events[eventName] || 0) + 1;
    stats.lastUpdatedAt = new Date().toISOString();
    writeStats(stats);
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
    clear
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
