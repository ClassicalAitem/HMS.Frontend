import React, { useState, useEffect } from 'react';
import { IoClose, IoChevronBack, IoChevronForward, IoDownload, IoImage } from 'react-icons/io5';
import { FaFilePdf, FaFile } from 'react-icons/fa';

const AttachmentViewerModal = ({ isOpen, onClose, attachments = [], initialIndex = 0, title = "Attachments" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && attachments.length > 0) {
      setCurrentIndex(Math.min(initialIndex, attachments.length - 1));
    }
  }, [isOpen, initialIndex, attachments.length]);

  if (!isOpen || !attachments || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];
  const isImage = currentAttachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(currentAttachment.name || currentAttachment.filename);
  const isPdf = currentAttachment && /\.pdf$/i.test(currentAttachment.name || currentAttachment.filename);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? attachments.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === attachments.length - 1 ? 0 : prev + 1));
  };

const handleDownload = (file) => {
  if (!file.data) return;

  let blob;
  if (file.data instanceof Uint8Array) {
    blob = new Blob([file.data], { type: file.mimetype });
  } else if (file.data.type === 'Buffer' && Array.isArray(file.data.data)) {
    // Handle Buffer object from backend
    const uint8Array = new Uint8Array(file.data.data);
    blob = new Blob([uint8Array], { type: file.mimetype });
  } else if (typeof file.data === "string" && file.data.startsWith("data:")) {
    // Already a data URL
    blob = dataURLtoBlob(file.data);
  } else {
    console.warn("Unsupported file format", file);
    return;
  }

  // Convert .webp to .png if needed
  if (file.mimetype === "image/webp") {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = (file.filename?.replace(/\.webp$/i, ".png")) || "file.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");

      URL.revokeObjectURL(url);
    };

    return;
  }

  // Otherwise, download as is
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.filename || "file";
  a.click();
  URL.revokeObjectURL(a.href);
};

// Helper: convert base64 dataURL to Blob
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
};

  const getFileIcon = () => {
    if (isPdf) return <FaFilePdf className="w-16 h-16 text-red-500" />;
    if (isImage) return <IoImage className="w-16 h-16 text-blue-500" />;
    return <FaFile className="w-16 h-16 text-gray-500" />;
  };

  const getDataUrl = () => {
    if (!currentAttachment?.data) return null;
    if (typeof currentAttachment.data === 'string') {
      // If it's already a data URL or base64, use it directly
      return currentAttachment.data.startsWith('data:') || currentAttachment.data.startsWith('http') 
        ? currentAttachment.data 
        : `data:${currentAttachment.mimetype};base64,${currentAttachment.data}`;
    }
    // If it's a Uint8Array or Buffer, convert to blob URL
    if (currentAttachment.data instanceof Uint8Array || currentAttachment.data instanceof ArrayBuffer) {
      const blob = new Blob([currentAttachment.data], { type: currentAttachment.mimetype });
      return URL.createObjectURL(blob);
    }
    return null;
  };

  return (
    <>
      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
          {/* Modal Content */}
          <div
            className="bg-base-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-200">
              <h2 className="text-xl font-semibold text-base-content">
                {title}
                <span className="text-sm font-normal text-base-content/60 ml-2">
                  ({currentIndex + 1} of {attachments.length})
                </span>
              </h2>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:bg-base-200"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-6 bg-base-200/20">
              {isImage && currentAttachment?.data ? (
                <img
                  src={getDataUrl()}
                  alt={currentAttachment.name || 'attachment'}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : isPdf ? (
                <div className="flex flex-col items-center gap-4">
                  <FaFilePdf className="w-24 h-24 text-red-500" />
                  <p className="text-lg text-base-content font-medium">{currentAttachment.name || 'PDF Document'}</p>
                  <p className="text-sm text-base-content/60">PDF Preview not available</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {getFileIcon()}
                  <p className="text-lg text-base-content font-medium text-center">{currentAttachment.name || currentAttachment.filename || 'File'}</p>
                  {currentAttachment.mimetype && (
                    <p className="text-sm text-base-content/60">{currentAttachment.mimetype}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-base-200 gap-2">
              <button
                onClick={handlePrevious}
                disabled={attachments.length <= 1}
                className="btn btn-ghost btn-sm gap-2"
              >
                <IoChevronBack className="w-4 h-4" /> Previous
              </button>

              <div className="flex gap-2">
                {attachments.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-primary w-4' : 'bg-base-300/50'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(currentAttachment); }}
    className="bg-white p-1 rounded hover:bg-gray-100 border"
    title="Download"
                >
                  <IoDownload className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={attachments.length <= 1}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  Next <IoChevronForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentViewerModal;
