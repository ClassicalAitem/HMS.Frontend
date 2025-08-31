import React, { useEffect, useState } from 'react';
import Table from '@/components/tableManager/Table';
import { PopupError } from '@/utils/alertMessage';
import { apiClient } from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';
import { CiSearch } from 'react-icons/ci';
import { CompanyTableColums } from '@/components/tableManager/ProductColumn';
import ConfirmationModal from '@/components/deleteConfirmation/ConfirmationModal';
import { paths } from '@/routes';
import { dateFormatter } from '@/utils/errorFormatter';

const AllCompaniesTable = () => {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResults] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetcCompanies = async (searchQuery = '') => {
    try {
      const url = endpoints.getAllCompanies;
      const response = await apiClient.get(searchQuery ? `${url}/?search=${searchQuery}` : url);
      if (searchQuery) {
        setSearchResults(response.data);
      } else {
        setCompanies(response.data);
        setSearchResults([]); // Reset search results when not searching
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'An error occurred');
    }
  };

  // Search products based on query
  useEffect(() => {
    const validQuery = /^[a-zA-Z0-9\s]+$/;
    if (query.length > 2 && validQuery.test(query)) {
      fetcCompanies(query);
    } else {
      fetcCompanies();
    }
  }, [query]);

  const transformProductData = (data) =>
    data.map((company, i) => ({
      id: company._id, // hidden in Table
      slug: company.slug, // Hidden in Table
      'S/No': i + 1,
      Name: company.name,
      Address: company.companyAddress,
      Email: company.companyEmail,
      Phone: company.hotline,
      Membership: company.membershipLevel,
      'Join Date': dateFormatter(company.createdAt),
      Status: company.verified
    }));

  // Determine which data to display
  const displayedData =
    searchResult.length > 0 ? transformProductData(searchResult) : transformProductData(companies);

  const handleDelete = (row) => {
    setItemToDelete(row);
    setOpenModal(true); // Open the modal
  };

  const confirmDelete = async () => {
    if (itemToDelete) {

      try {
        // Make an API call to delete the item
        await apiClient.delete(`${endpoints.adminDeleteCompany}/${itemToDelete.slug}`);

        // Remove the item from the list
        // companies((prev) => prev.filter((company) => company.id !== itemToDelete._id));

        setOpenModal(false); // Close the modal
        setItemToDelete(null); // Reset the item to delete
        window.location.reload()

      } catch (error) {
        console.error('Failed to delete the product', error);
      }
    }
  };

  return (
    <main>
      {error && <PopupError message={error} />}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={confirmDelete}
        message={'Deleting Temporarily disabled'}
      />

      <div className="w-full  rounded-md p-4 bg-white">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between my-4 gap-4 rounded-md">
          <p className=" text-sm font-bold">All Registered Companies</p>
          <div className="w-full md:w-[33%] flex items-center ring-1 ring-dark-gray rounded-md p-1">
            <CiSearch />
            <input
              type="search"
              placeholder="Search..."
              className="border-none h-7 focus:outline-none focus:ring-0 text-sm w-full"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <Table
          tableTitle="All Companies"
          columns={CompanyTableColums}
          data={displayedData}
          viewPath={paths.companyIndex}
          editPath={paths.updateCompany}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
};

export default AllCompaniesTable;
