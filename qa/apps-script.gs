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
 *
 * Followers: people who follow by e-mail are in tab "Followers"
 *   (they must click a confirm link first; only confirmed ones are counted).
 * Send an update to all followers: tab "Updates" -> write subject + message
 *   (+ optional link), then write  yes  in the "send" column.
 *   Within ~10 minutes it is e-mailed to every follower (Gmail limit ~100 a day).
 *
 * After changing this code: Deploy > Manage deployments > edit (pencil)
 *   > Version: New version > Deploy. The URL stays the same.
 */

const MAX_BYTES = 20 * 1024 * 1024;           // 20 MB per photo/video
const FOLDER_NAME = 'Website Q&A uploads';
const HEAD = ['id', 'time', 'name', 'question', 'file_id', 'type', 'answer', 'hidden'];
const SITE = 'https://rusabujjaman.github.io/';
const F_HEAD = ['email', 'status', 'token', 'followed', 'confirmed'];
const U_HEAD = ['subject', 'message', 'link', 'send', 'sent_to', 'sent_at'];

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

function tab_(name, head, widths) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#cfe0ff');
    (widths || []).forEach((w, i) => w && sh.setColumnWidth(i + 1, w));
  }
  return sh;
}
function followers_() { return tab_('Followers', F_HEAD, [240, 90, 0, 160, 160]); }
function updates_() { return tab_('Updates', U_HEAD, [220, 420, 220, 60, 70, 160]); }
function followerCount_() {
  return followers_().getDataRange().getValues().slice(1).filter(r => r[1] === 'active').length;
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

function page_(title, text) {
  const h = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font:17px/1.5 system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:28px;border-radius:24px;' +
    'background:#0e2a52;color:#eef3ff;text-align:center"><h2 style="margin:0 0 10px">' + title + '</h2><p>' + text +
    '</p><p><a style="color:#ffb547" href="' + SITE + '" target="_top">rusabujjaman.github.io</a></p></div>';
  return HtmlService.createHtmlOutput(h).setTitle(title);
}

function findFollower_(email, token) {
  const sh = followers_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if ((email && String(v[i][0]).toLowerCase() === email) || (token && v[i][2] === token)) return { sh: sh, row: i + 1, r: v[i] };
  }
  return null;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'confirm' || p.action === 'unsub') {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const f = p.t && /^[\w-]{20,}$/.test(p.t) ? findFollower_('', p.t) : null;
      if (!f) return page_('Link not valid', 'This link is old or wrong. · লিংকটি সঠিক নয়।');
      if (p.action === 'confirm') {
        f.sh.getRange(f.row, 2).setValue('active');
        f.sh.getRange(f.row, 5).setValue(new Date());
        return page_('You are following Rusab! 🎉', 'You will get my updates by e-mail. · এখন থেকে আমার আপডেট ইমেইলে পাবেন।');
      }
      f.sh.deleteRow(f.row);
      return page_('Unfollowed', 'You will not get e-mails any more. · আর ইমেইল পাবেন না।');
    } finally { lock.releaseLock(); }
  }
  if (p.action === 'stats') return out_({ ok: true, followers: followerCount_() });
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
  return out_({ ok: true, items: items, followers: followerCount_() });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad' }); }
  if (d.hp) return out_({ ok: true });                         // bot trap
  if (d.action === 'follow') return follow_(d);
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

function follow_(d) {
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/.test(email)) return out_({ ok: false, err: 'email' });
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('f') || 0);
  if (n >= 10) return out_({ ok: false, err: 'busy' });
  cache.put('f', String(n + 1), 60);
  if (cache.get('fe:' + email)) return out_({ ok: true, status: 'sent' });  // no repeat mail within 10 min
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let token;
  try {
    const f = findFollower_(email, '');
    if (f && f.r[1] === 'active') return out_({ ok: true, status: 'already' });
    token = Utilities.getUuid() + '-' + Utilities.getUuid().slice(0, 8);
    if (f) f.sh.getRange(f.row, 3).setValue(token);
    else followers_().appendRow([email, 'pending', token, new Date(), '']);
  } finally { lock.releaseLock(); }
  if (MailApp.getRemainingDailyQuota() < 1) return out_({ ok: false, err: 'quota' });
  const url = ScriptApp.getService().getUrl() + '?action=confirm&t=' + encodeURIComponent(token);
  MailApp.sendEmail({
    to: email, name: 'Rusab Ujjaman', subject: 'Confirm: follow Rusab Ujjaman',
    htmlBody: mail_('Please confirm', 'Click the button to follow Rusab and get his updates by e-mail.<br>' +
      'আপডেট পেতে নিচের বাটনে চাপুন। · Нажмите кнопку, чтобы подписаться.', url, 'Yes, follow', '')
  });
  cache.put('fe:' + email, '1', 600);
  return out_({ ok: true, status: 'sent' });
}

function esc_(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function mail_(title, html, btnUrl, btnText, unsubUrl) {
  return '<div style="font:16px/1.55 Arial,sans-serif;max-width:560px;margin:auto;padding:26px;border-radius:20px;background:#0e2a52;color:#eef3ff">' +
    '<p style="margin:0 0 6px;color:#ffb547;font-weight:bold">Rusab Ujjaman Munim Hazra</p>' +
    '<h2 style="margin:0 0 12px">' + title + '</h2><div>' + html + '</div>' +
    (btnUrl ? '<p style="margin:22px 0"><a href="' + btnUrl + '" style="background:#ffb547;color:#1d1606;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">' + btnText + '</a></p>' : '') +
    '<p style="font-size:13px;color:#a9b6cf;margin-top:24px"><a style="color:#a9b6cf" href="' + SITE + '">rusabujjaman.github.io</a>' +
    (unsubUrl ? ' · <a style="color:#a9b6cf" href="' + unsubUrl + '">Unfollow / আনফলো</a>' : '') + '</p></div>';
}

// Runs every 10 minutes: e-mails rows in "Updates" that have send = yes.
function sendUpdates() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const us = updates_(), uv = us.getDataRange().getValues();
    const fol = followers_().getDataRange().getValues().slice(1).filter(r => r[1] === 'active');
    const base = ScriptApp.getService().getUrl();
    for (let i = 1; i < uv.length; i++) {
      const r = uv[i];
      if (!/^(yes|y|true|1|হ্যাঁ|да)$/i.test(String(r[3]).trim()) || r[5]) continue;
      let k = Number(r[4] || 0);
      while (k < fol.length && MailApp.getRemainingDailyQuota() > 0) {
        const unsub = base + '?action=unsub&t=' + encodeURIComponent(fol[k][2]);
        const link = /^https?:\/\//.test(String(r[2])) ? String(r[2]) : SITE;
        MailApp.sendEmail({ to: fol[k][0], name: 'Rusab Ujjaman', subject: String(r[0] || 'New update from Rusab'),
          htmlBody: mail_(esc_(r[0] || 'New update'), esc_(r[1] || '').replace(/\n/g, '<br>'), link, 'Open / খুলুন', unsub) });
        k++;
      }
      us.getRange(i + 1, 5).setValue(k);
      if (k >= fol.length) us.getRange(i + 1, 6).setValue(new Date());
      else break;                                            // daily limit reached; continue tomorrow
    }
  } finally { lock.releaseLock(); }
}

// Run this once from the editor (select "setup" and press Run) to create the tab and allow access.
function setup() {
  sheet_(); folder_(); followers_(); updates_();
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sendUpdates')) {
    ScriptApp.newTrigger('sendUpdates').timeBased().everyMinutes(10).create();
  }
  MailApp.getRemainingDailyQuota();   // asks for e-mail permission
}
