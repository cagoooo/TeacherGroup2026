function adminPage_() {
  try {
    requireRole_('viewer');
    return HtmlService.createHtmlOutputFromFile('Dashboard').setTitle('石門國小｜宣導網站管理').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (_) {
    return HtmlService.createHtmlOutput('<!doctype html><html lang="zh-Hant"><meta name="viewport" content="width=device-width, initial-scale=1"><title>管理者登入</title><main style="max-width:560px;margin:12vh auto;padding:24px;font:18px/1.8 sans-serif"><h1>請使用已授權的學校帳號</h1><p>目前無法確認您的管理權限。請先登入學校 Google 帳號，再重新開啟管理網址。若仍無法進入，請由擁有者確認帳號權限。</p><p><a target="_top" href="https://accounts.google.com/">登入／切換 Google 帳號</a></p><a href="https://cagoooo.github.io/TeacherGroup2026/" target="_top">回會員服務首頁</a></main></html>');
  }
}
function adminRpc(request) {
  const access = requireRole_('viewer');
  if (!request || typeof request !== 'object') fail_('invalid_request');
  const action = request.action;
  if (action === 'report' || action === 'export') {
    const report = report_(request.start, request.end);
    audit_(access.email, action, report.start + ' ~ ' + report.end);
    return { ...report, access };
  }
  if (action === 'status') {
    const status = { access, health: publicHealth_(), metrics: setting_('METRICS', {}), lastWrite: props_().getProperty('LAST_WRITE'),
      lastBackup: props_().getProperty('LAST_BACKUP'), lastDrill: props_().getProperty('LAST_DRILL'), maintenance: setting_('MAINTENANCE', {}),
      retention: retentionPreview_(), backendVersion: OPS.version, limits: { perMinute: OPS.minuteLimit, perDay: OPS.dayLimit },
      versions: OPS.acceptedVersions };
    if (access.role !== 'viewer') status.backups = rows_(db_().getSheetByName(OPS.backupSheet)).slice(-30).reverse();
    if (access.role === 'owner') { status.roles = setting_('ADMIN_ROLES', {}); status.audit = rows_(db_().getSheetByName(OPS.auditSheet)).slice(-100).reverse(); }
    return status;
  }
  if (action === 'backup') { requireRole_('operator'); return createBackup_(access.email); }
  if (action === 'drill') { requireRole_('operator'); return restoreDrill_(access.email, String(request.id || '')); }
  if (action === 'role') {
    requireRole_('owner');
    const email = String(request.email || '').trim().toLowerCase();
    const role = request.role;
    // 同網域白名單；外部帳號須另設可驗證的登入整合，不能信任前端傳入身分。
    if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]+$/.test(email) || email.split('@')[1] !== access.email.split('@')[1]) fail_('school_domain_required');
    if (!['owner', 'operator', 'viewer', 'disabled'].includes(role)) fail_('invalid_role');
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      const roles = setting_('ADMIN_ROLES', {});
      if (email === access.email && role !== 'owner') fail_('cannot_demote_self');
      if (!roles[email] && Object.keys(roles).length >= 30) fail_('role_limit');
      audit_(access.email, 'role_change', email + ' -> ' + role);
      roles[email] = role; props_().setProperty('ADMIN_ROLES', JSON.stringify(roles));
      return { ok: true };
    } finally { lock.releaseLock(); }
  }
  if (action === 'retention') {
    requireRole_('owner');
    const days = Number(request.days), backupDays = Number(request.backupDays);
    if (!Number.isInteger(days) || days < 30 || days > 3650 || !Number.isInteger(backupDays) || backupDays < 7 || backupDays > 365) fail_('invalid_retention');
    audit_(access.email, 'retention', days + ' / ' + backupDays + ' days; review-only');
    props_().setProperty('RETENTION', JSON.stringify({ days, backupDays, mode: 'review-only' }));
    return retentionPreview_();
  }
  fail_('unknown_action');
}
function report_(start, end) {
  start = start || day_(new Date(Date.now() - 29 * 86400000)); end = end || day_();
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(start) || !validDate(end) || start > end || Date.parse(end) - Date.parse(start) > 366 * 86400000) fail_('invalid_date_range');
  const rows = rows_(getSummarySheet_()).filter(r => r[0] >= start && r[0] <= end && ALLOWED_EVENTS.includes(r[1])).map(r => ({ day: r[0], event: r[1], count: Number(r[2]), updatedAt: r[3] }));
  if (rows.some(r => !Number.isSafeInteger(r.count) || r.count < 0)) fail_('invalid_stored_count');
  const events = {}, days = {};
  rows.forEach(r => { events[r.event] = (events[r.event] || 0) + r.count; days[r.day] = (days[r.day] || 0) + r.count; });
  return { start, end, rows, events, days, total: rows.reduce((n, r) => n + r.count, 0), scope: 'anonymous-events',
    versions: rows_(db_().getSheetByName(OPS.versionSheet)).filter(r => r[0] >= start && r[0] <= end),
    note: '事件次數不等於去重教師人數；不同事件不可相加當作訪客數。早期資料含部署測試。' };
}
