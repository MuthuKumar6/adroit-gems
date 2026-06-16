import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export function Barcode({
  value,
  height = 40,
  width = 1.4,
  fontSize = 11,
  displayValue = true,
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        width,
        fontSize,
        displayValue,
        margin: 0,
        background: "transparent",
      });
    } catch (e) {
      console.warn("Barcode render failed", e);
    }
  }, [value, height, width, fontSize, displayValue]);
  return <svg ref={ref} />;
}

export function QrCode({ value, size = 80 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, { width: size, margin: 1 }).catch((e) =>
      console.warn("QR render failed", e)
    );
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} />;
}
