import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { performDocumentOCR, InputPage } from './server/ocrService.js';
import { DetectedWord } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Support multi-page PDFs and high-resolution scans
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const gradingEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    topicMismatch: {
      type: Type.BOOLEAN,
      description:
        "True if the student's submission is about an entirely different topic or problem than the Master Question (e.g., Dijkstra algorithm instead of Bracket Matching). False if it addresses the question.",
    },
    topicMismatchReason: {
      type: Type.STRING,
      description:
        "Detailed explanation of why the submission does or does not match the master exam question topic.",
    },
    internalReferenceSummary: {
      type: Type.STRING,
      description:
        "A concise statement of what the correct answer/approach requires, autonomously deduced by the AI.",
    },
    autonomousReferenceSolution: {
      type: Type.STRING,
      description:
        "The complete, fully correct step-by-step reference solution autonomously generated as the benchmark.",
    },
    calculatedScore: {
      type: Type.NUMBER,
      description:
        "Total calculated score awarded (0 if topicMismatch is true, otherwise maxPoints minus deductions).",
    },
    maximumPoints: {
      type: Type.NUMBER,
      description: "Maximum points allocated for this question.",
    },
    percentage: {
      type: Type.NUMBER,
      description: "Calculated score percentage (0 to 100).",
    },
    letterGrade: {
      type: Type.STRING,
      description: "Grade letter (A+, A, B, C, D, or F).",
    },
    exactTranscribedCode: {
      type: Type.STRING,
      description:
        "Clean, formatted Python code block representing EXACTLY what was transcribed from the student's submission character-by-character without inventing or fixing anything.",
    },
    transcribedCodeAnalysis: {
      type: Type.ARRAY,
      description: "Line-by-line verification of the transcribed code.",
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: { type: Type.INTEGER, description: "Line number (1-indexed)" },
          lineContent: { type: Type.STRING, description: "Exact code on this line" },
          status: {
            type: Type.STRING,
            description: "Line status: 'valid', 'syntax_error', 'logic_error', or 'illegible'",
          },
          note: { type: Type.STRING, description: "Explanation of validity or error on this line" },
          deduction: { type: Type.NUMBER, description: "Points deducted for this specific line, if any" },
        },
        required: ["lineNumber", "lineContent", "status"],
      },
    },
    assessmentSummary: {
      type: Type.STRING,
      description: "Overall rigorous code assessment summary.",
    },
    recognitionOfExcellence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Explicit recognition of sound algorithmic design, valid data structures, and correct steps. (Empty if code is non-functional or gibberish).",
    },
    syntaxDeductions: {
      type: Type.ARRAY,
      description:
        "Itemized list of minor syntax errors or typos. Rule: Deduct 1 point maximum per minor syntax error or typo (e.g. 'retur' instead of 'return'). Do NOT penalize valid language features or type hints. Do NOT double-count.",
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: { type: Type.INTEGER, description: "Line number where error or typo occurred" },
          issue: { type: Type.STRING, description: "Concise description of the syntax error or typo" },
          deduction: { type: Type.NUMBER, description: "Deduct 1 point maximum per minor typo" },
          explanation: { type: Type.STRING, description: "Short, direct note addressing the error" },
          codeSnippet: { type: Type.STRING, description: "Exact code snippet" },
          location: { type: Type.STRING, description: "Specific token or keyword" },
          pageNumber: { type: Type.INTEGER, description: "Page number" },
        },
        required: ["issue", "deduction"],
      },
    },
    logicalDeductions: {
      type: Type.ARRAY,
      description:
        "Itemized list of logical and algorithmic deductions. Rule: Deduct small, proportional points (-1 to -2 pts) for minor API mistakes (e.g. passing arguments to stack.pop()). Deduct larger points only if core algorithm logic fails completely.",
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: { type: Type.INTEGER, description: "Line number where logical error occurred" },
          error: { type: Type.STRING, description: "Concise description of the logical flaw" },
          deduction: { type: Type.NUMBER, description: "Proportional deduction (-1 to -2 pts for minor API, larger only if core logic fails)" },
          fix: { type: Type.STRING, description: "Direct and actionable fix" },
          severity: { type: Type.STRING, description: "minor or major" },
          justification: { type: Type.STRING, description: "Short justification" },
          studentStep: { type: Type.STRING, description: "Specific code step" },
          correctConcept: { type: Type.STRING, description: "Target concept" },
          affectedLines: { type: Type.STRING, description: "Lines affected" },
          pageNumber: { type: Type.INTEGER, description: "Page number" },
        },
        required: ["error", "deduction", "fix"],
      },
    },
    partialCreditBreakdown: {
      type: Type.ARRAY,
      description:
        "Partial credit awarded for correct steps or valid reasoning",
      items: {
        type: Type.OBJECT,
        properties: {
          criterion: { type: Type.STRING, description: "Step or concept correctly demonstrated" },
          pointsAwarded: { type: Type.NUMBER, description: "Points earned" },
          reason: { type: Type.STRING, description: "Why credit was granted" },
        },
        required: ["criterion", "pointsAwarded", "reason"],
      },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key areas where the student demonstrated solid understanding",
    },
    quickFeedback: {
      type: Type.STRING,
      description: "A single concise sentence summarizing the result without fluff.",
    },
    feedback: {
      type: Type.STRING,
      description: "A single concise sentence summarizing the assessment result directly.",
    },
    flaggedMistakeWords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Words or short phrases from the student's submission that contain spelling errors, syntax slips, or false claims.",
    },
  },
  required: [
    "calculatedScore",
    "maximumPoints",
    "percentage",
    "letterGrade",
    "exactTranscribedCode",
    "syntaxDeductions",
    "logicalDeductions",
    "quickFeedback",
    "feedback",
  ],
};

