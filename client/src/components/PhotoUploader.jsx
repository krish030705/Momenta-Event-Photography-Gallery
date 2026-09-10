// components/PhotoUploader.jsx
import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import api from "../services/api";
import { uploadFileDirectToCloudinary } from "../services/cloudinaryDirectUpload";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_SIZE = 15 * 1024 * 1024;

export default function PhotoUploader({ eventId, onUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError("");
    setLastResult(null);
    setUploading(true);
    setProgress(0);

    const validFiles = [];
    let rejectedCount = 0;
    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
        rejectedCount++;
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      setError("No valid image files selected (check file type and the 15MB size limit).");
      setUploading(false);
      return;
    }

    const progressByFile = new Array(validFiles.length).fill(0);
    const updateOverallProgress = () => {
      const total = progressByFile.reduce((sum, p) => sum + p, 0);
      setProgress(Math.round(total / validFiles.length));
    };

    const results = await Promise.allSettled(
      validFiles.map((file, i) =>
        uploadFileDirectToCloudinary(file, `momenta/${eventId}`, (pct) => {
          progressByFile[i] = pct;
          updateOverallProgress();
        }).then((res) => ({
          filename: file.name,
          storageUrl: res.data.secure_url,
          storagePublicId: res.data.public_id,
          fileSize: file.size,
          mimeType: file.type,
        }))
      )
    );

    const uploadedMeta = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failedCount = results.length - uploadedMeta.length + rejectedCount;

    try {
      if (uploadedMeta.length > 0) {
        const res = await api.post(`/events/${eventId}/photos/metadata`, {
          photos: uploadedMeta,
        });
        onUploaded(res.data.photos);
      }

      setLastResult({ uploadedCount: uploadedMeta.length, failedCount });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save uploaded photos. Please try again.");
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