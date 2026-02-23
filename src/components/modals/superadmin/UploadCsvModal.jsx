import React, { useState } from 'react';
import { FaTimes, FaFileUpload, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { uploadMedicalRecordCSV } from '@/services/api/medicalRecordAPI';

const UploadCsvModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    setFile(selectedFile);

    // Preview CSV content
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n').slice(0, 5); // Show first 5 lines
      setCsvPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target.result;
          const response = await uploadMedicalRecordCSV(csvContent);
          
          toast.success(
            `Successfully imported ${response.createdCount} record(s)${
              response.errors.length > 0 ? ` with ${response.errors.length} error(s)` : ''
            }`
          );

          if (response.errors.length > 0) {
            console.warn('CSV Import Errors:', response.errors);
            response.errors.forEach((error) => {
              toast.error(`Error: ${error}`, { duration: 3000 });
            });
          }

          setFile(null);
          setCsvPreview([]);
          onUploadSuccess();
          onClose();
        } catch (error) {
          const errorMessage = error.message || 'Failed to upload CSV';
          toast.error(errorMessage);
          console.error('CSV Upload Error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Error processing file');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      setCsvPreview([]);
      onClose();
    }
  };

  const downloadTemplate = () => {
    const template = 'name,category\nHeadache,symptoms\nDiabetes,medical_history';
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'medical_data_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-xl font-normal text-primary">Upload Medical Data CSV</h2>
              <p className="text-sm text-base-content/70">Import multiple medical records at once</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Template Download */}
          <div className="mb-4 p-3 bg-base-200 rounded-lg">
            <button
              onClick={downloadTemplate}
              className="btn btn-sm btn-ghost w-full gap-2"
            >
              <FaDownload className="w-4 h-4" />
              Download CSV Template
            </button>
            <p className="text-xs text-base-content/70 mt-2">
              CSV format: name, category (medical_history, symptoms, surgical, family, social, allergic, diagnosis)
            </p>
          </div>

          {/* File Input */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="font-medium label-text text-base-content">Select CSV File</span>
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="file-input file-input-bordered w-full"
            />
          </div>

          {/* CSV Preview */}
          {csvPreview.length > 0 && (
            <div className="mb-4 p-3 bg-base-200 rounded-lg max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-base-content mb-2">Preview:</p>
              <div className="text-xs font-mono text-base-content/70 space-y-1">
                {csvPreview.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="flex-1 btn btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <FaFileUpload className="w-4 h-4" />
                  Upload CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadCsvModal;
