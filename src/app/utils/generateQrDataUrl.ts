// utils/generateQrDataUrl.ts
export async function generateQrDataUrl(): Promise<string | null> {
  const container = document.getElementById("qr-code");
  if (!container) return null;

  const svg = container.querySelector("svg") as SVGSVGElement | null;
  if (!svg) return null;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL("image/png");
      resolve(pngDataUrl);
    };

    img.onerror = (err) => reject(err);

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  });
}
