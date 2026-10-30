/* Builds a fake bank statement (.xlsx) for the tests. It has the same quirks as a real Moniepoint export and holds no real data.
   Quirks on purpose:
   - rows that share one second sit in the wrong order in the file
   - the Type column is blank on many rows
   - fees are inside the debit, and VAT and stamp duty also appear as their own rows
   - transfers to the holder's own accounts, airtime, USSD and SMS charges, charge refunds, a failed row
   - header block with opening and closing balance and totals on the right
   Usage in a test:  const G = require('./gen-statement.js'); const f = G.make({seed:1, start:'2026-08-03', days:120});
   f.buffer is the file, f.expected holds the numbers the app must reproduce, f.rows is the chain in true order. */
const zlib = require('zlib');
const fs = require('fs');

function prng(seed) { let a = seed >>> 0 || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ c >>> 8; return (c ^ 0xFFFFFFFF) >>> 0; }

/* A small zip writer: enough for a valid xlsx. Uses deflate, so the app's decompress path is tested. */
function zip(files) {
  const parts = [], central = []; let off = 0;
  Object.keys(files).forEach(name => {
    const raw = Buffer.from(files[name], 'utf8'), def = zlib.deflateRawSync(raw), nb = Buffer.from(name), crc = crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nb.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, nb, def);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(def.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, nb); off += 30 + nb.length + def.length;
  });
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const COLS = ['Date', 'Account Name', 'Transaction Type', 'Transaction Status', 'Terminal ID', 'RRN', 'Transaction Ref', 'Reversal Status', 'Transaction Amount (NGN)', 'Settlement Debit (NGN)', 'Settlement Credit (NGN)', 'Balance Before (NGN)', 'Balance After (NGN)', 'Charge (NGN)', 'Beneficiary', 'Beneficiary Institution', 'Source', 'Source Institution', 'Narration'];
const colName = i => String.fromCharCode(65 + i);
const k2 = k => Math.round(k) / 100; // kobo to naira

const PAYEES = [['ADAEZE OKORO', 'GTBank'], ['TUNDE BELLO', 'Access Bank'], ['CHIDI NWOSU', 'Zenith Bank'], ['FATIMA YUSUF', 'Opay'], ['MAMA NKECHI STORES', 'Palmpay'], ['EMEKA UDOH', 'UBA'], ['GRACE ETIM', 'First Bank'], ['SAMUEL ADE', 'Kuda']];
const SOURCES = [['FRIEND ONE', 'GTBank'], ['FRIEND TWO', 'Access Bank'], ['RELATIVE', 'Zenith Bank']];

