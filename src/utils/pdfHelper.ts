import * as pdfjsLib from 'pdfjs-dist';
import { SubmissionPage } from '../types';

// Setup pdfjs worker source
try {
  if (typeof window !== 'undefined') {
    // Use worker bundled or cdn version matching installed pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('Could not set workerSrc for pdfjs-dist:', e);
}

/**
 * Converts a PDF File into an array of rendered page data URLs and metadata
 */
export async function convertPdfToPages(file: File): Promise<SubmissionPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: SubmissionPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    // Scale 1.5 to 2.0 for sharp, high-precision OCR extraction
    const viewport = page.getViewport({ scale: 1.6 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      // White background for clear OCR
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      await (page.render(renderContext as any)).promise;

      pages.push({
        pageNumber: pageNum,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  return pages;
}
