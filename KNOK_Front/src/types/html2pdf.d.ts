// src/types/html2pdf.d.ts
declare module 'html2pdf.js' {
  export interface Options {
    margin?: number;
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string; enableLinks?: boolean };
    pagebreak?: { mode?: string[] };
  }
  export interface Html2PdfInstance {
    set(opts: Options): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    outputPdf(type: 'blob'): Promise<Blob>;
    save(): void;
  }
  const html2pdf: () => Html2PdfInstance;
  export default html2pdf;
}
