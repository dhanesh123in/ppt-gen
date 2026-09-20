import { readFileSync } from "node:fs";

/**
 * Read PNG/JPEG dimensions from file headers (sync, no decode).
 * @returns {{width:number,height:number}|null}
 */
export function imageNaturalSize(path) {
  try {
    const buf = readFileSync(path);
    // PNG
    if (
      buf.length >= 24 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG SOF0/SOF2
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (marker === 0xc0 || marker === 0xc2) {
          return {
            height: buf.readUInt16BE(i + 5),
            width: buf.readUInt16BE(i + 7),
          };
        }
        i += 2 + len;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Fit (dw, dh) inside (boxW, boxH) preserving aspect; center in box.
 */
export function containRect(nw, nh, boxW, boxH) {
  if (!nw || !nh || boxW <= 0 || boxH <= 0) {
    return { x: 0, y: 0, w: boxW, h: boxH };
  }
  const scale = Math.min(boxW / nw, boxH / nh);
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  return {
    x: Math.round((boxW - w) / 2),
    y: Math.round((boxH - h) / 2),
    w,
    h,
  };
}
