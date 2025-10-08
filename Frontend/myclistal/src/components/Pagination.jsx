import React, { useState } from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

/**
 * Generate clean, consistent pagination numbers
 * Handles ellipses correctly for large page sets
 */
const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    // Show all pages if less than or equal to 5
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const delta = 1;

  // Always include the first page
  pages.push(1);

  // Add "..." if we’re far from the start
  if (currentPage - delta > 2) pages.push("...");

  // Middle pages
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    pages.push(i);
  }

  // Add "..." if we’re far from the end
  if (currentPage + delta < totalPages - 1) pages.push("...");

  // Always include the last page
  if (totalPages > 1) pages.push(totalPages);

  return pages;
};

const Pagination = ({ pagination, onPageChange }) => {
  // ✅ Support both "page" and "currentPage" from backend
  const currentPage = pagination.page || pagination.currentPage || 1;
  const totalPages = pagination.totalPages || 1;
  const [goToPage, setGoToPage] = useState("");

  const handleGoTo = () => {
    const value = Number(goToPage);
    if (value >= 1 && value <= totalPages) {
      onPageChange(value);
      setGoToPage("");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t gap-4">
      {/* Left: Pagination Controls */}
      <div className="flex items-center gap-1 bg-white rounded-full shadow-sm px-4 py-2">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer
            ${
              currentPage === 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer
            ${
              currentPage === 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Numbered Pages */}
        {getPageNumbers(currentPage, totalPages).map((item, idx) =>
          item === "..." ? (
            <span
              key={idx}
              className="px-3 py-1 text-gray-400 select-none text-sm"
            >
              ...
            </span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(item)}
              className={`w-10 h-10 flex items-center font-semibold justify-center rounded-full transition-all cursor-pointer
                ${
                  currentPage === item
                    ? "bg-blue-800 text-white border-blue-800 shadow-sm"
                    : "text-gray-800 hover:bg-blue-50 hover:text-blue-800"
                }`}
            >
              {item}
            </button>
          )
        )}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer
            ${
              currentPage === totalPages
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer
            ${
              currentPage === totalPages
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Go to page */}
      <div className="flex items-center gap-2 bg-white rounded-xl">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={goToPage}
          onChange={(e) => setGoToPage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
          className="w-16 border rounded-4xl px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleGoTo}
          className="px-3 py-1.5 rounded-4xl text-sm text-white bg-blue-800 hover:bg-blue-900 transition-all cursor-pointer"
        >
          Go
        </button>
      </div>
    </div>
  );
};

export default Pagination;
