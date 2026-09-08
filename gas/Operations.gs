const OPS = Object.freeze({
  version: '2.0.1', retentionDays: 365, backupDays: 30,
  acceptedVersions: ['2026.09.08-3', '2026.09.08-4', '2026.09.08-5'],
  minuteLimit: 120, dayLimit: 20000,
  auditSheet: '管理稽核', versionSheet: '版本統計', backupSheet: '備份索引'
});

function day_(date) { return Utilities.formatDate(date || new Date(), CONFIG.timeZone, 'yyyy-MM-dd'); }
function props_() { return PropertiesService.getScriptProperties(); }
function db_() { return SpreadsheetApp.openById(props_().getProperty(CONFIG.spreadsheetProperty)); }
function setting_(key, fallback) { const value = props_().getProperty(key); return value === null ? fallback : JSON.parse(value); }
function fail_(code) { throw new Error(code); }
function sheet_(name, headers) {
  const db = db_();
  let sheet = db.getSheetByName(name);
  if (!sheet) { sheet = db.insertSheet(name); sheet.appendRow(headers); sheet.setFrozenRows(1); sheet.getRange('A:B').setNumberFormat('@'); }
  return sheet;
}
function rows_(sheet) {
  return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues() : [];
}
function validateEnvelope_(payload) {
  const keys = ['schema', 'event', 'siteVersion', 'requestId'];
  if (Object.keys(payload).some(key => !keys.includes(key)) || payload.schema !== 1 || typeof payload.event !== 'string') fail_('invalid_request');
  if (!OPS.acceptedVersions.includes(payload.siteVersion)) fail_('unsupported_version');
  if (payload.requestId !== undefined && (typeof payload.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.requestId))) fail_('invalid_request');
}
function enforceBudget_() {
  const now = new Date();
  const minute = Utilities.formatDate(now, CONFIG.timeZone, 'yyyy-MM-dd HH:mm');
  const saved = setting_('BUDGET', {});
  const budget = { day: day_(now), minute, daily: saved.day === day_(now) ? saved.daily : 0, count: saved.minute === minute ? saved.count : 0 };
  if (budget.daily >= OPS.dayLimit || budget.count >= OPS.minuteLimit) fail_('rate_limited');
  budget.daily++; budget.count++;
  props_().setProperty('BUDGET', JSON.stringify(budget));
}
function metric_(code) {
  const metrics = setting_('METRICS', {});
  if (metrics.day !== day_()) { Object.keys(metrics).forEach(key => delete metrics[key]); metrics.day = day_(); }
  metrics[code] = Number(metrics[code] || 0) + 1;
  // 僅存固定錯誤分類，不存請求本文、例外堆疊或訪客身分。
  props_().setProperty('METRICS', JSON.stringify(metrics));
}
function incrementVersion_(version) {
  const sheet = sheet_(OPS.versionSheet, ['日期（台灣）', '網站版本', '次數']);
  const data = rows_(sheet);
  const index = data.findIndex(row => row[0] === day_() && row[1] === version);
  if (index >= 0) sheet.getRange(index + 2, 3).setValue(Number(data[index][2]) + 1);
  else sheet.appendRow([day_(), version, 1]);
}
function publicHealth_() {
  let ready = false;
  try {
    const sheet = getSummarySheet_();
    ready = sheet.getRange(1, 1).getDisplayValue() === '日期（台灣）';
  } catch (_) { /* 公開狀態不揭露檔案 ID 或 Google 例外內容。 */ }
  return { ok: ready, service: CONFIG.serviceName, schema: CONFIG.schema, backendVersion: OPS.version,
    mode: 'anonymous-aggregate', writeMethod: 'POST', storage: ready ? 'ready' : 'unavailable' };
}

// 初始化僅限 Google 確認的部署者本人；絕不以 effective user 當作匿名訪客身分。
function requireBootstrapOwner_() {
  const active = Session.getActiveUser().getEmail().toLowerCase();
  const effective = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!active || active !== effective) fail_('forbidden');
  return active;
}
function requireRole_(minimum) {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  const roles = setting_('ADMIN_ROLES', {});
  const role = Object.prototype.hasOwnProperty.call(roles, email) ? roles[email] : '';
  const rank = { viewer: 1, operator: 2, owner: 3 };
  if (!email || !rank[role] || rank[role] < rank[minimum]) fail_('forbidden');
  return { email, role };
}
function audit_(actor, action, detail) {
  sheet_(OPS.auditSheet, ['時間（台灣）', '管理帳號', '動作', '摘要']).appendRow([
    Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss'), actor, action, detail || ''
  ]);
}
function privateFile_(id) {
  const file = DriveApp.getFileById(id);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
  if (file.getSharingAccess() !== DriveApp.Access.PRIVATE) fail_('private_sharing_required');
  return file;
}

