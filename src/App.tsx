import React, { useState } from 'react';
import {
  Scan,
  Play,
  RefreshCw,
  FileJson,
  Printer,
  AlertCircle,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';
import { SubmissionUpload } from './components/SubmissionUpload';
import { OCRViewer } from './components/OCRViewer';
import { GradingCard } from './components/GradingCard';
import { JsonExportModal } from './components/JsonExportModal';
import { ExamAssessmentResult, SubmissionPage } from './types';

export default function App() {
  // Master Exam Question Prompt & Points (clean default question)
  const [questionPrompt, setQuestionPrompt] = useState<string>(
    'Write a Python function `isValid(s: str) -> bool` that determines whether an input string of brackets `()[]{}` is valid using a LIFO stack. The string is valid if open brackets close in the correct order and every close bracket has a matching open bracket of the same type.'
  );
  const [maxPoints, setMaxPoints] = useState<number>(100);

  // Submission State: Starts clean without pre-loaded files
  const [pages, setPages] = useState<SubmissionPage[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('');

  // Assessment & OCR Result state: Starts null
  const [result, setResult] = useState<ExamAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Synchronized Hover/Select between OCR Bounding Box and Transcribed Text
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Modals
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);

  // Clear submission
  const handleClearSubmission = () => {
    setPages([]);
    setCurrentPageNumber(1);
    setFileName('');
    setResult(null);
    setError(null);
  };

  // Run AI Assessment & OCR through EasyOCR Engine + Gemini Grader
  const handleRunAssessment = async () => {
    if (pages.length === 0) {
      setError('Please upload a student exam submission (PDF document or image) first.');
      return;
    }

    if (!questionPrompt.trim()) {
      setError('Please provide the Master Exam Question Prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(`Running high-precision OCR across ${pages.length} submission page(s)...`);

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Extracting word bounding boxes [ymin, xmin, ymax, xmax]...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Evaluating syntax & logic against question criteria...');
      }, 2500);

      const response = await fetch('/api/assess-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pages: pages.map((p) => ({
            pageNumber: p.pageNumber,
            imageBase64: p.dataUrl,
            mimeType: 'image/jpeg',
            text: p.text,
          })),
          masterQuestion: questionPrompt,
          maxPoints: maxPoints,
          model: 'gemini-3.8-flash',
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete exam assessment.');
      }

      setResult(data.data);
    } catch (err: any) {
      console.error('Assessment failed:', err);
      setError(err?.message || 'Failed to connect to assessment server.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleScoreOverride = (newScore: number) => {
    if (!result) return;
    setResult({
      ...result,
      gradingEvaluation: {
        ...result.gradingEvaluation,
        calculatedScore: newScore,
        percentage: Math.round((newScore / result.gradingEvaluation.maximumPoints) * 100),
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sleek Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              ExamLens
              <span className="text-indigo-400 font-medium text-xs hidden sm:inline">
                Multimodal OCR & Exam Evaluation
              </span>
            </h1>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2.5">
          {result && (
            <>
              <button
                onClick={() => setIsJsonModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
                title="Inspect JSON Output"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">JSON Output</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}

          <button
            onClick={handleRunAssessment}
            disabled={isLoading || pages.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Evaluate Exam</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Master Exam Question Prompt Bar */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Master Exam Question Prompt
              </label>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label className="text-xs text-slate-400">Max Points:</label>
              <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-12 bg-transparent text-indigo-300 font-mono text-xs font-bold text-center focus:outline-none"
                />
                <span className="text-slate-500 font-mono text-xs">pts</span>
              </div>
            </div>
          </div>

          <textarea
            rows={2}
            value={questionPrompt}
            onChange={(e) => setQuestionPrompt(e.target.value)}
            placeholder="Enter the Master Question (Gemini autonomously solves this benchmark without requiring manual answer keys)..."
            className="w-full bg-slate-950 text-slate-200 text-xs font-mono rounded-xl p-3 border border-slate-800 focus:border-indigo-500 focus:outline-none transition leading-relaxed resize-none"
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-rose-100">Action Required</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900/90 border border-indigo-800/60 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Scan className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <p className="text-xs text-slate-200 font-mono font-medium">
              {loadingStep || 'Processing OCR and evaluation...'}
            </p>
          </div>
        )}

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: Document Upload Area + Visual Image/PDF Reader with Bounding Boxes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Student Document
              </span>
              <SubmissionUpload
                pages={pages}
                fileName={fileName}
                onPagesChange={(newPages, fName) => {
                  setPages(newPages);
                  if (fName) setFileName(fName);
                  setResult(null);
                  setError(null);
                }}
                onClear={handleClearSubmission}
                currentPageNumber={currentPageNumber}
                onPageChange={setCurrentPageNumber}
              />
            </div>

            {/* Visual Reader & Bounding Box Viewer */}
            {pages.length > 0 && (
              <div className="h-[600px]">
                <OCRViewer
                  pages={pages}
                  currentPageNumber={currentPageNumber}
                  onPageChange={setCurrentPageNumber}
                  words={result ? result.ocrBreakdown.words : []}
                  hoveredWordIndex={hoveredWordIndex}
                  onHoverWord={setHoveredWordIndex}
                  selectedWordIndex={selectedWordIndex}
                  onSelectWord={setSelectedWordIndex}
                />
              </div>
            )}
          </div>

          {/* RIGHT PANE: Results & Evaluation without walls of text */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Assessment Results
            </span>

            {result ? (
              <GradingCard
                evaluation={result.gradingEvaluation}
                ocrBreakdown={result.ocrBreakdown}
                hoveredWordIndex={hoveredWordIndex}
                onHoverWord={setHoveredWordIndex}
                onOverrideScore={handleScoreOverride}
                currentPageNumber={currentPageNumber}
                onSelectPage={setCurrentPageNumber}
              />
            ) : (
              // Empty State before evaluation
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-200">
                    Awaiting Evaluation
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pages.length === 0
                      ? 'Upload a student exam file on the left, then click "Evaluate Exam" to begin high-precision OCR and grading.'
                      : 'File uploaded. Click "Evaluate Exam" at the top to scan code character-by-character and generate score deductions.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* JSON Inspector Modal */}
      <JsonExportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        result={result}
      />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-900 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        ExamLens • Multimodal OCR & Autonomous Code Evaluation
      </footer>
    </div>
  );
}
