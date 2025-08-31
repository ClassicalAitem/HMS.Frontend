'use client';

// const Pagination = ({ totalPages, currentPage, onPageChange }) => {
//   // Function to change page
//   const handlePageChange = (page) => {
//     if (page !== currentPage && page > 0 && page <= totalPages) {
//       onPageChange(page); // Call parent function to update page
//     }
//   };

//   return (
//     <div className="flex w-full flex-wrap items-center number per-page mt-s mb-[60px]">
//       <div className="2xs:mt-0 flex flex-1 text-xs pagination_num intems-center space-x-2 mt-s sm:ml-[32px] lg:text-sm xl:ml-16">
//         {/* Render previous page */}
//         {currentPage > 1 && (
//           <a
//             to="#"
//             onClick={() => handlePageChange(currentPage - 1)}
//             className="block rounded-sm border px-2 font-semibold text-white transition-colors duration-200 leading-[28px] h-[28px] bg-green border-gray hover:bg-light-green"
//           >
//             &#8592; Previous
//           </a>
//         )}

//         {/* Render current page */}
//         <strong className="block px-2 font-semibold leading-[28px] text-green">
//           {currentPage}
//         </strong>

//         {/* Example pages for simplicity */}
//         {[...Array(totalPages)].map((_, idx) => (
//           <a
//             key={idx}
//             to="#"
//             onClick={() => handlePageChange(idx + 1)}
//             className={`block rounded-sm border px-2 leading-[28px] h-[28px] ${
//               currentPage === idx + 1 ? 'bg-green text-white' : 'bg-light-gray border-dark-gray'
//             }`}
//           >
//             {idx + 1}
//           </a>
//         ))}

//         {/* Render next page */}
//         {currentPage < totalPages && (
//           <a
//             to="#"
//             onClick={() => handlePageChange(currentPage + 1)}
//             className="block rounded-sm border px-2 font-semibold text-white transition-colors duration-200 leading-[28px] h-[28px] bg-green border-gray hover:bg-light-green"
//           >
//             Next <i className="text-sm">&#8594;</i>
//           </a>
//         )}
//       </div>
//     </div>
//   );
// };

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  // Ensure totalPages is a valid number
  const validTotalPages = totalPages > 0 ? totalPages : 0;

  return (
    <div>
      {/* Check if validTotalPages is greater than 0 before mapping */}
      {validTotalPages > 0 && (
        <>
          {/* Create pagination links */}
          {[...Array(validTotalPages)].map((_, idx) => (
            <a
              key={idx}
              to="#"
              onClick={() => onPageChange({ page: idx + 1, limit: 10 })} // Assuming limit is 10
            >
              {idx + 1}
            </a>
          ))}
        </>
      )}
    </div>
  );
};

export default Pagination;
