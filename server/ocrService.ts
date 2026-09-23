import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { createWorker, Worker } from 'tesseract.js';
import { imageSize } from 'image-size';
import { GoogleGenAI, Type } from '@google/genai';
import { DetectedWord, PageTranscription, OCRBreakdown } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScriptPath = path.join(__dirname, 'easyocr_service.py');

export interface InputPage {
  pageNumber: number;
  imageBase64?: string;
  mimeType?: string;
  text?: string;
}

/**
 * EasyOCR Worker Manager
 * Maintains a persistent Python process with EasyOCR loaded in memory for fast local inference.
 */
class EasyOCRManager {
  private process: ChildProcess | null = null;
  private isReady = false;
  private pendingRequests = new Map<
    string,
    { resolve: (res: OCRBreakdown) => void; reject: (err: any) => void }
  >();
  private requestCounter = 0;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isReady && this.process) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log('[EasyOCR Bridge] Starting Python EasyOCR service...');
        this.process = spawn('python', [pythonScriptPath], {
          stdio: ['pipe', 'pipe', 'inherit'],
        });

        const rl = readline.createInterface({
          input: this.process.stdout!,
          terminal: false,
        });

        rl.on('line', (line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          try {
            const msg = JSON.parse(trimmed);
            if (msg.status === 'ready') {
              console.log('[EasyOCR Bridge] EasyOCR Python engine initialized and READY.');
              this.isReady = true;
              resolve();
              return;
            }

            if (msg.id && this.pendingRequests.has(msg.id)) {
              const { resolve: reqResolve, reject: reqReject } = this.pendingRequests.get(msg.id)!;
              this.pendingRequests.delete(msg.id);

              if (msg.success && msg.data) {
                reqResolve(msg.data);
              } else {
                reqReject(new Error(msg.error || 'EasyOCR engine error'));
              }
            }
          } catch (parseErr) {
            console.warn('[EasyOCR Bridge] Non-JSON line from Python:', trimmed);
          }
        });

        this.process.on('error', (err) => {
          console.error('[EasyOCR Bridge] Python process error:', err);
          this.isReady = false;
          this.process = null;
          this.initPromise = null;
          reject(err);
        });

        this.process.on('exit', (code) => {
          console.warn(`[EasyOCR Bridge] Python process exited with code ${code}`);
          this.isReady = false;
          this.process = null;
          this.initPromise = null;

          this.pendingRequests.forEach(({ reject: reqReject }) => {
            reqReject(new Error(`EasyOCR process exited with code ${code}`));
          });
          this.pendingRequests.clear();
        });
      } catch (spawnErr) {
        this.initPromise = null;
        reject(spawnErr);
      }
    });

    return this.initPromise;
  }

  async processPages(pages: InputPage[]): Promise<OCRBreakdown> {
    await this.init();

    const proc = this.process;
    const procStdin = proc?.stdin;
    if (!proc || !procStdin) {
      throw new Error('EasyOCR process is not available');
    }

    const reqId = `req_${Date.now()}_${++this.requestCounter}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(reqId)) {
          this.pendingRequests.delete(reqId);
          reject(new Error('EasyOCR request timed out after 60 seconds'));
        }
      }, 60000);

      this.pendingRequests.set(reqId, {
        resolve: (data) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      const payload = JSON.stringify({ id: reqId, pages }) + '\n';
      procStdin.write(payload, 'utf-8');
    });
  }
}

const easyOCRManager = new EasyOCRManager();

// Pre-initialize EasyOCR in the background
easyOCRManager.init().catch((err) => {
  console.warn('[EasyOCR Bridge] Pre-initialization notice (will retry on first request):', err?.message || err);
});

// Tesseract.js Worker fallback
let sharedTesseractWorker: Worker | null = null;
let tesseractInitPromise: Promise<Worker> | null = null;

async function getTesseractWorker(): Promise<Worker> {
  if (sharedTesseractWorker) return sharedTesseractWorker;
  if (tesseractInitPromise) return tesseractInitPromise;

  tesseractInitPromise = (async () => {
    try {
      const worker = await createWorker('eng');
      sharedTesseractWorker = worker;
      return worker;
    } catch (err) {
      console.error('Failed to initialize Tesseract fallback worker:', err);
      tesseractInitPromise = null;
      throw err;
    }
  })();

  return tesseractInitPromise;
}

/**
 * Fallback OCR implementation using Tesseract.js
 */
async function performTesseractFallbackOCR(pages: InputPage[]): Promise<OCRBreakdown> {
  const allDetectedWords: DetectedWord[] = [];
  const pagesTranscriptions: PageTranscription[] = [];

  for (const page of pages) {
    const pageWords: DetectedWord[] = [];
    let pageFullText = page.text || '';
    let imgWidth = 1200;
    let imgHeight = 1550;

    const hasRealImage = page.imageBase64 && page.imageBase64.length > 200;

    if (hasRealImage) {
      try {
        const worker = await getTesseractWorker();
        const cleanBase64 = page.imageBase64!.replace(/^data:[a-zA-Z0-9/.-]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        try {
          const dimensions = imageSize(buffer);
          if (dimensions.width && dimensions.height) {
            imgWidth = dimensions.width;
            imgHeight = dimensions.height;
          }
        } catch {
          // ignore dimension error
        }

        const result = await worker.recognize(buffer, {}, { blocks: true });
        if (result.data.text && result.data.text.trim().length > 0) {
          pageFullText = result.data.text.trim();
        }

        const blocks = result.data.blocks || [];
        for (const block of blocks) {
          const paragraphs = block.paragraphs || [];
          for (const para of paragraphs) {
            const lines = para.lines || [];
            for (const line of lines) {
              const words = line.words || [];
              for (const w of words) {
                const textClean = (w.text || '').trim();
                if (!textClean) continue;

                const bbox = w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 };
                const ymin = Math.max(0, Math.min(1000, Math.round((bbox.y0 / imgHeight) * 1000)));
                const xmin = Math.max(0, Math.min(1000, Math.round((bbox.x0 / imgWidth) * 1000)));
                const ymax = Math.max(ymin, Math.min(1000, Math.round((bbox.y1 / imgHeight) * 1000)));
                const xmax = Math.max(xmin, Math.min(1000, Math.round((bbox.x1 / imgWidth) * 1000)));

                const conf = typeof w.confidence === 'number'
                  ? Math.max(0, Math.min(1, Number((w.confidence / 100).toFixed(2))))
                  : 0.95;

                pageWords.push({
                  word: textClean,
                  confidence: conf,
                  page_number: page.pageNumber,
                  box_2d: [ymin, xmin, ymax, xmax],
                  isFlaggedMistake: false,
                });
              }
            }
          }
        }
      } catch (ocrErr) {
        console.error(`Tesseract fallback failed on page ${page.pageNumber}:`, ocrErr);
      }
    }

    if (pageWords.length === 0 && pageFullText.length > 0) {
      const rawTokens = pageFullText.split(/\s+/).filter(Boolean);
      let currX = 140;
      let currY = 180;
      const colWidth = 720;
      const lineHeight = 44;

      rawTokens.forEach((token) => {
        const wordWidth = Math.max(30, token.length * 14);
        if (currX + wordWidth > 140 + colWidth) {
          currX = 140;
          currY += lineHeight;
        }

        const ymin = Math.max(0, Math.min(1000, Math.round((currY / imgHeight) * 1000)));
        const xmin = Math.max(0, Math.min(1000, Math.round((currX / imgWidth) * 1000)));
        const ymax = Math.max(ymin, Math.min(1000, Math.round(((currY + 28) / imgHeight) * 1000)));
        const xmax = Math.max(xmin, Math.min(1000, Math.round(((currX + wordWidth) / imgWidth) * 1000)));

        pageWords.push({
          word: token,
          confidence: 0.95,
          page_number: page.pageNumber,
          box_2d: [ymin, xmin, ymax, xmax],
          isFlaggedMistake: false,
        });

        currX += wordWidth + 12;
      });
    }

    allDetectedWords.push(...pageWords);
    pagesTranscriptions.push({
      pageNumber: page.pageNumber,
      text: pageFullText || pageWords.map((w) => w.word).join(' '),
    });
  }

  const transcribedFullText = pagesTranscriptions.map((pt) => pt.text).join('\n\n--- Page Break ---\n\n');

  return {
    words: allDetectedWords,
    transcribedFullText,
    pagesTranscriptions,
  };
}

/**
 * Gemini Vision OCR: sends images directly to Gemini and receives
 * per-word bounding boxes in the same normalized [ymin,xmin,ymax,xmax] 0-1000 format
 * used by EasyOCR. This is the fastest path – no local model needed.
 *
 * Throws on rate-limit (429 / RESOURCE_EXHAUSTED) so the caller can
 * fall back to the local EasyOCR engine.
 */
export async function performGeminiOCR(
  pages: InputPage[],
  apiKey: string,
  model = 'gemini-3.6-flash'
): Promise<OCRBreakdown> {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const ocrWordSchema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING, description: 'Exact word token as it appears in the image' },
      box_2d: {
        type: Type.ARRAY,
        description: 'Bounding box [ymin, xmin, ymax, xmax] normalized 0-1000',
        items: { type: Type.INTEGER },
      },
      confidence: { type: Type.NUMBER, description: 'Confidence score 0.0 to 1.0' },
      page_number: { type: Type.INTEGER, description: '1-indexed page number' },
    },
    required: ['word', 'box_2d', 'page_number'],
  };

  const pageResultSchema = {
    type: Type.OBJECT,
    properties: {
      page_number: { type: Type.INTEGER },
      full_text: { type: Type.STRING, description: 'Complete transcribed text for this page' },
      words: { type: Type.ARRAY, items: ocrWordSchema },
    },
    required: ['page_number', 'full_text', 'words'],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      pages: { type: Type.ARRAY, items: pageResultSchema },
    },
    required: ['pages'],
  };

  // Build content parts: one image per page
  const contentParts: any[] = [];
  for (const page of pages) {
    if (page.imageBase64 && page.imageBase64.length > 200) {
      const clean = page.imageBase64.replace(/^data:[a-zA-Z0-9/.-]+;base64,/, '');
      contentParts.push({
        inlineData: { mimeType: page.mimeType || 'image/jpeg', data: clean },
      });
    }
  }

  if (contentParts.length === 0) {
    throw new Error('No valid images provided for Gemini OCR.');
  }

  contentParts.push({
    text: `You are a precise OCR engine. Transcribe ALL text visible in the provided exam page image(s).
For each unique word token, provide:
- The exact word as written (do NOT correct typos or spelling mistakes)
- Its bounding box as [ymin, xmin, ymax, xmax] normalized to 0-1000 range (0=top-left, 1000=bottom-right)
- A confidence score between 0.0 and 1.0
- The 1-indexed page number it belongs to

Return every page transcription including the full_text and word-level breakdown.
Do NOT skip any word. Do NOT merge words. Do NOT invent words.
Images are presented in page order starting from page 1.`,
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini OCR returned empty response.');

  const parsed = JSON.parse(text) as { pages: Array<{ page_number: number; full_text: string; words: any[] }> };

  const allWords: DetectedWord[] = [];
  const pagesTranscriptions: PageTranscription[] = [];

  for (const p of parsed.pages) {
    const pWords: DetectedWord[] = (p.words || []).map((w: any) => ({
      word: String(w.word || '').trim(),
      confidence: typeof w.confidence === 'number' ? Math.max(0, Math.min(1, w.confidence)) : 0.95,
      page_number: p.page_number,
      box_2d: Array.isArray(w.box_2d) && w.box_2d.length === 4
        ? (w.box_2d.map((v: any) => Math.max(0, Math.min(1000, Math.round(Number(v))))) as [number, number, number, number])
        : [0, 0, 50, 100],
      isFlaggedMistake: false,
    })).filter((w: DetectedWord) => w.word.length > 0);

    allWords.push(...pWords);
    pagesTranscriptions.push({ pageNumber: p.page_number, text: p.full_text || pWords.map((w) => w.word).join(' ') });
  }

  const transcribedFullText = pagesTranscriptions.map((pt) => pt.text).join('\n\n--- Page Break ---\n\n');

  console.log(`[Gemini OCR] Extracted ${allWords.length} word tokens across ${parsed.pages.length} page(s).`);

  return { words: allWords, transcribedFullText, pagesTranscriptions };
}

/**
 * Performs high-accuracy Optical Character Recognition on submission pages
 * using local EasyOCR (with automatic fallback to Tesseract.js if needed).
 * This is used when Gemini OCR is unavailable (e.g. quota exhausted).
 */
export async function performDocumentOCR(pages: InputPage[]): Promise<OCRBreakdown> {
  try {
    console.log(`[OCR Engine] Executing EasyOCR extraction across ${pages.length} page(s)...`);
    const result = await easyOCRManager.processPages(pages);
    console.log(`[OCR Engine] EasyOCR completed successfully: extracted ${result.words.length} word tokens.`);
    return result;
  } catch (err: any) {
    console.warn('[OCR Engine] EasyOCR encountered an issue, activating Tesseract fallback:', err?.message || err);
    return performTesseractFallbackOCR(pages);
  }
}
