// components/PhotoGrid.jsx
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

export default function PhotoGrid({ photos, isEventOwner, onDeleted }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirmingId, setConfirmingId] = useState(null);

  const handleDelete = async (photoId) => {
    try {
      await api.delete(`/photos/${photoId}`);
      onDeleted(photoId);
      showToast("Photo deleted");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete photo", "error");
    } finally {
      setConfirmingId(null);
    }
  };

  if (photos.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No photos uploaded yet.</p>;
  }

  return (
    <>
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
                    onClick={() => setConfirmingId(photo._id)}
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

      {confirmingId && (
        <ConfirmDialog
          title="Delete photo?"
          message="This photo will be permanently removed from the event and from Cloudinary. This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirmingId)}
          onCancel={() => setConfirmingId(null)}
        />
      )}
    </>
  );
}