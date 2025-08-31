'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { FaRegTrashAlt, FaPlus, FaRegEdit } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import useCategoryStore from '@/store/categoryStore';
import useSubCategoryStore from '@/store/subcategoryStore';
import useTertiaryCategory from '@/store/tertiaryCategoryStore';
import apiClient from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';

const CategoryForm = dynamic(() => import('../nextForms/CategoryForm'), {
  loading: () => <h2>Loading...</h2>
});

const SubcategoryForm = dynamic(() => import('../nextForms/SubcategoryForm'), {
  loading: () => <h2>Loading...</h2>
});

const SubSubcategoryForm = dynamic(() => import('../nextForms/Sub-SubCategoryForm'), {
  loading: () => <h2>Loading...</h2>
});

const AddSliderForm = dynamic(() => import('../nextForms/AddSliderForm'), {
  loading: () => <h2>Loading...</h2>
});

// const AddNewProduct = dynamic(() => import('../../app/next-dash/(admin-products)/products/add-product/page'), {
//   loading: () => <h2>Loading...</h2>
// });

const forms = {
  category: (type, data) => <CategoryForm type={type} data={data} />,
  subcategory: (type, data) => <SubcategoryForm type={type} data={data} />,
  subsubcategory: (type, data) => <SubSubcategoryForm type={type} data={data} />,
  slider: (type, data) => <AddSliderForm type={type} data={data} />
  //   products: (type, data) => <AddNewProduct type={type} data ={data} />
};

const FormModal = ({ table, type: initialType, id, data }) => {
  const { deleteCategory, isLoading } = useCategoryStore();
  const { deleteSubCategory } = useSubCategoryStore();
  const { deleteTerCategory } = useTertiaryCategory();
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState(initialType);

  const [sendingData, setSendingData] = useState(false);

  const size = initialType === 'create' ? 'w-8 h-7' : 'w-7 h-7';

  const bgColor = 'bg-gray';

  const iconType =
    initialType === 'update' ? (
      <FaRegEdit className="text-green" title="Edit" />
    ) : initialType === 'delete' ? (
      <FaRegTrashAlt className="text-danger" title="Delete" />
    ) : (
      <FaPlus className="text-green" title="Create New" />
    );

  const deleteOrUpdateItems = async (endpointUrl, itemId) => {
    setSendingData(true);
    await apiClient.delete(`${endpointUrl}/${itemId}`);
    setSendingData(false);
  };

  const handleDelete = async () => {
    if (table === 'category') {
      await deleteCategory(id);
      setOpen(false);
    } else if (table === 'subcategory') {
      await deleteSubCategory(id);
      setOpen(false);
    } else if (table === 'subsubcategory') {
      await deleteTerCategory(id);
      setOpen(false);
    } else if (table === 'slider') {
      await deleteOrUpdateItems(endpoints.deleteSlider, id);
      setOpen(false);
    } else if (table === 'products') {
      await deleteOrUpdateItems(endpoints.deleteProduct, id);
      setOpen(false);
    }
  };

  const renderDeleteConfirmation = () => (
    <form className="p-4 flex flex-col gap-4">
      <span className="text-center font-medium">
        Are you sure you want to delete this data from {table}?
      </span>
      <button
        type="button"
        className="bg-danger text-white py-2 px-4 rounded-md border-none self-center w-max"
        onClick={handleDelete}
      >
        {isLoading || sendingData ? 'Deleting...' : 'Delete'}
      </button>
    </form>
  );

  return (
    <div>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        {iconType}
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-dark bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <button
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <span className="text-lg">X</span>
            </button>
            {formType === 'delete' && id ? (
              renderDeleteConfirmation()
            ) : (
              <div className="text-center mt-4">
                {forms[table] ? forms[table](formType, data) : <p>Form not available</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormModal;
