import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source = ['Code.gs', 'Operations.gs', 'Admin.gs'].map(name => readFileSync(new URL('../gas/' + name, import.meta.url), 'utf8')).join('\n');
function fixture(email = '') {
  const properties = new Map([['ADMIN_ROLES', JSON.stringify({ 'owner@school.test': 'owner', 'ops@school.test': 'operator', 'view@school.test': 'viewer', 'off@school.test': 'disabled' })]]);
  const cache = new Map(); let writes = 0, lockHeld = false;
  const box = { console, Date, Map, Set, JSON,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties.get(key) ?? null, setProperty: (key, value) => properties.set(key, value) }) },
    Session: { getActiveUser: () => ({ getEmail: () => email }), getEffectiveUser: () => ({ getEmail: () => 'owner@school.test' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { lockHeld = true; return true; }, waitLock: () => { lockHeld = true; }, releaseLock: () => { lockHeld = false; } }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    Utilities: { formatDate: (date, zone, format) => format.includes('HH:mm') ? date.toISOString().slice(0, 16) : date.toISOString().slice(0, 10), DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, value) => [...createHash('sha256').update(value).digest()] },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    SpreadsheetApp: { flush: () => {} }
  };
  vm.createContext(box); vm.runInContext(source, box);
  box.incrementEvent_ = () => { assert.equal(lockHeld, true); writes++; };
  box.incrementVersion_ = () => {};
  box.audit_ = () => {};
  return { box, properties, get writes() { return writes; } };
}
const payload = extra => ({ schema: 1, event: 'section_view_contact', siteVersion: '2026.09.08-4', ...extra });
const post = (f, data) => f.box.doPost({ postData: { contents: JSON.stringify(data) } });

