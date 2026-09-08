// components/CustomerPhotoViewer.jsx
// A read-only fullscreen photo viewer for the customer gallery -- no
// selection controls, just view + navigate + close.

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerPhotoViewer({ photos, index, onClose, onNavigate }) {
  const photo = photos[index];

  const goNext = useCallback(() => {
    if (index < photos.length - 1) onNavigate(index + 1);
  }, [index, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="flex items-center justify-end px-6 py-4">
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-4">
        {index > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2 transition"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          src={photo.storageUrl}
          alt={photo.filename}
          className="max-h-[80vh] max-w-full object-contain rounded-lg"
        />

        {index < photos.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2 transition"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center px-6 py-4">
        <p className="text-white/50 text-sm">
          {index + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
}