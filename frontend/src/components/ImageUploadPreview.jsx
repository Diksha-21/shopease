import { useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '../api/api';

export const ImageUploadPreview = ({ files = [], onFilesChange, maxFiles = 5 }) => {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const initialPreviews = files.map(file => ({
      file,
      preview: typeof file === 'string' ? getImageUrl(file) : URL.createObjectURL(file)
    }));

    const isSame = JSON.stringify(initialPreviews.map(p => p.preview)) === JSON.stringify(previews.map(p => p.preview));
    
    if (isSame) {
      setPreviews(initialPreviews);
    }
    return () => {
      initialPreviews.forEach(p => {
        if (typeof p.file !== 'string') URL.revokeObjectURL(p.preview);
      });
    };
  }, [files]);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, maxFiles);
    if (selectedFiles.length === 0) return;

    const newPreviews = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPreviews(prev => {
      const updated = [...prev, ...newPreviews].slice(0, maxFiles);
      onFilesChange(updated.map(p => p.file));
      return updated;
    });
  }, [onFilesChange, maxFiles]);

  const removeImage = (index) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      const toRemove = newPreviews[index];
      if (typeof toRemove.file !== 'string') {
        URL.revokeObjectURL(toRemove.preview);
      }
      newPreviews.splice(index, 1);
      onFilesChange(newPreviews.map(p => p.file));
      return newPreviews;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative">
            <img
              src={preview.preview}
              alt={`Preview ${index}`}
              className="h-32 w-32 object-cover rounded-md border border-gray-300"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transform translate-x-1/2 -translate-y-1/2"
            >
              ×
            </button>
          </div>
        ))}

        {previews.length < maxFiles && (
          <label className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors duration-300">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-gray-400 text-center">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs">Add Images</span>
            </div>
          </label>
        )}
      </div>
      <p className="text-sm text-gray-500">
        {previews.length}/{maxFiles} images uploaded
      </p>
    </div>
  );
};