async function callGeminiWithResilience(
  preferredModel: string,
  contents: any,
  schema?: any,
  temperature: number = 0.1
) {
  // Map any legacy or deprecated model identifiers to authoritative active models
  let normalizedPreferred = preferredModel;
  if (
    preferredModel.includes('2.5') ||
    preferredModel.includes('2.0') ||
    preferredModel.includes('1.5') ||
    preferredModel.includes('3.6') ||
    preferredModel.includes('3.7') ||
    preferredModel.includes('3.5')
  ) {
    normalizedPreferred = 'gemini-3.8-flash';
  }

  const candidates = Array.from(
    new Set([normalizedPreferred, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'])
  );

  let lastError: any = null;
  for (const model of candidates) {
    try {
      console.log(`[Gemini Engine] Attempting request with model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          ...(schema ? { responseSchema: schema } : {}),
          temperature,
        },
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini Engine] Model ${model} encountered error:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError;
}

// 1. Autonomous Solution Generator Endpoint
// Allows the instructor to autonomously deduce the complete reference solution and benchmark without manual key
app.post('/api/generate-solution', async (req, res) => {
  try {
    const { masterQuestion, maxPoints = 20, model = 'gemini-2.5-flash' } = req.body;

    if (!masterQuestion || !masterQuestion.trim()) {
      return res.status(400).json({ error: 'Master question prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const solutionPrompt = `
You are an expert academic professor and grading authority.
For the following Master Exam Question, autonomously deduce:
1. "internalReferenceSummary": A concise 1-2 sentence statement of what the optimal solution requires.
2. "referenceSolution": The complete, fully correct, step-by-step reference solution and expected reasoning benchmark.
3. "keyCriteria": An array of key grading criteria and partial credit benchmarks (total points: ${maxPoints}).

--- MASTER EXAM QUESTION ---
${masterQuestion}

Return strictly JSON matching this structure:
{
  "internalReferenceSummary": "...",
  "referenceSolution": "...",
  "keyCriteria": ["..."]
}
`;

    const { response, modelUsed } = await callGeminiWithResilience(
      model,
      solutionPrompt,
      undefined,
      0.2
    );

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed, modelUsed });
  } catch (err: any) {
    console.error('Error generating autonomous solution:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to deduce reference solution.' });
  }
});

// 2. Main Exam Assessment Route:
// Uses EasyOCR for word-level OCR extraction, then feeds transcribed submission
// to Gemini for autonomous solution deduction, topic verification, and lenient academic grading.
app.post('/api/assess-exam', async (req, res) => {
  try {
    const {
      pages, // Array of { pageNumber: number, imageBase64?: string, mimeType?: string, text?: string }
      imageBase64,
      submissionText,
      mimeType = 'image/jpeg',
      masterQuestion,
      referenceSolution,
      maxPoints = 20,
      gradingGuidelines,
      model = 'gemini-3.8-flash',
    } = req.body;

    // Normalize input pages
    const inputPages: InputPage[] = [];
    if (pages && Array.isArray(pages) && pages.length > 0) {
      pages.forEach((p: { pageNumber: number; imageBase64?: string; mimeType?: string; text?: string }) => {
        inputPages.push({
          pageNumber: p.pageNumber,
          imageBase64: p.imageBase64,
          mimeType: p.mimeType || 'image/jpeg',
          text: p.text,
        });
      });
    } else if (imageBase64 || submissionText) {
      inputPages.push({
        pageNumber: 1,
        imageBase64: imageBase64,
        mimeType: mimeType,
        text: submissionText,
      });
    }

    if (inputPages.length === 0) {
      return res.status(400).json({ error: 'Missing student submission images, PDF pages, or submission text.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the server environment.' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UNIFIED SINGLE-CALL APPROACH:
    // Gemini reads the images ONCE and returns both:
    //   (a) per-word OCR bounding boxes  [ymin, xmin, ymax, xmax] normalized 0-1000
    //   (b) full grading evaluation JSON
    // This eliminates the previous 2-round-trip penalty (OCR call then Grading call).
    //
    // FALLBACK: If Gemini returns a quota/rate-limit error we run local EasyOCR
    // for the bounding-boxes, then make a single Grading-only Gemini call.
    // ─────────────────────────────────────────────────────────────────────────

    const isQuotaError = (err: any): boolean => {
      const msg: string = (err?.message || err?.status || '').toLowerCase();
      const code = Number(err?.status || err?.code || 0);
      return (
        code === 429 ||
        msg.includes('resource_exhausted') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('too many requests')
      );
    };

    // Combined schema: OCR words + grading fields in one JSON object
    const combinedSchema = {
      type: Type.OBJECT,
      properties: {
        // ── OCR output ───────────────────────────────────────────────────────
        ocrWords: {
          type: Type.ARRAY,
          description: 'Every word token extracted from the exam images with its bounding box.',
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              box_2d: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: '[ymin, xmin, ymax, xmax] 0-1000' },
              confidence: { type: Type.NUMBER },
              page_number: { type: Type.INTEGER },
            },
            required: ['word', 'box_2d', 'page_number'],
          },
        },
        ocrFullText: { type: Type.STRING, description: 'Complete transcribed text from all pages.' },
        // ── Grading output (same as gradingEvaluationSchema) ─────────────────
        ...gradingEvaluationSchema.properties,
      },
      required: ['ocrWords', 'ocrFullText', ...gradingEvaluationSchema.required],
    };

    // Build image parts
    const imageParts: any[] = [];
    inputPages.forEach((p) => {
      if (p.imageBase64 && p.imageBase64.length > 200) {
        const clean = p.imageBase64.replace(/^data:[a-zA-Z0-9/.-]+;base64,/, '');
        imageParts.push({ inlineData: { mimeType: p.mimeType || 'image/jpeg', data: clean } });
      }
    });

    const combinedPrompt = `You are simultaneously an expert OCR engine AND an expert Code Exam Evaluator.
Given the exam submission image(s), perform BOTH tasks in a single pass:

═══ TASK 1 — WORD-LEVEL OCR ═══
Transcribe EVERY word visible in the image(s).
For each word provide:
- word: the exact string as written (do NOT fix typos or spelling)
- box_2d: [ymin, xmin, ymax, xmax] normalized 0-1000 (top-left is 0,0; bottom-right is 1000,1000)
- confidence: 0.0–1.0
- page_number: 1-indexed
Also output ocrFullText: the complete transcribed text.

═══ TASK 2 — AUTONOMOUS GRADING ═══
Master Exam Question: ${masterQuestion || 'Evaluate the student submission according to programming criteria.'}
Maximum Points: ${maxPoints}
${gradingGuidelines ? `Special Guidelines: ${gradingGuidelines}` : ''}

GRADING RULES:
1. AUTONOMOUS SOLVING: Deduce the correct solution yourself — no answer key needed.
2. CORE LOGIC FOCUS: Correct algorithm/data-structure choice earns the vast majority of points.
3. SYNTAX TOLERANCE: Deduct ≤1 pt per minor typo/syntax slip. Never penalise valid syntax (e.g. type hints).
4. PROPORTIONAL LOGIC DEDUCTIONS: Minor API mistakes = −1 to −2 pts. Fundamental algorithm failure = −5+ pts.
5. calculatedScore = Math.max(0, maximumPoints − Σ syntaxDeductions − Σ logicalDeductions).
6. quickFeedback & feedback = one encouraging sentence summarising the result.

Return your complete response strictly in the JSON schema provided.`;

    let ocrBreakdown: any;
    let evaluation: any;
    let ocrEngine = 'Gemini Vision (unified OCR+Grading)';

    const selectedModel = model || 'gemini-3.6-flash';

    try {
      console.log(`[Unified Engine] Single-call OCR+Grading via ${selectedModel} across ${inputPages.length} page(s)...`);

      const contentParts = [...imageParts, { text: combinedPrompt }];
      const { response, modelUsed } = await callGeminiWithResilience(
        selectedModel,
        { parts: contentParts },
        combinedSchema,
        0.1
      );

      const textOutput = response.text;
      if (!textOutput) throw new Error('Empty response from Gemini unified call.');

      const combined = JSON.parse(textOutput);

      // ── Build OCRBreakdown from unified response ───────────────────────────
      const rawWords: DetectedWord[] = (combined.ocrWords || []).map((w: any) => ({
        word: String(w.word || '').trim(),
        confidence: typeof w.confidence === 'number' ? Math.max(0, Math.min(1, w.confidence)) : 0.95,
        page_number: Number(w.page_number) || 1,
        box_2d: Array.isArray(w.box_2d) && w.box_2d.length === 4
          ? w.box_2d.map((v: any) => Math.max(0, Math.min(1000, Math.round(Number(v))))) as [number, number, number, number]
          : [0, 0, 50, 100] as [number, number, number, number],
        isFlaggedMistake: false,
      })).filter((w: DetectedWord) => w.word.length > 0);

      // Build per-page transcriptions
      const pageMap = new Map<number, string[]>();
      rawWords.forEach((w) => {
        const pg = w.page_number ?? 1;
        if (!pageMap.has(pg)) pageMap.set(pg, []);
        pageMap.get(pg)!.push(w.word);
      });
      const pagesTranscriptions = Array.from(pageMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([pageNumber, words]) => ({ pageNumber, text: words.join(' ') }));

      ocrBreakdown = {
        words: rawWords,
        transcribedFullText: combined.ocrFullText || pagesTranscriptions.map((p) => p.text).join('\n\n--- Page Break ---\n\n'),
        pagesTranscriptions,
      };

      // ── Extract grading evaluation ─────────────────────────────────────────
      evaluation = combined;
      console.log(`[Unified Engine] Done — ${rawWords.length} words, score ${evaluation.calculatedScore}/${evaluation.maximumPoints} via ${modelUsed}.`);

    } catch (unifiedErr: any) {
      if (!isQuotaError(unifiedErr)) throw unifiedErr;

      // ── Quota fallback: local EasyOCR → separate Gemini grading call ───────
      console.warn('[Unified Engine] Gemini quota limit hit — falling back to EasyOCR + separate grading call...');
      ocrEngine = 'EasyOCR (local fallback) + Gemini Grading';

      ocrBreakdown = await performDocumentOCR(inputPages);
      console.log(`[OCR Fallback] EasyOCR extracted ${ocrBreakdown.words.length} words.`);

      const fallbackParts = [...imageParts, {
        text: `You are an Expert AI Code Exam Evaluator.
Student submission has ${inputPages.length} page(s).
Extracted text via high-precision OCR:
--- TRANSCRIBED SUBMISSION ---
${ocrBreakdown.transcribedFullText}

--- MASTER EXAM QUESTION ---
${masterQuestion || 'Evaluate the student submission according to programming criteria.'}
Maximum Points: ${maxPoints}
${gradingGuidelines ? `Special Scoring Guidelines: ${gradingGuidelines}` : ''}

GRADING RULES:
1. Deduce the correct solution autonomously — no answer key needed.
2. Correct algorithm/data-structure choice earns the vast majority of points.
3. Deduct ≤1 pt per minor typo/syntax slip. Never penalise valid syntax.
4. Minor API mistakes = −1 to −2 pts. Fundamental failure = −5+ pts.
5. calculatedScore = Math.max(0, maximumPoints − Σ syntaxDeductions − Σ logicalDeductions).
6. quickFeedback & feedback = one encouraging sentence.
Return strictly in JSON per schema.`,
      }];

      const { response: fallbackResponse } = await callGeminiWithResilience(
        selectedModel,
        { parts: fallbackParts },
        gradingEvaluationSchema,
        0.1
      );

      const fallbackText = fallbackResponse.text;
      if (!fallbackText) throw new Error('No response text from Gemini grading fallback.');
      evaluation = JSON.parse(fallbackText);
    }

    // ── Backward-compat aliases ────────────────────────────────────────────
    evaluation.praiseAndHighlights = evaluation.recognitionOfExcellence || [];
    evaluation.constructiveFeedback = evaluation.feedback || '';

    // ── Flag mistake words in OCR tokens ──────────────────────────────────
    const mistakeWordsList: string[] = (evaluation.flaggedMistakeWords || []).map((w: string) =>
      w.toLowerCase().trim()
    );
    (evaluation.syntaxDeductions || []).forEach((sd: any) => {
      if (sd.location) mistakeWordsList.push(sd.location.toLowerCase().trim());
    });

    if (mistakeWordsList.length > 0) {
      ocrBreakdown.words = ocrBreakdown.words.map((detected: DetectedWord) => {
        const cleanWord = detected.word.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isFlagged = mistakeWordsList.some(
          (m) =>
            m.includes(cleanWord) ||
            cleanWord.includes(m) ||
            (cleanWord.length > 3 && m.includes(cleanWord.slice(0, 4)))
        );
        return { ...detected, isFlaggedMistake: isFlagged };
      });
    }

    res.json({
      success: true,
      data: { ocrBreakdown, gradingEvaluation: evaluation },
      modelUsed: selectedModel,
      ocrEngine,
    });

  } catch (error: any) {
    console.error('Error during exam assessment:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process exam submission and OCR.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Gemini Vision OCR (with EasyOCR local fallback on quota) + Gemini Autonomous Grader',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ExamLens server running on http://localhost:${PORT}`);
    console.log(`Local network: http://127.0.0.1:${PORT}`);
  });
}

startServer();
