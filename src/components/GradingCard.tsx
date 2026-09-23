import React, { useState } from 'react';
import {
  Copy,
  Check,
  Award,
  Edit3,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { GradingEvaluation, OCRBreakdown } from '../types';

interface GradingCardProps {
  evaluation: GradingEvaluation;
  ocrBreakdown: OCRBreakdown;
  hoveredWordIndex: number | null;
  onHoverWord: (index: number | null) => void;
  onOverrideScore: (newScore: number) => void;
  currentPageNumber?: number;
  onSelectPage?: (pageNumber: number) => void;
}

export const GradingCard: React.FC<GradingCardProps> = ({
  evaluation,
  ocrBreakdown,
  onOverrideScore,
}) => {
  const [isEditingScore, setIsEditingScore] = useState<boolean>(false);
  const [customScoreInput, setCustomScoreInput] = useState<string>(
    evaluation.calculatedScore.toString()
  );
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // Exact transcribed code
  const exactCode =
    evaluation.exactTranscribedCode || ocrBreakdown.transcribedFullText || '';
  const codeLines = exactCode.split('\n');

  // Single encouraging feedback sentence
  const summarySentence =
    evaluation.quickFeedback ||
    evaluation.feedback ||
    'Assessment completed with valid algorithmic structure.';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exactCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const handleSaveScore = () => {
    const val = parseFloat(customScoreInput);
    if (!isNaN(val) && val >= 0 && val <= evaluation.maximumPoints) {
      onOverrideScore(val);
      setIsEditingScore(false);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (pct >= 80) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    if (pct >= 70) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (pct >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* 1. OCR Transcribed Code (Clean syntax-highlighted block) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              OCR Transcribed Code
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {codeLines.length} lines
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            {hasCopiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block with line numbers */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto max-h-56 p-3 space-y-0.5">
            {codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const hasSyntax = evaluation.syntaxDeductions.some(
                (s) => s.lineNumber === lineNum
              );
              const hasLogic = evaluation.logicalDeductions.some(
                (l) => l.lineNumber === lineNum
              );

              return (
                <div
                  key={idx}
                  className={`flex items-start px-1.5 py-0.5 rounded transition ${
                    hasSyntax
                      ? 'bg-rose-950/40 text-rose-200'
                      : hasLogic
                      ? 'bg-amber-950/40 text-amber-200'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <span className="w-7 select-none text-[10px] text-right text-slate-600 pr-3 pt-0.5">
                    {lineNum}
                  </span>
                  <pre className="flex-1 font-mono whitespace-pre overflow-x-visible leading-relaxed">
                    {line || ' '}
                  </pre>
                  {hasSyntax && (
                    <span className="text-[10px] font-mono text-rose-400 ml-2 shrink-0">
                      -1 pt
                    </span>
                  )}
                  {hasLogic && (
                    <span className="text-[10px] font-mono text-amber-400 ml-2 shrink-0">
                      logic flaw
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Score Header: Large, bold score (e.g. 95 / 100) */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Final Evaluation Score
          </span>
          <div className="flex items-center gap-3 mt-1">
            {isEditingScore ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max={evaluation.maximumPoints}
                  value={customScoreInput}
                  onChange={(e) => setCustomScoreInput(e.target.value)}
                  className="w-16 bg-slate-900 text-white font-mono text-2xl font-black rounded px-2 py-0.5 text-center border border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <span className="text-xl font-mono text-slate-400">
                  / {evaluation.maximumPoints}
                </span>
                <button
                  onClick={handleSaveScore}
                  className="ml-2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setCustomScoreInput(evaluation.calculatedScore.toString());
                  setIsEditingScore(true);
                }}
                className="group flex items-baseline gap-2 cursor-pointer"
                title="Click to manually adjust score"
              >
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {evaluation.calculatedScore}
                </span>
                <span className="text-xl font-mono text-slate-400 font-semibold">
                  / {evaluation.maximumPoints}
                </span>
                <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-slate-400 ml-1" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${getScoreColor(
              evaluation.percentage
            )}`}
          >
            Grade {evaluation.letterGrade} • {evaluation.percentage}%
          </span>
        </div>
      </div>

      {/* 3. Itemized Deductions Table (Direct & Short) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Itemized Deductions
        </h3>

        {/* Syntax Flaws: Line Number | Error Found | -1 pt */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Bookmark className="w-3.5 h-3.5 text-rose-400" />
            <span>Syntax Flaws (1 pt max per minor typo)</span>
          </div>

          {evaluation.syntaxDeductions.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No syntax errors or typos found. Full credit awarded.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-28">Line Number</th>
                    <th className="py-2 px-3">Error Found</th>
                    <th className="py-2 px-3 text-right w-24">Deduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {evaluation.syntaxDeductions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-300 font-semibold">
                        {item.lineNumber ? `Line ${item.lineNumber}` : 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <span>{item.issue}</span>
                        {item.codeSnippet && (
                          <code className="ml-2 px-1.5 py-0.5 rounded bg-slate-900 text-rose-300 font-mono text-[10px] border border-slate-800">
                            {item.codeSnippet}
                          </code>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        -{item.deduction} pt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Logical Flaws: Line Number | Issue & Quick Fix | -1 to -2 pts */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Logical Flaws (Proportional deductions)</span>
          </div>

          {evaluation.logicalDeductions.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No logical or algorithmic flaws found. Full marks awarded.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-28">Line Number</th>
                    <th className="py-2 px-3">Issue & Quick Fix</th>
                    <th className="py-2 px-3 text-right w-24">Deduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {evaluation.logicalDeductions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-300 font-semibold">
                        {item.lineNumber
                          ? `Line ${item.lineNumber}`
                          : item.affectedLines
                          ? `Lines ${item.affectedLines}`
                          : 'Algorithm'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 space-y-1">
                        <p className="font-medium text-slate-100">{item.error}</p>
                        {(item.fix || item.correctConcept) && (
                          <p className="text-[11px] text-emerald-400 font-medium">
                            <span className="text-emerald-500 font-semibold">Fix: </span>
                            {item.fix || item.correctConcept}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        -{item.deduction} pt{item.deduction > 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Summary: A single, encouraging feedback sentence */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Summary
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {summarySentence}
          </p>
        </div>
      </div>
    </div>
  );
};
