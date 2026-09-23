export interface DetectedWord {
  word: string;
  confidence: number; // 0.0 - 1.0
  page_number?: number; // 1-indexed page number
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  isFlaggedMistake?: boolean;
}

export interface PageTranscription {
  pageNumber: number;
  text: string;
}

export interface OCRBreakdown {
  words: DetectedWord[];
  transcribedFullText: string;
  pagesTranscriptions?: PageTranscription[];
}

export interface SyntaxDeduction {
  issue: string;
  deduction: number; // 1 to 2 points per instance
  explanation: string;
  location?: string;
  pageNumber?: number;
  lineNumber?: number;
  codeSnippet?: string;
}

export interface LogicalDeduction {
  error: string;
  severity?: 'minor' | 'major' | string;
  deduction: number;
  fix?: string;
  justification?: string;
  studentStep?: string;
  correctConcept?: string;
  pageNumber?: number;
  lineNumber?: number;
  affectedLines?: string;
}

export interface TranscribedCodeLine {
  lineNumber: number;
  lineContent: string;
  status: 'valid' | 'syntax_error' | 'logic_error' | 'illegible';
  note?: string;
  deduction?: number;
}

export interface PartialCreditItem {
  criterion: string;
  pointsAwarded: number;
  reason: string;
}

export interface GradingEvaluation {
  calculatedScore: number;
  maximumPoints: number;
  percentage: number;
  letterGrade: string;
  quickFeedback?: string; // A single concise sentence summarizing the result
  feedback: string;
  topicMismatch?: boolean;
  topicMismatchReason?: string;
  internalReferenceSummary?: string;
  autonomousReferenceSolution?: string;
  exactTranscribedCode?: string;
  transcribedCodeAnalysis?: TranscribedCodeLine[];
  assessmentSummary?: string;
  recognitionOfExcellence?: string[];
  praiseAndHighlights?: string[];
  syntaxDeductions: SyntaxDeduction[];
  logicalDeductions: LogicalDeduction[];
  partialCreditBreakdown?: PartialCreditItem[];
  strengths?: string[];
  constructiveFeedback?: string;
}

export interface ExamAssessmentResult {
  ocrBreakdown: OCRBreakdown;
  gradingEvaluation: GradingEvaluation;
}

export interface SubmissionPage {
  pageNumber: number;
  dataUrl: string;
  text?: string;
  width?: number;
  height?: number;
}

export interface SampleExam {
  id: string;
  subject: string;
  title: string;
  prompt: string;
  referenceSolution: string;
  maxPoints: number;
  scoringGuidelines: string;
  pages: {
    pageNumber: number;
    title: string;
    text: string;
  }[];
  accentColor: string;
  icon: string;
}