function initializeOperations() {
  const owner = requireBootstrapOwner_();
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (!props_().getProperty('ADMIN_ROLES')) props_().setProperty('ADMIN_ROLES', JSON.stringify({ [owner]: 'owner' }));
    requireRole_('owner');
    privateFile_(db_().getId());
    sheet_(OPS.auditSheet, ['時間（台灣）', '管理帳號', '動作', '摘要']);
    sheet_(OPS.backupSheet, ['建立時間', '備份ID', 'SHA256', '資料列數', '狀態']);
    sheet_(OPS.versionSheet, ['日期（台灣）', '網站版本', '次數']);
    if (!props_().getProperty('RETENTION')) props_().setProperty('RETENTION', JSON.stringify({ days: OPS.retentionDays, backupDays: OPS.backupDays, mode: 'review-only' }));
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'dailyMaintenance_')) {
      ScriptApp.newTrigger('dailyMaintenance_').timeBased().everyDays(1).atHour(3).inTimezone(CONFIG.timeZone).create();
    }
    audit_(owner, 'initialize', '每日備份；保存期限僅預覽');
  } finally { lock.releaseLock(); }
  const backup = createBackup_(owner);
  const drill = restoreDrill_(owner, backup.id);
  const result = { ok: true, backendVersion: OPS.version, backup, drill, adminUrl: ScriptApp.getService().getUrl() + '?action=admin' };
  console.log(JSON.stringify(result));
  return result;
}

function snapshot_() {
  const names = [CONFIG.summarySheetName, OPS.versionSheet, OPS.auditSheet];
  return { format: 1, createdAt: new Date().toISOString(), sheets: names.map(name => {
    const sheet = db_().getSheetByName(name);
    return { name, rows: sheet ? sheet.getDataRange().getDisplayValues() : [] };
  }) };
}
function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(value)).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function createBackup_(actor) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    SpreadsheetApp.flush();
    const data = snapshot_();
    const checksum = digest_(data);
    let folderId = props_().getProperty('BACKUP_FOLDER');
    if (!folderId) {
      const folder = DriveApp.createFolder('TeacherGroup2026 私人統計備份');
      folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
      folderId = folder.getId(); props_().setProperty('BACKUP_FOLDER', folderId);
    }
    const file = DriveApp.getFolderById(folderId).createFile('statistics-' + data.createdAt.replace(/[:.]/g, '-') + '.json', '', MimeType.PLAIN_TEXT);
    privateFile_(file.getId());
    file.setContent(JSON.stringify(data));
    if (digest_(JSON.parse(file.getBlob().getDataAsString('UTF-8'))) !== checksum) fail_('backup_verify_failed');
    const count = data.sheets.reduce((sum, s) => sum + Math.max(0, s.rows.length - 1), 0);
    sheet_(OPS.backupSheet, ['建立時間', '備份ID', 'SHA256', '資料列數', '狀態']).appendRow([data.createdAt, file.getId(), checksum, count, 'verified']);
    props_().setProperty('LAST_BACKUP', data.createdAt);
    audit_(actor, 'backup', file.getId());
    return { id: file.getId(), checksum, rows: count };
  } finally { lock.releaseLock(); }
}
function restoreDrill_(actor, id) {
  const index = rows_(db_().getSheetByName(OPS.backupSheet)).find(row => row[1] === id && row[4] === 'verified');
  if (!index) fail_('unknown_backup');
  const data = JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8'));
  if (digest_(data) !== index[2]) fail_('checksum_mismatch');
  if (data.format !== 1 || !Array.isArray(data.sheets)) fail_('invalid_backup');
  const restored = SpreadsheetApp.create('TeacherGroup2026 復原演練 ' + day_());
  privateFile_(restored.getId());
  data.sheets.forEach((source, i) => {
    const target = i === 0 ? restored.getSheets()[0].setName(source.name) : restored.insertSheet(source.name);
    if (source.rows.length) {
      const range = target.getRange(1, 1, source.rows.length, source.rows[0].length);
      range.setNumberFormat('@'); range.setValues(source.rows.map(row => row.map(value => /^=/.test(value) ? "'" + value : value)));
    }
  });
  SpreadsheetApp.flush();
  const actual = restored.getSheets().map(sheet => ({ name: sheet.getName(), rows: sheet.getDataRange().getDisplayValues() }));
  if (digest_(actual) !== digest_(data.sheets)) fail_('restore_verify_failed');
  audit_(actor, 'restore_drill', restored.getId());
  props_().setProperty('LAST_DRILL', new Date().toISOString());
  return { ok: true, url: restored.getUrl(), checksum: index[2], productionUntouched: true };
}
function dailyMaintenance_() {
  try {
    createBackup_('system');
    props_().setProperty('MAINTENANCE', JSON.stringify({ ok: true, at: new Date().toISOString(), retention: retentionPreview_() }));
  } catch (_) {
    props_().setProperty('MAINTENANCE', JSON.stringify({ ok: false, at: new Date().toISOString(), error: 'maintenance_failed' }));
  }
}
function retentionPreview_() {
  const policy = setting_('RETENTION', { days: OPS.retentionDays, backupDays: OPS.backupDays, mode: 'review-only' });
  const cutoff = day_(new Date(Date.now() - policy.days * 86400000));
  const backupCutoff = new Date(Date.now() - policy.backupDays * 86400000).toISOString();
  return { policy, cutoff, expiredStatistics: rows_(getSummarySheet_()).filter(r => r[0] < cutoff).length,
    expiredAudit: rows_(db_().getSheetByName(OPS.auditSheet)).filter(r => r[0].slice(0, 10) < cutoff).length,
    expiredBackups: rows_(db_().getSheetByName(OPS.backupSheet)).filter(r => r[0] < backupCutoff).length,
    action: '僅列出到期待處理資料；尚未自動刪除' };
}