test('anonymous and unknown accounts cannot call any management action or owner bootstrap', () => {
  for (const email of ['', 'stranger@school.test', 'off@school.test']) {
    const { box } = fixture(email);
    for (const action of ['report', 'status', 'export', 'backup', 'drill', 'retention', 'role']) assert.throws(() => box.adminRpc({ action, email: 'owner@school.test' }), /forbidden/);
    assert.throws(() => box.initializeOperations(), /forbidden/);
    assert.throws(() => box.initializeBackend(), /forbidden/);
    assert.throws(() => box.getBackendStatus(), /forbidden/);
  }
});
test('viewer cannot mutate and operator cannot grant roles or change retention', () => {
  for (const [email, actions] of [['view@school.test', ['backup', 'drill', 'role', 'retention']], ['ops@school.test', ['role', 'retention']]]) {
    const { box } = fixture(email);
    for (const action of actions) assert.throws(() => box.adminRpc({ action }), /forbidden/);
  }
});
test('owner grants same-domain role and revocation applies on next request', () => {
  const f = fixture('owner@school.test');
  f.box.adminRpc({ action: 'role', email: 'new@school.test', role: 'viewer' });
  f.box.Session.getActiveUser = () => ({ getEmail: () => 'new@school.test' });
  assert.equal(f.box.requireRole_('viewer').role, 'viewer');
  f.box.Session.getActiveUser = () => ({ getEmail: () => 'owner@school.test' });
  f.box.adminRpc({ action: 'role', email: 'new@school.test', role: 'disabled' });
  f.box.Session.getActiveUser = () => ({ getEmail: () => 'new@school.test' });
  assert.throws(() => f.box.requireRole_('viewer'), /forbidden/);
});
test('owner rejects external accounts, prototype keys, arbitrary roles and self-demotion', () => {
  const { box } = fixture('owner@school.test');
  for (const [email, role] of [['x@external.test', 'owner'], ['__proto__', 'owner'], ['x@school.test', 'root'], ['owner@school.test', 'disabled']]) assert.throws(() => box.adminRpc({ action: 'role', email, role }));
});
test('old schema-1 site stays compatible and repeated request ID is not written twice', () => {
  const f = fixture(); assert.equal(post(f, payload()).ok, true);
  const data = payload({ requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' });
  assert.equal(post(f, data).ok, true); assert.equal(post(f, data).duplicate, true); assert.equal(f.writes, 2);
});
test('reject PII, unknown events/schema/versions and bad request IDs without writes', () => {
  const f = fixture();
  for (const data of [payload({ email: 'x@school.test' }), payload({ schema: 2 }), payload({ event: '__proto__' }), payload({ event: 'section_view_quick-entry' }), payload({ siteVersion: 'secret' }), payload({ requestId: 'teacher-001' }), [], null]) assert.equal(post(f, data).ok, false);
  assert.equal(f.writes, 0);
});
test('malformed and oversized JSON is rejected without persisting raw content', () => {
  const f = fixture();
  for (const contents of ['{oops', 'x'.repeat(1025)]) assert.equal(f.box.doPost({ postData: { contents } }).error, 'invalid_request');
  assert.equal(f.writes, 0); assert.ok(!JSON.stringify([...f.properties.values()]).includes('oops'));
});
test('per-minute budget blocks request 121 and does not inflate statistics', () => {
  const f = fixture(); for (let n = 0; n < 120; n++) assert.equal(post(f, payload()).ok, true);
  assert.equal(post(f, payload()).error, 'rate_limited'); assert.equal(f.writes, 120);
});
test('storage errors produce a classified failure and never expose server messages', () => {
  const f = fixture(); f.box.incrementEvent_ = () => { throw new Error('private-sheet-id'); };
  const result = post(f, payload()); assert.equal(result.error, 'storage_error'); assert.ok(!JSON.stringify(result).includes('private-sheet-id'));
});
test('health detects missing storage without exposing private file information', () => {
  const f = fixture(); f.box.getSummarySheet_ = () => { throw new Error('private-sheet'); };
  const result = f.box.publicHealth_(); assert.equal(result.ok, false); assert.equal(result.storage, 'unavailable'); assert.ok(!JSON.stringify(result).includes('private-sheet'));
});
test('report filters inclusive dates, totals known events, and rejects invalid calendar dates', () => {
  const f = fixture('view@school.test');
  f.box.db_ = () => ({ getSheetByName: () => 'versions' }); f.box.getSummarySheet_ = () => 'summary';
  f.box.rows_ = sheet => sheet === 'summary' ? [['2026-09-01','page_view','2',''],['2026-09-08','section_view_contact','3',''],['2026-09-09','page_view','10',''],['2026-09-08','unknown','99','']] : [];
  const report = f.box.adminRpc({ action: 'report', start: '2026-09-01', end: '2026-09-08' });
  assert.equal(report.total, 5); assert.equal(report.rows.length, 2);
  for (const [start, end] of [['2026-02-30','2026-09-08'],['2026-09-09','2026-09-08'],['2024-01-01','2026-09-08']]) assert.throws(() => f.box.report_(start, end), /invalid_date_range/);
});
test('restoration refuses unknown or tampered backups before creating a file', () => {
  const f = fixture('ops@school.test'); f.box.db_ = () => ({ getSheetByName: () => ({}) }); f.box.rows_ = () => [];
  assert.throws(() => f.box.restoreDrill_('ops@school.test', 'injected-id'), /unknown_backup/);
  f.box.rows_ = () => [['date','known','bad-checksum','1','verified']];
  f.box.DriveApp = { getFileById: () => ({ getBlob: () => ({ getDataAsString: () => '{"format":1,"sheets":[]}' }) }) };
  assert.throws(() => f.box.restoreDrill_('ops@school.test', 'known'), /checksum_mismatch/);
});
test('retention changes are bounded and always review-only', () => {
  const f = fixture('owner@school.test'); f.box.retentionPreview_ = () => JSON.parse(f.properties.get('RETENTION'));
  assert.throws(() => f.box.adminRpc({ action: 'retention', days: 0, backupDays: 1 }), /invalid_retention/);
  assert.equal(f.box.adminRpc({ action: 'retention', days: 365, backupDays: 30 }).mode, 'review-only');
});
test('browser section mapping reaches every allowlisted section event', () => {
  const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const fragment = app.slice(app.indexOf('const bindSectionViewEvents'), app.indexOf('  renderActivitySchedule();'));
  const records = [];
  vm.runInNewContext(fragment + '\nbindSectionViewEvents();', { Set, window: { IntersectionObserver: true, TeacherGroupUsage: { record: name => records.push(name) } }, document: { getElementById: id => ({ id }) }, IntersectionObserver: class { constructor(callback) { this.cb = callback; } observe(target) { this.cb([{target, isIntersecting:true}]); } } });
  assert.equal(records.length, 10); assert.ok(records.includes('section_view_quick_entry'));
  const f = fixture(); records.forEach(name => assert.equal(f.box.normalizeEvent_(name), name));
});

test('backup becomes private before content is written and restoration matches without changing production', () => {
  const f = fixture('owner@school.test'); const files = new Map(), index = [], restoredSheets = []; let restoredCount = 0;
  const data = { format: 1, createdAt: new Date().toISOString(), sheets: [
    {name:'每日統計',rows:[['日期（台灣）','事件名稱','次數','最後更新時間（台灣）'],['2026-09-08','page_view','2','2026-09-08 10:00:00']]},
    {name:'管理稽核',rows:[['時間（台灣）','管理帳號','動作','摘要'],['2026-09-08','owner@school.test','report','']]}] };
  const original = JSON.stringify(data); f.box.snapshot_ = () => data;
  const folder = {getId:()=> 'folder', setSharing:()=>{}, createFile: (_name, content) => {
    assert.equal(content, '');
    const file = { id: 'backup1', private:false, content, getId(){return this.id}, setSharing(){this.private=true}, getSharingAccess(){return this.private?'private':'public'}, setContent(value){assert.equal(this.private,true);this.content=value}, getBlob(){return {getDataAsString:()=>this.content}} };
    files.set(file.id, file); return file;
  }};
  f.box.DriveApp = { Access:{PRIVATE:'private'},Permission:{VIEW:'view'},createFolder:()=>folder,getFolderById:()=>folder,getFileById:id=>files.get(id) };
  f.box.MimeType = {PLAIN_TEXT:'text/plain'};
  f.box.sheet_ = () => ({appendRow:row=>index.push(row)});
  f.box.db_ = () => ({getSheetByName:()=>({})}); f.box.rows_ = () => index;
  function makeSheet(name){const s={name,values:[['']],setName(value){this.name=value;return this},getName(){return this.name},getRange(){return{setNumberFormat(){},setValues:value=>{s.values=value}}},getDataRange(){return{getDisplayValues:()=>this.values}}};restoredSheets.push(s);return s;}
  f.box.SpreadsheetApp.create = () => {
    restoredCount++; makeSheet('工作表1');
    const file = {private:false,setSharing(){this.private=true},getSharingAccess(){return this.private?'private':'public'}}; files.set('restored',file);
    return {getId:()=> 'restored',getSheets:()=>restoredSheets,insertSheet:makeSheet,getUrl:()=> 'https://docs.google.com/spreadsheets/d/restored/edit'};
  };
  const backup = f.box.createBackup_('owner@school.test');
  assert.equal(backup.rows,2);assert.equal(index[0][4],'verified');
  const drill = f.box.restoreDrill_('owner@school.test', backup.id);
  assert.equal(drill.ok,true);assert.equal(drill.productionUntouched,true);assert.equal(restoredCount,1);assert.equal(JSON.stringify(data),original);
  assert.equal(files.get('restored').private,true);
});

test('browser request ID is unique per event and not a stored visitor identifier', () => {
  const source=readFileSync(new URL('../usage-stats.js',import.meta.url),'utf8'), saved=new Map(), bodies=[];let sequence=0;
  const box={window:{SITE_CONFIG:{usageAnalytics:{enabled:true,endpoint:'https://script.google.com/macros/s/test/exec',schema:1}},SITE_VERSION:'2026.09.08-5'},localStorage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)},sessionStorage:{getItem:()=> 'already-counted'},navigator:{sendBeacon:(_url,blob)=>{bodies.push(blob.parts[0]);return true}},Blob:class{constructor(parts){this.parts=parts}},crypto:{randomUUID:()=>String(++sequence)},Date,JSON};
  vm.runInNewContext(source,box);box.window.TeacherGroupUsage.record('quick_entry_contact');box.window.TeacherGroupUsage.record('quick_entry_contact');
  assert.notEqual(JSON.parse(bodies[0]).requestId,JSON.parse(bodies[1]).requestId);
  assert.ok(![...saved.values()].join('').includes('requestId'));
});

test('daily maintenance records failure and recovers on the next successful backup', () => {
  const f=fixture();
  f.box.createBackup_=()=>{throw new Error('private detail')};
  f.box.dailyMaintenance_();
  let status=JSON.parse(f.properties.get('MAINTENANCE'));assert.equal(status.ok,false);assert.equal(status.error,'maintenance_failed');assert.ok(!JSON.stringify(status).includes('private detail'));
  f.box.createBackup_=()=>({id:'backup'});f.box.retentionPreview_=()=>({expiredStatistics:0});
  f.box.dailyMaintenance_();status=JSON.parse(f.properties.get('MAINTENANCE'));assert.equal(status.ok,true);assert.equal(status.retention.expiredStatistics,0);
});
