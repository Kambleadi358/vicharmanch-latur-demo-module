// Shared print / PDF helper.
// - Normal browsers: prints the document from a hidden frame (no pop-ups).
// - Android app shells (WebView, installed PWA on Android): window.print is
//   unreliable, so we render a real PDF file and hand it to the device's
//   share/save sheet (or download it), which opens in the PDF viewer.
// The HTML passed in is used unchanged except for removing its own
// auto-print scripts / print buttons, so all layouts stay identical.
import { toast } from "sonner";

export function isAndroidAppShell(): boolean {
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isWebView = /; wv\)/i.test(ua) || /Version\/[\d.]+ Chrome\/[\d.]+ Mobile/i.test(ua);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches;
  return isAndroid && (isWebView || !!standalone);
}

function sanitize(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (s) => (/print\s*\(/.test(s) ? "" : s))
    .replace(/<button[^>]*onclick="window\.print\(\)"[^>]*>[\s\S]*?<\/button>/gi, "");
}

function isLandscape(html: string) {
  return /@page\s*{[^}]*landscape/i.test(html);
}

async function waitForAssets(doc: Document) {
  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); }),
    ),
  );
  try { await (doc as any).fonts?.ready; } catch { /* ignore */ }
  await new Promise((r) => setTimeout(r, 250));
}

function mountFrame(html: string, landscape: boolean): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    const w = landscape ? 1123 : 794; // A4 @96dpi
    Object.assign(iframe.style, {
      position: "fixed", left: "-10000px", top: "0", width: `${w}px`, height: "1200px",
      border: "0", opacity: "0", pointerEvents: "none",
    } as CSSStyleDeclaration);
    const timer = setTimeout(() => reject(new Error("load timeout")), 20000);
    iframe.onload = () => { clearTimeout(timer); resolve(iframe); };
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) { iframe.remove(); reject(new Error("print frame unavailable")); return; }
    doc.open(); doc.write(html); doc.close();
    // Some engines fire onload synchronously before handler; fallback.
    if (doc.readyState === "complete") { clearTimeout(timer); resolve(iframe); }
  });
}

async function renderPdfBlob(iframe: HTMLIFrameElement, landscape: boolean): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("print frame unavailable");
  const body = doc.body;
  iframe.style.height = `${Math.max(body.scrollHeight, 1200)}px`;
  const canvas = await html2canvas(body, {
    scale: 2, useCORS: true, backgroundColor: "#ffffff",
    windowWidth: body.scrollWidth, windowHeight: body.scrollHeight,
  });
  const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageW;
  const pagePx = Math.floor(pageH * pxPerMm);
  let y = 0; let first = true;
  while (y < canvas.height) {
    const sliceH = Math.min(pagePx, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width; slice.height = sliceH;
    const context = slice.getContext("2d");
    if (!context) throw new Error("PDF canvas unavailable");
    context.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, sliceH / pxPerMm);
    first = false; y += sliceH;
  }
  return pdf.output("blob");
}

async function deliverPdf(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: filename }); return; }
    catch (e: any) { if (e?.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export interface PrintOptions { filename?: string; forcePdf?: boolean; }

/** Print (web) or generate + open/save PDF (Android app). Shows real progress/errors. */
export async function printDocument(rawHtml: string, opts: PrintOptions = {}): Promise<boolean> {
  const html = sanitize(rawHtml);
  const landscape = isLandscape(html);
  const usePdf = opts.forcePdf || isAndroidAppShell();
  const filename = (opts.filename || "vicharmanch-document").replace(/[^\w\u0900-\u097F-]+/g, "_") + ".pdf";
  const tid = toast.loading(usePdf ? "PDF तयार होत आहे..." : "छपाईसाठी तयार होत आहे...");
  let iframe: HTMLIFrameElement | null = null;
  try {
    iframe = await mountFrame(html, landscape);
    if (!iframe.contentDocument) throw new Error("print frame unavailable");
    await waitForAssets(iframe.contentDocument);
    if (usePdf) {
      const blob = await renderPdfBlob(iframe, landscape);
      await deliverPdf(blob, filename);
      toast.success("PDF तयार झाली", { id: tid });
    } else {
      const win = iframe.contentWindow;
      if (!win) throw new Error("print window unavailable");
      win.focus();
      win.print();
      toast.dismiss(tid);
    }
    return true;
  } catch (e) {
    console.error("print/pdf failed:", e);
    toast.error("PDF तयार होऊ शकली नाही — पुन्हा प्रयत्न करा.", { id: tid });
    return false;
  } finally {
    const f = iframe;
    if (f) setTimeout(() => f.remove(), 60000);
  }
}
