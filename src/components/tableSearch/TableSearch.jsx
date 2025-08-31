import React from 'react';
import { CiSearch } from 'react-icons/ci';

const TableSearch = () => {
  return (
    <div className=" w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-dark-gray px-2">
      <CiSearch className="w-12 h-12" />
      <input
        type="text"
        placeholder="Search..."
        className="border-none w-[150px] p-2 bg-transparent focus:ring-0"
      />
    </div>
  );
};

export default TableSearch;