/* opts: seed, start (YYYY-MM-DD), days, opening (naira), holder, shuffle (bool: scramble every row), cols (rename header cells, e.g. to make an unknown bank), tamper (row index in true order whose Balance After is altered), drop (true-order index of a row to delete) */
function make(opts) {
  opts = Object.assign({ seed: 1, start: '2026-08-03', days: 100, opening: 150000, holder: 'TEST ACCOUNT HOLDER' }, opts || {});
  const rnd = prng(opts.seed), pick = a => a[Math.floor(rnd() * a.length)], between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  let bal = Math.round(opts.opening * 100), n = 0, rows = [];
  const d0 = Date.UTC(+opts.start.slice(0, 4), +opts.start.slice(5, 7) - 1, +opts.start.slice(8, 10));
  const refOf = () => 'TRF|' + (opts.seed * 7919 + (++n)).toString(36) + 'X' + String(n).padStart(6, '0');
  /* One row. Amounts are kobo integers so the balance chain is exact. */
  function add(ts, o) {
    const deb = o.deb || 0, cre = o.cre || 0; if (deb > bal && !cre) return false;
    const before = bal; bal = bal + cre - deb;
    rows.push({ ts, type: o.type === undefined ? '' : o.type, status: o.status || 'COMPLETED', ref: o.ref || refOf(), deb, cre, before, after: bal, fee: o.fee || 0, ben: o.ben || '', benInst: o.benInst || '', src: o.src || '', srcInst: o.srcInst || '', narr: o.narr || '' });
    return true;
  }
  const stats = { own: 0, vat: 0, stamp: 0, blankType: 0, pos: 0, airtime: 0, refunds: 0, payees: 0 };
  let posNo = 100;
  for (let d = 0; d < opts.days; d++) {
    const day = new Date(d0 + d * 864e5), dom = day.getUTCDate(), base = Math.floor(d0 / 1000) + d * 86400;
    const times = Array.from({ length: 12 }, () => between(7 * 3600, 21 * 3600)).sort((a, b) => a - b); let ti = 0; const nextT = () => base + times[ti++ % times.length] + (ti > 12 ? ti : 0);
    if (dom === 25) { const t = base + 9 * 3600 + 12 * 60 + 5; add(t, { type: 'TRANSFER', cre: 25000000, srcInst: 'Access Bank', src: 'EMPLOYER LTD', narr: 'SALARY' }); if (add(t, { type: 'TRANSFER', deb: 5000, narr: 'Stamp duty' })) stats.stamp++; }
    if (rnd() < 0.18) { const t = nextT(), a = between(1000000, 6000000), [nm, bk] = pick(SOURCES); add(t, { type: 'TRANSFER', cre: a, src: nm, srcInst: bk, narr: 'Transfer from ' + nm }); if (a >= 1000000 && add(t, { type: 'TRANSFER', deb: 5000, narr: 'Stamp duty' })) stats.stamp++; }
    const pos = between(1, 4);
    for (let i = 0; i < pos; i++) { const t = nextT(), blank = rnd() < 0.6; if (add(t, { type: blank ? '' : 'POS', deb: between(50000, 1500000), narr: 'POS purchase at DETAIL ' + (++posNo) })) { stats.pos++; if (blank) stats.blankType++; } }
    if (rnd() < 0.45) { const t = nextT(), [nm, bk] = pick(PAYEES), amt = between(100000, 3000000), blank = rnd() < 0.5;
      if (add(t, { type: blank ? '' : 'TRANSFER', deb: amt + 1075, fee: 1075, ben: nm, benInst: bk, narr: 'Transfer to ' + nm })) { stats.payees++; if (blank) stats.blankType++; if (add(t, { type: '', deb: 75, narr: 'Value Added Tax on transfer' })) stats.vat++; } }
    if (rnd() < 0.12) { const t = nextT(), amt = between(2000000, 8000000);
      if (add(t, { type: 'TRANSFER', deb: amt + 1075, fee: 1075, ben: opts.holder, benInst: 'Opay', narr: 'Transfer to own account' })) { stats.own++; if (add(t, { type: '', deb: 75, narr: 'Value Added Tax on transfer' })) stats.vat++; } }
    if (rnd() < 0.15) { const t = nextT(); if (add(t, { type: 'AIRTIME', deb: between(10000, 200000), narr: 'AIRTIME PURCHASE MTN' })) stats.airtime++; }
    if (rnd() < 0.08) { const t = nextT(); add(t, { type: '', deb: 698, narr: 'USSD Charge for *737#' }); }
    if (rnd() < 0.05) { const t = nextT(); if (add(t, { type: '', cre: 75, narr: 'Value Added Tax Refund' })) stats.refunds++; }
    if (dom === 28) add(base + 20 * 3600, { type: '', deb: 400, narr: 'SMS ALERT CHARGE' });
    if (d === 3) rows.push({ ts: base + 3600, type: 'TRANSFER', status: 'FAILED', ref: refOf(), deb: 0, cre: 0, before: bal, after: bal, fee: 0, ben: 'NOBODY', benInst: 'GTBank', src: '', srcInst: '', narr: 'Failed transfer' });
  }
  rows = rows.filter(r => r.status === 'COMPLETED').concat(rows.filter(r => r.status !== 'COMPLETED'));
  const good = rows.filter(r => r.status === 'COMPLETED'), failed = rows.filter(r => r.status !== 'COMPLETED');
  const expected = {
    rows: good.length, opening: k2(Math.round(opts.opening * 100)), closing: k2(good[good.length - 1].after), totalDebit: k2(good.reduce((t, r) => t + r.deb, 0)), totalCredit: k2(good.reduce((t, r) => t + r.cre, 0)),
    from: new Date(good[0].ts * 1000).toISOString().slice(0, 10), to: new Date(good[good.length - 1].ts * 1000).toISOString().slice(0, 10), failed: failed.length, ...stats
  };
  /* Damage for the flag tests, applied after the true numbers are fixed. */
  let file = good.map(r => Object.assign({}, r));
  if (opts.tamper != null) { file[opts.tamper].after += 100000; }
  if (opts.drop != null) { expected.dropped = k2(file[opts.drop].cre - file[opts.drop].deb); file.splice(opts.drop, 1); }
  /* Same-second rows are listed in the wrong order about half the time. Optionally every row is scrambled. */
  const out = []; for (let i = 0; i < file.length;) { let j = i; while (j < file.length && file[j].ts === file[i].ts) j++; const grp = file.slice(i, j); if (grp.length > 1 && rnd() < 0.5) grp.reverse(); out.push(...grp); i = j; }
  let listed = out.concat(failed);
  if (opts.shuffle) { listed = listed.slice(); for (let i = listed.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [listed[i], listed[k]] = [listed[k], listed[i]]; } }

  /* Shared strings, as a real export uses. */
  const ss = [], sIdx = {}, S = s => { s = String(s); if (!(s in sIdx)) { sIdx[s] = ss.length; ss.push(s); } return sIdx[s]; };
  const cs = (ref, s) => '<c r="' + ref + '" t="s"><v>' + S(s) + '</v></c>', cn = (ref, v) => '<c r="' + ref + '"><v>' + v + '</v></c>';
  const serial = ts => (ts / 86400 + 25569).toFixed(8);
  const head = [
    cs('A1', 'Account Statement'),
    cs('A2', 'Account Details') + cs('W2', 'Account Summary'),
    cs('A3', 'Account Name:') + cs('C3', opts.holder) + cs('V3', 'Opening Balance:') + cn('X3', expected.opening),
    cs('A4', 'Account Number:') + cs('C4', '0000000001') + cs('V4', 'Closing Balance:') + cn('X4', expected.closing),
    cs('A5', 'Currency:') + cs('C5', 'NGN') + cs('V5', 'Total Debit:') + cn('X5', expected.totalDebit),
    cs('A6', 'Date:') + cs('C6', expected.from + ' - ' + expected.to) + cs('V6', 'Total Credit:') + cn('X6', expected.totalCredit),
    cs('A7', 'Address:') + cs('C7', 'ADDRESS')];
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
  head.forEach((cells, i) => { xml += '<row r="' + (i + 1) + '">' + cells + '</row>'; });
  xml += '<row r="8">' + COLS.map((c, i) => cs(colName(i) + '8', (opts.cols && opts.cols[c]) || c)).join('') + '</row>';
  listed.forEach((r, i) => {
    const rn = 9 + i, c = [];
    const put = (i2, v, num) => { if (v === '' || v == null) return; c.push(num ? cn(colName(i2) + rn, v) : cs(colName(i2) + rn, v)); };
    put(0, serial(r.ts), true); put(1, opts.holder); put(2, r.type); put(3, r.status); put(6, r.ref);
    put(8, k2(r.deb || r.cre), true); put(9, r.deb ? k2(r.deb) : 0, true); put(10, r.cre ? k2(r.cre) : 0, true); put(11, k2(r.before), true); put(12, k2(r.after), true); put(13, r.fee ? k2(r.fee) : 0, true);
    put(14, r.ben); put(15, r.benInst); put(16, r.src); put(17, r.srcInst); put(18, r.narr);
    xml += '<row r="' + rn + '">' + c.join('') + '</row>';
  });
  xml += '</sheetData></worksheet>';
  const sst = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + ss.length + '" uniqueCount="' + ss.length + '">' + ss.map(s => '<si><t xml:space="preserve">' + esc(s) + '</t></si>').join('') + '</sst>';
  const buffer = zip({
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Statement" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': xml,
    'xl/sharedStrings.xml': sst
  });
  return { buffer, expected, rows: good, holder: opts.holder };
}

/* Writes a file into a temp folder that is never committed, and returns its path. */
function write(name, opts) { const dir = require('os').tmpdir() + '/koboctrl-test-statements'; fs.mkdirSync(dir, { recursive: true }); const f = make(opts); const p = dir + '/' + name; fs.writeFileSync(p, f.buffer); return Object.assign({ path: p }, f); }

module.exports = { make, write };
if (require.main === module) { const a = process.argv; const f = make({ seed: +(a[3] || 1), start: a[4] || '2026-08-03', days: +(a[5] || 100) }); fs.writeFileSync(a[2] || 'statement.xlsx', f.buffer); console.log(JSON.stringify(f.expected)); }
