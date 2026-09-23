import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { convertPdfToPages } from '../utils/pdfHelper';
import { SubmissionPage } from '../types';

interface SubmissionUploadProps {
  pages: SubmissionPage[];
  fileName?: string;
  onPagesChange: (pages: SubmissionPage[], fileName?: string) => void;
  onClear: () => void;
  currentPageNumber: number;
  onPageChange: (pageNum: number) => void;
}

export const SubmissionUpload: React.FC<SubmissionUploadProps> = ({
  pages,
  fileName,
  onPagesChange,
  onClear,
  currentPageNumber,
  onPageChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.match(/^image\/(png|jpeg|jpg|webp)$/i) ||
      file.name.match(/\.(png|jpe?g|webp)$/i);

    if (!isPdf && !isImage) {
      setUploadError('Please upload a PDF document (.pdf) or image scan (.png, .jpg, .webp).');
      return;
    }

    if (isPdf) {
      setIsPdfLoading(true);
      try {
        const convertedPages = await convertPdfToPages(file);
        if (convertedPages.length === 0) {
          throw new Error('No readable pages found in PDF.');
        }
        onPagesChange(convertedPages, file.name);
        onPageChange(1);
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        setUploadError(`Could not extract pages from PDF: ${err?.message || 'File corrupted'}`);
      } finally {
        setIsPdfLoading(false);
      }
    } else {
      // Image file
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const singlePage: SubmissionPage = {
            pageNumber: 1,
            dataUrl: event.target.result as string,
          };
          onPagesChange([singlePage], file.name);
          onPageChange(1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Clipboard paste support for quick image screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const hasFile = pages.length > 0;
  const currentThumbnail = pages[0]?.dataUrl;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileInput}
        className="hidden"
      />

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="flex-1">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Box: Empty State vs Uploaded State */}
      {!hasFile ? (
        // Empty State: Clean file icon, bold text "Upload Student Exam", subtitle "Drag & drop PDF or image (.png, .jpg, .pdf)"
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 select-none ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/30'
              : 'border-slate-800 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-100">Upload Student Exam</p>
            <p className="text-xs text-slate-400">Drag & drop PDF or image (.png, .jpg, .pdf)</p>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Click to browse files or paste screenshot (Ctrl+V)
          </span>
        </div>
      ) : (
        // Uploaded State: Display only thumbnail, file name, page count, and simple "X" (Remove) icon
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            {currentThumbnail ? (
              <img
                src={currentThumbnail}
                alt="Thumbnail"
                className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-slate-800">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {fileName || 'student-submission.png'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
              title="Replace file"
            >
              Replace
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isPdfLoading && (
        <div className="text-center py-2 text-xs text-indigo-300 font-mono animate-pulse">
          Rendering PDF pages...
        </div>
      )}
    </div>
  );
};
