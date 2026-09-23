import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Maximize2,
  FileText,
} from 'lucide-react';
import { DetectedWord, SubmissionPage } from '../types';

interface OCRViewerProps {
  pages: SubmissionPage[];
  currentPageNumber: number;
  onPageChange: (pageNumber: number) => void;
  words: DetectedWord[];
  hoveredWordIndex: number | null;
  onHoverWord: (index: number | null) => void;
  selectedWordIndex: number | null;
  onSelectWord: (index: number | null) => void;
}

export const OCRViewer: React.FC<OCRViewerProps> = ({
  pages,
  currentPageNumber,
  onPageChange,
  words,
  hoveredWordIndex,
  onHoverWord,
  selectedWordIndex,
  onSelectWord,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [boxDisplayMode, setBoxDisplayMode] = useState<'all' | 'flagged' | 'hover-only' | 'none'>('all');
  const [showConfidencePills, setShowConfidencePills] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Active page
  const currentPage = pages.find((p) => p.pageNumber === currentPageNumber) || pages[0];
  const totalPages = pages.length;

  // Filter words that belong to the current page
  const pageWords = words.map((w, index) => ({ ...w, originalIndex: index }))
    .filter((w) => (w.page_number ?? 1) === currentPageNumber);

  // Reset zoom & pan when switching page
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentPageNumber]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.6), 4));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
        {/* Left: Page Selector if multi-page */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>OCR Bounding Box Layer</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 ml-1">
              <button
                onClick={() => onPageChange(Math.max(currentPageNumber - 1, 1))}
                disabled={currentPageNumber <= 1}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300 font-medium">
                Page {currentPageNumber} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(currentPageNumber + 1, totalPages))}
                disabled={currentPageNumber >= totalPages}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Box Display Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setBoxDisplayMode('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              boxDisplayMode === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Words ({pageWords.length})
          </button>
          <button
            onClick={() => setBoxDisplayMode('flagged')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              boxDisplayMode === 'flagged'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flagged Only
          </button>
          <button
            onClick={() => setBoxDisplayMode('hover-only')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              boxDisplayMode === 'hover-only'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hover Only
          </button>
          <button
            onClick={() => setBoxDisplayMode('none')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
              boxDisplayMode === 'none'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hide all overlays"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfidencePills(!showConfidencePills)}
            className={`p-1.5 rounded-lg border transition ${
              showConfidencePills
                ? 'bg-indigo-950/70 border-indigo-700/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={showConfidencePills ? 'Hide text labels' : 'Show text labels'}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ minHeight: '520px' }}
      >
        {currentPage?.dataUrl ? (
          <div
            className="relative inline-block transition-transform duration-75 origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* The Document / Exam Page Image */}
            <img
              src={currentPage.dataUrl}
              alt={`Exam Scan Page ${currentPage.pageNumber}`}
              className="max-h-[640px] max-w-full w-auto object-contain rounded-lg shadow-2xl pointer-events-none border border-slate-800"
              draggable={false}
            />

            {/* Bounding Box Overlay Layer (Normalized 0 to 1000) */}
            {boxDisplayMode !== 'none' && (
              <div className="absolute inset-0 pointer-events-none">
                {pageWords.map((item) => {
                  const [ymin, xmin, ymax, xmax] = item.box_2d;
                  const topPercent = ymin / 10;
                  const leftPercent = xmin / 10;
                  const widthPercent = (xmax - xmin) / 10;
                  const heightPercent = (ymax - ymin) / 10;

                  const isHovered = hoveredWordIndex === item.originalIndex;
                  const isSelected = selectedWordIndex === item.originalIndex;
                  const isFlagged = item.isFlaggedMistake;

                  // Visibility condition based on mode
                  if (boxDisplayMode === 'flagged' && !isFlagged && !isHovered && !isSelected) {
                    return null;
                  }
                  if (boxDisplayMode === 'hover-only' && !isHovered && !isSelected) {
                    return null;
                  }

                  // Colors: Flagged mistake (Rose), Active Hover/Select (Amber/Indigo), Default (Emerald/Cyan)
                  let borderColor = 'border-emerald-400/80';
                  let bgColor = 'bg-emerald-500/15';
                  let textColor = 'text-emerald-300';

                  if (isFlagged) {
                    borderColor = 'border-rose-500';
                    bgColor = 'bg-rose-500/25';
                    textColor = 'text-rose-300';
                  }
                  if (isHovered || isSelected) {
                    borderColor = 'border-amber-400 ring-2 ring-amber-400/50';
                    bgColor = 'bg-amber-400/30';
                    textColor = 'text-amber-200';
                  }

                  return (
                    <div
                      key={item.originalIndex}
                      onMouseEnter={() => onHoverWord(item.originalIndex)}
                      onMouseLeave={() => onHoverWord(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWord(item.originalIndex);
                      }}
                      className={`absolute pointer-events-auto border cursor-pointer transition-all duration-100 rounded-[2px] ${borderColor} ${bgColor} ${
                        isHovered || isSelected ? 'z-30 scale-[1.02]' : 'z-10'
                      }`}
                      style={{
                        top: `${topPercent}%`,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                      title={`"${item.word}" (Confidence: ${Math.round(item.confidence * 100)}%)`}
                    >
                      {/* Floating Text Pill above bounding box */}
                      {showConfidencePills && (isHovered || isSelected || zoom > 1.3) && (
                        <div
                          className={`absolute -top-6 left-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-md border pointer-events-none ${
                            isFlagged
                              ? 'bg-rose-950 text-rose-200 border-rose-600'
                              : isHovered || isSelected
                              ? 'bg-amber-950 text-amber-200 border-amber-500'
                              : 'bg-slate-950/90 text-slate-200 border-slate-700'
                          }`}
                        >
                          <span>{item.word}</span>
                          <span className="opacity-70 ml-1 text-[9px]">
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500 text-xs">
            No document page loaded.
          </div>
        )}
      </div>

      {/* Multi-page thumbnail strip if PDF has multiple pages */}
      {totalPages > 1 && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Pages:</span>
          {pages.map((p) => {
            const isCurrent = p.pageNumber === currentPageNumber;
            const countForPage = words.filter((w) => (w.page_number ?? 1) === p.pageNumber).length;
            return (
              <button
                key={p.pageNumber}
                onClick={() => onPageChange(p.pageNumber)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 font-bold shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Page {p.pageNumber}</span>
                {countForPage > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {countForPage} w
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Footer Info / Selected Word Inspector */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {selectedWord ? (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-200 font-bold">Selected:</span>
              <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                "{selectedWord.word}"
              </span>
              <span className="text-slate-400">
                Page {selectedWord.page_number ?? 1} • Conf: {Math.round(selectedWord.confidence * 100)}%
              </span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                [{selectedWord.box_2d.join(', ')}]
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Hover or click any recognized word bounding box to inspect OCR coordinates</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span className="text-slate-600">|</span>
          <span>
            {pageWords.length} on page / {words.length} total
          </span>
        </div>
      </div>
    </div>
  );
};
