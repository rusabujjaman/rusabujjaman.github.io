/**
 * Q&A backend for rusabujjaman.github.io (Google Sheet + Google Drive).
 *
 * Setup (once):
 *  1. Make a new Google Sheet, then Extensions > Apps Script.
 *  2. Delete what is there, paste ALL of this file, press Save.
 *  3. Deploy > New deployment > type "Web app":
 *       Execute as: Me      Who has access: Anyone
 *     Press Deploy, allow access, copy the "Web app URL".
 *
 * Answering: open the Sheet, tab "Questions".
 *   - write your reply in the "answer" column
 *   - write  yes  in the "hidden" column to hide a post
 *   - delete the whole row to remove a post
 * Only you can edit the Sheet, so only you can answer.
 */

const MAX_BYTES = 20 * 1024 * 1024;           // 20 MB per photo/video
const FOLDER_NAME = 'Website Q&A uploads';
const HEAD = ['id', 'time', 'name', 'question', 'file_id', 'type', 'answer', 'hidden'];

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Questions');
  if (!sh) {
    sh = ss.insertSheet('Questions');
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange('A1:H1').setFontWeight('bold').setBackground('#ffe2a8');
    sh.setColumnWidth(4, 360); sh.setColumnWidth(7, 360);
  }
  return sh;
}

function folder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder(FOLDER_NAME);
  p.setProperty('FOLDER', f.getId());
  return f;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// stop text from being read as a spreadsheet formula
function safe_(s) { return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }

function isHidden_(v) { return v === true || /^(yes|y|true|1|hide|হ্যাঁ|да)$/i.test(String(v).trim()); }

function doGet() {
  const rows = sheet_().getDataRange().getValues();
  rows.shift();
  const items = rows
    .filter(r => r[0] && r[2] && !isHidden_(r[7]))
    .map(r => ({
      time: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      name: String(r[2]).replace(/^'/, ''),
      q: String(r[3]).replace(/^'/, ''),
      file: /^[\w-]{10,}$/.test(String(r[4])) ? String(r[4]) : '',
      type: r[5] === 'video' ? 'video' : (r[5] === 'image' ? 'image' : ''),
      a: String(r[6] || '')
    }))
    .reverse()
    .slice(0, 200);
  return out_({ ok: true, items: items });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad' }); }
  if (d.hp) return out_({ ok: true });                         // bot trap
  const name = String(d.name || '').trim().slice(0, 60);
  const q = String(d.q || '').trim().slice(0, 2000);
  if (!name || !q) return out_({ ok: false, err: 'need' });

  const cache = CacheService.getScriptCache();                 // at most 5 posts a minute
  const n = Number(cache.get('n') || 0);
  if (n >= 5) return out_({ ok: false, err: 'busy' });
  cache.put('n', String(n + 1), 60);

  let fileId = '', type = '';
  if (d.file && d.file.data) {
    const mime = String(d.file.mime || '');
    const isV = /^video\/(mp4|webm|quicktime)$/.test(mime);
    const isI = /^image\/(jpeg|png|webp|gif|heic|heif)$/.test(mime);
    if (!isV && !isI) return out_({ ok: false, err: 'type' });
    const bytes = Utilities.base64Decode(d.file.data);
    if (bytes.length > MAX_BYTES) return out_({ ok: false, err: 'big' });
    const ext = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[mime] || mime.split('/')[1];
    const f = folder_().createFile(Utilities.newBlob(bytes, mime, 'q-' + Date.now() + '.' + ext));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileId = f.getId();
    type = isV ? 'video' : 'image';
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet_().appendRow([Utilities.getUuid(), new Date(), safe_(name), safe_(q), fileId, type, '', '']);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}

// Run this once from the editor (select "setup" and press Run) to create the tab and allow access.
function setup() { sheet_(); folder_(); }
