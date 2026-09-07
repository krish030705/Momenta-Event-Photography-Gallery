// components/PhotoGrid.jsx
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function PhotoGrid({ photos, isEventOwner, onDeleted }) {
  const { user } = useAuth();

  const handleDelete = async (photoId) => {
    try {
      await api.delete(`/photos/${photoId}`);
      onDeleted(photoId);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete photo");
    }
  };

  if (photos.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-8 text-center">
        No photos uploaded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo) => {
        const canDelete = isEventOwner || photo.uploadedBy?._id === user?.id;

        return (
          <div
            key={photo._id}
            className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square"
          >
            <img
              src={photo.thumbnailUrl || photo.storageUrl}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
              <div className="text-white text-xs">
                <p className="font-medium truncate max-w-[120px]">
                  {photo.uploadedBy?.name || "Unknown"}
                </p>
                <p className="text-white/70">
                  {new Date(photo.createdAt).toLocaleDateString()}
                </p>
              </div>

              {canDelete && (
                <button
                  onClick={() => handleDelete(photo._id)}
                  className="ml-auto bg-white/90 text-red-600 rounded-lg p-1.5 hover:bg-white"
                  title="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}