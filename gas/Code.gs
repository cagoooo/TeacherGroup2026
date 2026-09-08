const CONFIG = Object.freeze({
  serviceName: 'TeacherGroup2026 匿名使用統計後端',
  schema: 1,
  timeZone: 'Asia/Taipei',
  spreadsheetProperty: 'SPREADSHEET_ID',
  summarySheetName: '每日統計',
  infoSheetName: '使用說明'
});

const ALLOWED_EVENTS = Object.freeze([
  'page_view',
  'quick_entry_renewal',
  'quick_entry_joining',
  'quick_entry_activities',
  'quick_entry_contact',
  'announcement_workshops',
  'announcement_activities',
  'announcement_membership',
  'print_quick_entry',
  'section_view_quick_entry',
  'section_view_announcements',
  'section_view_activities',
  'section_view_workshops',
  'section_view_renewal',
  'section_view_joining',
  'section_view_membership',
  'section_view_payment',
  'section_view_faq',
  'section_view_contact'
]);

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'health').toLowerCase();
  if (action === 'health') {
    return json_({
      ok: true,
      service: CONFIG.serviceName,
      schema: CONFIG.schema,
      mode: 'anonymous-aggregate',
      writeMethod: 'POST'
    });
  }

  return json_({
    ok: true,
    service: CONFIG.serviceName,
    message: '請使用 POST 傳送固定事件名稱；統計資料保留在管理用 Google 試算表。',
    allowedEvents: ALLOWED_EVENTS
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const eventName = normalizeEvent_(payload.event);
    incrementEvent_(eventName);
    return json_({ ok: true, event: eventName });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: 'invalid_request' });
  }
}

/**
 * 第一次部署後由管理者在 Apps Script 編輯器執行一次，建立私有統計試算表並完成授權。
 * 這裡不建立原始訪客紀錄，只建立每日事件彙總表。
 */
function initializeBackend() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(CONFIG.spreadsheetProperty);
  if (existingId) {
    const existingInfo = backendInfo_(existingId);
    console.log(JSON.stringify(existingInfo));
    return existingInfo;
  }

  const spreadsheet = SpreadsheetApp.create('TeacherGroup2026｜匿名網站使用統計');
  const summarySheet = spreadsheet.getSheets()[0];
  summarySheet.setName(CONFIG.summarySheetName);
  summarySheet.clear();
  summarySheet.getRange(1, 1, 1, 4).setValues([[
    '日期（台灣）',
    '事件名稱',
    '次數',
    '最後更新時間（台灣）'
  ]]);
  summarySheet.setFrozenRows(1);
  summarySheet.getRange('A1:D1').setFontWeight('bold').setBackground('#063b84').setFontColor('#ffffff');
  summarySheet.getRange('A:A').setNumberFormat('@');
  summarySheet.getRange('C:C').setNumberFormat('0');

  const infoSheet = spreadsheet.insertSheet(CONFIG.infoSheetName);
  infoSheet.getRange(1, 1, 8, 2).setValues([
    ['項目', '內容'],
    ['用途', 'TeacherGroup2026 網站匿名使用量彙整'],
    ['資料範圍', '固定事件名稱、台灣日期、次數、最後更新時間'],
    ['不收集', '姓名、電話、電子郵件、會員名冊、付款資料、IP、User-Agent'],
    ['統計限制', '這是事件次數，不等同於去重後的老師人數'],
    ['管理方式', '本試算表由管理者帳號保存，請依校內個資政策管理分享權限'],
    ['後端版本', String(CONFIG.schema)],
    ['建立時間', Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss')]
  ]);
  infoSheet.setFrozenRows(1);
  infoSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#168657').setFontColor('#ffffff');
  infoSheet.autoResizeColumns(1, 2);

  properties.setProperty(CONFIG.spreadsheetProperty, spreadsheet.getId());
  const info = backendInfo_(spreadsheet.getId());
  console.log(JSON.stringify(info));
  return info;
}

function getBackendStatus() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty);
  return spreadsheetId ? backendInfo_(spreadsheetId) : { ok: false, initialized: false };
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  const payload = JSON.parse(raw);
  if (!payload || typeof payload !== 'object') throw new Error('payload must be an object');
  return payload;
}

function normalizeEvent_(value) {
  const eventName = String(value || '').trim();
  if (!ALLOWED_EVENTS.includes(eventName)) throw new Error('event is not allowed');
  return eventName;
}

function incrementEvent_(eventName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSummarySheet_();
    const day = Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd');
    const updatedAt = Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss');
    const lastRow = sheet.getLastRow();
    const rowCount = Math.max(lastRow - 1, 0);
    const rows = rowCount ? sheet.getRange(2, 1, rowCount, 4).getValues() : [];
    const matchIndex = rows.findIndex((row) => String(row[0]) === day && String(row[1]) === eventName);

    if (matchIndex >= 0) {
      const rowNumber = matchIndex + 2;
      sheet.getRange(rowNumber, 3, 1, 2).setValues([[
        Number(rows[matchIndex][2] || 0) + 1,
        updatedAt
      ]]);
      return;
    }

    sheet.appendRow([day, eventName, 1, updatedAt]);
  } finally {
    lock.releaseLock();
  }
}

function getSummarySheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty);
  if (!spreadsheetId) throw new Error('backend is not initialized');
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.summarySheetName);
  if (!sheet) throw new Error('summary sheet is missing');
  return sheet;
}

function backendInfo_(spreadsheetId) {
  return {
    ok: true,
    initialized: true,
    service: CONFIG.serviceName,
    schema: CONFIG.schema,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit'
  };
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
