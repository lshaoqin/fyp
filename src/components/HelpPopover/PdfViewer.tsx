'use client';

import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@radix-ui/react-icons';
import { Document, Page, pdfjs } from 'react-pdf';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const PDF_FILE = '/Guide to Elephant Reader.pdf';

export const PdfViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNextPage = () =>
    setPageNumber((p) => Math.min(numPages || p, p + 1));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-slate-950">
      <div className="flex-1 overflow-auto">
        <Document
          file={PDF_FILE}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <LoadingSpinner label="Loading guide..." />
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500 dark:text-gray-400">
              <p>Failed to load the guide. Please try again.</p>
            </div>
          }
        >
          <div className="flex justify-center py-4">
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </div>
        </Document>
      </div>

      {numPages !== null && numPages > 1 && (
        <div className="flex justify-center items-center gap-4 p-3 border-t bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 0)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
