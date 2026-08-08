// Central legal attribution constants used across UI and generated PDFs.
// Software ownership (Projexa Technologies and IT Solutions LLP) is kept
// strictly separate from community-owned content (Vicharmanch, Latur).

export const PLATFORM_NAME = "Vicharmanch Community Operating System";
export const PLATFORM_NAME_MR = "विचारमंच कम्युनिटी ऑपरेटिंग सिस्टीम";
export const ORGANIZATION =
  "Bharatratna Dr. Babasaheb Ambedkar Vicharmanch, Latur";
export const ORGANIZATION_MR =
  "भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर";
export const DEVELOPER = "Projexa Technologies and IT Solutions LLP";
export const APP_VERSION = "2.0.0";
export const COPYRIGHT_YEAR = 2026;

export const COPYRIGHT_LINE = `© ${COPYRIGHT_YEAR} ${ORGANIZATION}.`;
export const DEVELOPER_LINE = `Software Design & Development: ${DEVELOPER}.`;
export const RIGHTS_LINE = "All Rights Reserved.";

export const ATTRIBUTION_TEXT = `${COPYRIGHT_LINE} ${DEVELOPER_LINE} ${RIGHTS_LINE}`;

/** Single-line attribution suitable for PDF headers/footers. */
export const PDF_ATTRIBUTION_LINE = ATTRIBUTION_TEXT;

/** Ready-to-inject HTML block for generated print/PDF documents. */
export const PDF_ATTRIBUTION_HTML = `<div style="margin-top:10px;padding-top:6px;border-top:1px solid #cbd5e1;text-align:center;font-size:8.5px;line-height:1.5;color:#64748b;font-family:sans-serif;">
  ${COPYRIGHT_LINE}<br/>${DEVELOPER_LINE} ${RIGHTS_LINE}
</div>`;
