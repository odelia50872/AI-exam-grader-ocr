import React, { useState } from 'react';
import { X, Copy, Check, Download, FileJson } from 'lucide-react';
import { ExamAssessmentResult } from '../types';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExamAssessmentResult | null;
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'minimalist' | 'full'>('minimalist');

  if (!isOpen || !result) return null;

  const minimalistPayload = {
    ocrOutput: {
      transcribedCode:
        result.gradingEvaluation.exactTranscribedCode ||
        result.ocrBreakdown.transcribedFullText,
      wordTokens: result.ocrBreakdown.words.map((w) => ({
        word: w.word,
        box_2d: w.box_2d,
        confidence: w.confidence,
        pageNumber: w.page_number ?? 1,
      })),
    },
    gradingOutput: {
      totalScore: `${result.gradingEvaluation.calculatedScore} / ${result.gradingEvaluation.maximumPoints}`,
      calculatedScore: result.gradingEvaluation.calculatedScore,
      maxPoints: result.gradingEvaluation.maximumPoints,
      percentage: result.gradingEvaluation.percentage,
      letterGrade: result.gradingEvaluation.letterGrade,
      syntaxDeductions: result.gradingEvaluation.syntaxDeductions.map((s) => ({
        lineNumber: s.lineNumber ?? null,
        error: s.issue,
        pointsDeducted: -s.deduction,
      })),
      logicalDeductions: result.gradingEvaluation.logicalDeductions.map((l) => ({
        lineNumber: l.lineNumber ?? null,
        error: l.error,
        pointsDeducted: -l.deduction,
        fix: l.fix || l.correctConcept || null,
      })),
      quickFeedback:
        result.gradingEvaluation.quickFeedback ||
        result.gradingEvaluation.feedback,
    },
  };

  const activeJson =
    viewMode === 'minimalist' ? minimalistPayload : result;
  const formattedJson = JSON.stringify(activeJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-assessment-${viewMode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Assessment JSON Output
              </h3>
              <p className="text-xs text-slate-400">
                Direct OCR token coordinates (`box_2d`) and itemized grading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('minimalist')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'minimalist'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Minimalist Output
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'full'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Raw Output
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950 font-mono text-xs text-indigo-200 leading-relaxed">
          <pre className="selection:bg-indigo-700 selection:text-white">
            {formattedJson}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>
            {result.ocrBreakdown.words.length} OCR tokens (`box_2d`) • Total Score:{' '}
            <strong className="text-indigo-300 font-mono">
              {result.gradingEvaluation.calculatedScore} / {result.gradingEvaluation.maximumPoints}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
