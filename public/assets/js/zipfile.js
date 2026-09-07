/* zipfile.js — escritor de ZIP no browser, sem dependências.
   STORE por padrão; usa CompressionStream('deflate-raw') quando disponível.
   Portado de scripts/lib/zip.js (mesmo contrato de saída da skill). */
(function (global) {
  'use strict';

  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(d) {
    d = d || new Date();
    const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31);
    const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    return { time, date };
  }

  const enc = new TextEncoder();

  async function deflateRaw(bytes) {
    if (typeof global.CompressionStream !== 'function') return null;
    try {
      const cs = new global.CompressionStream('deflate-raw');
      const stream = new Blob([bytes]).stream().pipeThrough(cs);
      const ab = await new Response(stream).arrayBuffer();
      return new Uint8Array(ab);
    } catch (_e) {
      return null;
    }
  }

  function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function concat(arrs) {
    let len = 0;
    for (const a of arrs) len += a.length;
    const out = new Uint8Array(len);
    let o = 0;
    for (const a of arrs) { out.set(a, o); o += a.length; }
    return out;
  }

  /**
   * @param {Array<{name:string, data:(string|Uint8Array)}>} entries
   * @returns {Promise<Blob>} application/zip
   */
  async function makeZip(entries) {
    const { time, date } = dosDateTime();
    const locals = [];
    const central = [];
    let offset = 0;

    for (const e of entries) {
      const nameBuf = enc.encode(e.name.replace(/\\/g, '/'));
      const raw = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
      const crc = crc32(raw);
      let method = 0;
      let body = raw;
      const def = await deflateRaw(raw);
      if (def && def.length < raw.length) { method = 8; body = def; }

      const localHeader = concat([
        u32(0x04034b50), u16(20), u16(0x0800), u16(method),
        u16(time), u16(date), u32(crc), u32(body.length), u32(raw.length),
        u16(nameBuf.length), u16(0),
      ]);
      locals.push(localHeader, nameBuf, body);

      central.push(concat([
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(method),
        u16(time), u16(date), u32(crc), u32(body.length), u32(raw.length),
        u16(nameBuf.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset),
        nameBuf,
      ]));

      offset += localHeader.length + nameBuf.length + body.length;
    }

    const centralBuf = concat(central);
    const eocd = concat([
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(centralBuf.length), u32(offset), u16(0),
    ]);

    return new Blob([concat(locals), centralBuf, eocd], { type: 'application/zip' });
  }

  global.PFZip = { makeZip, crc32 };
})(window);
