// components/PhotoUploader.jsx
import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import api from "../services/api";

export default function PhotoUploader({ eventId, onUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
          const res = await api.post(`/events/${eventId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000, // 3 minutes -- generous but bounded
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
    setError("");
    setLastResult(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    try {
      const res = await api.post(`/events/${eventId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });

      setLastResult({
        uploadedCount: res.data.uploadedCount,
        failedCount: res.data.failedCount,
      });
      onUploaded(res.data.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="photo-upload-input"
        disabled={uploading}
      />

      <label
        htmlFor="photo-upload-input"
        className={`flex flex-col items-center gap-2 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {uploading ? (
          <Loader2 size={28} className="text-accent animate-spin" />
        ) : (
          <UploadCloud size={28} className="text-accent" />
        )}
        <p className="text-sm font-medium text-ink">
          {uploading ? `Uploading... ${progress}%` : "Click to upload photos"}
        </p>
        <p className="text-xs text-gray-400">JPEG, PNG, WEBP — up to 15MB each</p>
      </label>

      {uploading && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-2.5 text-sm mt-4">{error}</p>
      )}

      {lastResult && !error && (
        <p className="text-green-700 bg-green-50 rounded-lg p-2.5 text-sm mt-4">
          {lastResult.uploadedCount} photo{lastResult.uploadedCount !== 1 ? "s" : ""} uploaded
          {lastResult.failedCount > 0 && `, ${lastResult.failedCount} failed`}
        </p>
      )}
    </div>
  );
}