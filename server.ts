import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { performDocumentOCR, InputPage } from './server/ocrService.js';

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

    // Step 1: Perform High-Accuracy Word-Level OCR using EasyOCR
    console.log(`[OCR Engine] Running EasyOCR across ${inputPages.length} submission page(s)...`);
    const ocrBreakdown = await performDocumentOCR(inputPages);
    console.log(`[OCR Engine] Extracted ${ocrBreakdown.words.length} words across ${inputPages.length} page(s).`);

    // Step 2: Build Gemini Request for Autonomous Solution Generation & Academic Assessment
    // We pass the transcribed text and image parts to Gemini
    const contentParts: any[] = [];

    // Attach images for visual context if available
    inputPages.forEach((p) => {
      if (p.imageBase64 && p.imageBase64.length > 200) {
        const clean = p.imageBase64.replace(/^data:[a-zA-Z0-9/.-]+;base64,/, '');
        contentParts.push({
          inlineData: {
            mimeType: p.mimeType || 'image/jpeg',
            data: clean,
          },
        });
      }
    });

    const promptText = `
You are an Expert AI Code Exam Evaluator and Precise Multimodal OCR Engine.
Your job is to provide accurate, fair, and clutter-free exam evaluation.

Student submission has ${inputPages.length} page(s).
Extracted text via high-precision visual OCR:
--- TRANSCRIBED STUDENT SUBMISSION (OCR) ---
${ocrBreakdown.transcribedFullText}

--- MASTER EXAM QUESTION PROMPT ---
${masterQuestion || 'Evaluate the student submission according to programming criteria.'}

Maximum Points Available: ${maxPoints}
${gradingGuidelines ? `Special Scoring Guidelines: ${gradingGuidelines}` : ''}

GRADING POLICIES:
1. AUTONOMOUS PROBLEM SOLVING:
   - Automatically deduce the correct solution and logic benchmark for the Master Exam Question Prompt. No manual answer key is required.

2. CORE LOGIC FOCUS:
   - If the student chose the correct algorithm/data structure (e.g., Stack for bracket matching), award the vast majority of points.

3. STRICT 1-POINT MAX FOR SYNTAX & TYPOS:
   - Deduct 1 point MAXIMUM per minor typo or syntax flaw (e.g., 'retur' instead of 'return', missing colon ':').
   - Do NOT double-penalize the same typo.
   - Do NOT penalize valid syntax (e.g., type hinting like 's: str' is 100% correct).

4. PROPORTIONAL LOGICAL DEDUCTIONS:
   - Deduct 1 to 2 points max for minor API mistakes (e.g., passing arguments to 'stack.pop()').
   - Deduct 5+ points only if the algorithm fundamentally fails to solve the problem.
   - For every logical flaw, specify the exact line number, a clear concise description, and an actionable quick fix.

5. OUTPUT STRUCTURE:
   - exactTranscribedCode: Clean, formatted code representing EXACTLY what was transcribed character-by-character.
   - calculatedScore: Math.max(0, maximumPoints - sum(syntaxDeductions.deduction) - sum(logicalDeductions.deduction)).
   - quickFeedback: A single, encouraging feedback sentence summarizing the result directly.
   - feedback: Exactly the same single encouraging feedback sentence.

Return your response strictly in JSON following the schema.
`;

    contentParts.push({ text: promptText });

    const selectedModel = model || 'gemini-2.5-flash';
    console.log(`[Assessment] Requesting autonomous evaluation via ${selectedModel}...`);

    const { response, modelUsed } = await callGeminiWithResilience(
      selectedModel,
      { parts: contentParts },
      gradingEvaluationSchema,
      0.1
    );

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No response text received from Gemini model.');
    }

    const evaluation = JSON.parse(textOutput);

    // Backward-compatibility aliases
    evaluation.praiseAndHighlights = evaluation.recognitionOfExcellence || [];
    evaluation.constructiveFeedback = evaluation.feedback || '';

    // Step 3: Synchronize Mistake Flags into OCR Word Tokens
    const mistakeWordsList: string[] = (evaluation.flaggedMistakeWords || []).map((w: string) =>
      w.toLowerCase().trim()
    );

    // Also collect syntax and logical mistake locations
    (evaluation.syntaxDeductions || []).forEach((sd: any) => {
      if (sd.location) mistakeWordsList.push(sd.location.toLowerCase().trim());
    });

    if (mistakeWordsList.length > 0) {
      ocrBreakdown.words = ocrBreakdown.words.map((detected) => {
        const cleanWord = detected.word.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isFlagged = mistakeWordsList.some(
          (m) =>
            m.includes(cleanWord) ||
            cleanWord.includes(m) ||
            (cleanWord.length > 3 && m.includes(cleanWord.slice(0, 4)))
        );
        return {
          ...detected,
          isFlaggedMistake: isFlagged,
        };
      });
    }

    res.json({
      success: true,
      data: {
        ocrBreakdown,
        gradingEvaluation: evaluation,
      },
      modelUsed: selectedModel,
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
    engine: 'EasyOCR Engine + Gemini 3.8 Autonomous Grader',
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
