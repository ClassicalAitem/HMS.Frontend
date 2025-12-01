/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from 'react';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

const DataTable = ({ 
  data = [], 
  columns = [], 
  searchable = true, 
  sortable = true, 
  paginated = true,
  initialEntriesPerPage = 5,
  className = "",
  searchPlaceholder = "Search...",
  showEntries = true,
  maxHeight = "max-h-64 sm:max-h-72 md:max-h-80 lg:min-h-[50vh] 2xl:min-h-[60vh]", // Responsive default
  onRowClick = null
}) => {
  // State for search, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(initialEntriesPerPage);

  // Memoized data for performance
  const memoizedData = useMemo(() => data, [data]);

  // Filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = memoizedData;

    // Apply search filter if searchable
    if (searchable && searchTerm) {
      filtered = memoizedData.filter(item => {
        return columns.some(column => {
          const value = item[column.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply sorting if sortable
    if (sortable && sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string sorting
        const aString = String(aValue || '').toLowerCase();
        const bString = String(bValue || '').toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aString < bString ? -1 : aString > bString ? 1 : 0;
        } else {
          return aString > bString ? -1 : aString < bString ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [memoizedData, searchTerm, sortConfig, columns, searchable, sortable]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = paginated ? filteredAndSortedData.slice(startIndex, endIndex) : filteredAndSortedData;

  // Sorting handler
  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEntriesChange = (entries) => {
    setEntriesPerPage(entries);
    setCurrentPage(1);
  };

  // Sort icon renderer
  const getSortIcon = (columnKey) => {
    if (!sortable) return null;
    if (sortConfig.key !== columnKey) {
      return <FaSort className="w-3 h-3 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="w-3 h-3 text-primary" />
      : <FaSortDown className="w-3 h-3 text-primary" />;
  };

  // Render cell content
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    return item[column.key];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Controls */}
      {searchable && (
        <div className="flex gap-4 justify-between items-center mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
              <FaSearch className="w-4 h-4 text-base-content/50" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full input input-bordered input-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transition-colors transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                <IoClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Table */}
      <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
        <div className={`overflow-auto ${maxHeight}`}>
          <table className="table w-full table-zebra">
            <thead className="sticky top-0 z-10 bg-base-200">
              <tr className="">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`border border-base-300 px-4 py-3 text-left text-xs font-medium 2xl:text-sm text-base-content/60 uppercase tracking-wider ${
                      sortable && column.sortable !== false 
                        ? 'cursor-pointer hover:bg-base-300 transition-colors' 
                        : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex gap-2 items-center">
                      {column.title || column.key}
                      {column.sortable !== false && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className={`text-xs transition-colors hover:bg-base-200/50 ${
                      onRowClick ? 'cursor-pointer hover:shadow-md' : ''
                    }`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`border border-base-300 px-4 2xl:py-3 py-2 2xl:text-sm text-xs ${column.className || 'text-base-content/70'} ${
                          column.truncate ? 'max-w-xs truncate' : 'whitespace-nowrap'
                        }`}
                      >
                        {renderCell(item, column)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-base-content/50">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination and Info - Always show when paginated */}
      {paginated && (
        <div className="flex flex-col justify-between items-center px-2 mt-4 lg:flex-row">
          <div className="py-2 text-sm text-base-content/70">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
          </div>
          
          <div className="flex gap-4 justify-center items-center">
            {/* Show Entries - Always visible when paginated */}
            {showEntries && (
              <div className="flex flex-shrink-0 gap-1 items-center lg:gap-2">
                <span className="text-sm text-base-content/70">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => handleEntriesChange(Number(e.target.value))}
                  className="w-20 select select-bordered select-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-base-content/70">entries</span>
              </div>
            )}
            
            {/* Pagination Controls - Only show when multiple pages */}
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-circle btn-ghost disabled:opacity-50"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Show first 5 pages, or pages around current page
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`btn btn-sm ${
                          currentPage === page 
                            ? 'btn-primary' 
                            : 'btn-ghost'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm btn-circle btn-ghost disabled:opacity-50"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
