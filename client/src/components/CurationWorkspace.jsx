// components/CurationWorkspace.jsx
import { useMemo, useState } from "react";
import { Search, CheckSquare, Square, X, Image as ImageIcon } from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import PhotoPreviewModal from "./PhotoPreviewModal";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "selected", label: "Selected" },
  { value: "unselected", label: "Unselected" },
];

export default function CurationWorkspace({ eventId, photos, teamMembers, onPhotosUpdated }) {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [photographerFilter, setPhotographerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewIndex, setPreviewIndex] = useState(null);
  const [bulkWorking, setBulkWorking] = useState(false);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (statusFilter === "selected" && !photo.isSelected) return false;
      if (statusFilter === "unselected" && photo.isSelected) return false;
      if (photographerFilter !== "all" && photo.uploadedBy?._id !== photographerFilter) return false;
      if (search && !photo.filename.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [photos, statusFilter, photographerFilter, search]);

  const selectedCount = photos.filter((p) => p.isSelected).length;

  const toggleCheckbox = (photoId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredPhotos.map((p) => p._id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const applyBulkSelection = async (isSelected) => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    try {
      const res = await api.patch(`/events/${eventId}/photos/bulk-select`, {
        photoIds: Array.from(selectedIds),
        isSelected,
      });
      onPhotosUpdated(res.data.photos);
      showToast(`${selectedIds.size} photo${selectedIds.size !== 1 ? "s" : ""} marked ${isSelected ? "selected" : "unselected"}`);
      clearSelection();
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk update failed", "error");
    } finally {
      setBulkWorking(false);
    }
  };

  const toggleSinglePhoto = async (photo) => {
    try {
      const res = await api.patch(`/photos/${photo._id}/select`, {
        isSelected: !photo.isSelected,
      });
      onPhotosUpdated(
        photos.map((p) => (p._id === photo._id ? { ...p, isSelected: res.data.photo.isSelected } : p))
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update photo", "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <select
          value={photographerFilter}
          onChange={(e) => setPhotographerFilter(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All photographers</option>
          {teamMembers.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 transition ${
                statusFilter === f.value ? "bg-accent text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {filteredPhotos.length} of {photos.length} photos · {selectedCount} selected for gallery
      </p>

      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ink text-white rounded-xl px-4 py-3 mb-4 shadow-lg">
          <span className="text-sm font-medium">{selectedIds.size} photos checked</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => applyBulkSelection(true)}
              disabled={bulkWorking}
              className="bg-white text-ink text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Mark Selected
            </button>
            <button
              onClick={() => applyBulkSelection(false)}
              disabled={bulkWorking}
              className="bg-white/10 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              Mark Unselected
            </button>
            <button onClick={clearSelection} className="text-white/70 hover:text-white p-1.5" title="Clear checked photos">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <button onClick={selectAllVisible} className="flex items-center gap-1.5 text-sm text-accent font-medium">
          <CheckSquare size={14} /> Select all visible
        </button>
        <button onClick={clearSelection} className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
          <Square size={14} /> Clear
        </button>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <ImageIcon className="mx-auto text-gray-300 mb-2" size={28} />
          <p className="text-gray-400 text-sm">No photos match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredPhotos.map((photo) => {
            const isChecked = selectedIds.has(photo._id);

            return (
              <div
                key={photo._id}
                className={`relative rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition ${
                  photo.isSelected ? "border-green-500" : "border-transparent"
                }`}
                onClick={() => setPreviewIndex(filteredPhotos.indexOf(photo))}
              >
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCheckbox(photo._id);
                  }}
                  className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center ${
                    isChecked ? "bg-accent" : "bg-white/80 border border-gray-300"
                  }`}
                >
                  {isChecked && <CheckSquare size={12} className="text-white" />}
                </button>

                {photo.isSelected && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    Selected
                  </span>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-[11px] truncate">{photo.uploadedBy?.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewIndex !== null && (
        <PhotoPreviewModal
          photos={filteredPhotos}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
          onToggleSelect={toggleSinglePhoto}
        />
      )}
    </div>
  );
}