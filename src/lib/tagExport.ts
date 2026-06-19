import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export type TagInfo = {
  code: string;
  title: string;
  subtitle?: string;
  payload?: string; // QR payload; defaults to `code`
};

const TAG_W = 220; // px on canvas
const TAG_H = 260;

async function renderTagCanvas(tag: TagInfo): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = TAG_W;
  canvas.height = TAG_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, TAG_W, TAG_H);
  ctx.strokeStyle = "#d4a843";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, TAG_W - 8, TAG_H - 8);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(tag.title.slice(0, 28), TAG_W / 2, 24);
  if (tag.subtitle) {
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "#555";
    ctx.fillText(tag.subtitle.slice(0, 36), TAG_W / 2, 40);
  }

  // QR
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, tag.payload || tag.code, { width: 120, margin: 1 });
  ctx.drawImage(qrCanvas, (TAG_W - 120) / 2, 50);

  // Barcode
  const bcSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(bcSvg, tag.code, {
      format: "CODE128",
      height: 40,
      width: 1.5,
      fontSize: 12,
      margin: 0,
      displayValue: true,
    });
  } catch (e) {
    console.warn("barcode fail", e);
  }
  const svgStr = new XMLSerializer().serializeToString(bcSvg);
  const img = new Image();
  const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("barcode img load"));
    img.src = url;
  });
  const bcW = 180;
  const bcH = 60;
  ctx.drawImage(img, (TAG_W - bcW) / 2, 180, bcW, bcH);

  return canvas;
}

export async function downloadTagPng(tag: TagInfo, filename?: string) {
  const canvas = await renderTagCanvas(tag);
  const a = document.createElement("a");
  a.download = `${filename || tag.code}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export async function downloadTagsPdf(tags: TagInfo[], filename: string) {
  if (tags.length === 0) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const cols = 3;
  const rows = 4;
  const cellW = (pageW - margin * 2) / cols;
  const cellH = (pageH - margin * 2) / rows;
  const perPage = cols * rows;

  for (let i = 0; i < tags.length; i++) {
    if (i > 0 && i % perPage === 0) doc.addPage();
    const idx = i % perPage;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = margin + col * cellW;
    const y = margin + row * cellH;
    const canvas = await renderTagCanvas(tags[i]);
    const img = canvas.toDataURL("image/png");
    const pad = 2;
    const w = cellW - pad * 2;
    const h = cellH - pad * 2;
    // Preserve aspect by fitting
    const ratio = Math.min(w / TAG_W, h / TAG_H);
    const drawW = TAG_W * ratio;
    const drawH = TAG_H * ratio;
    doc.addImage(img, "PNG", x + (cellW - drawW) / 2, y + (cellH - drawH) / 2, drawW, drawH);
  }

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
