// components/GalleryPanel.jsx
import { useEffect, useState } from "react";
import { Link2, Copy, Check, Lock, Globe } from "lucide-react";
import api from "../services/api";

export default function GalleryPanel({ eventId, selectedPhotoCount }) {
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGallery = () => {
    setLoading(true);
    api
      .get(`/events/${eventId}/gallery`)
      .then((res) => setGallery(res.data.gallery))
      .catch((err) => setError(err.response?.data?.message || "Could not load gallery"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  const shareUrl = gallery ? `${window.location.origin}/gallery/${gallery.slug}` : "";

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setWorking(true);
    try {
      const res = await api.post(`/events/${eventId}/gallery`, { pin });
      setGallery(res.data.gallery);
      setPin("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create gallery");
    } finally {
      setWorking(false);
    }
  };

  const handlePublishToggle = async () => {
    setError("");
    setWorking(true);
    try {
      const action = gallery.isPublished ? "unpublish" : "publish";
      const res = await api.post(`/gallery/${gallery._id}/${action}`);
      setGallery((prev) => ({ ...prev, ...res.data.gallery }));
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setWorking(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setError("");
    setWorking(true);
    try {
      const res = await api.patch(`/gallery/${gallery._id}`, { pin: newPin });
      setGallery((prev) => ({ ...prev, ...res.data.gallery }));
      setNewPin("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update PIN");
    } finally {
      setWorking(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading gallery settings...</p>;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
        <Link2 size={18} /> Customer Gallery
      </h2>

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm mb-4">{error}</p>
      )}

      {!gallery ? (
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            Create a gallery to share your {selectedPhotoCount} selected photo
            {selectedPhotoCount !== 1 ? "s" : ""} with the customer.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Set a PIN</label>
            <input
              type="text"
              required
              minLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 4821"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={working}
            className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {working ? "Creating..." : "Create Gallery"}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                gallery.isPublished
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {gallery.isPublished ? <Globe size={12} /> : <Lock size={12} />}
              {gallery.isPublished ? "Published — live for customers" : "Not published"}
            </span>
            <button
              onClick={handlePublishToggle}
              disabled={working || (!gallery.isPublished && selectedPhotoCount === 0)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                gallery.isPublished
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-accent text-white hover:opacity-90"
              }`}
              title={
                !gallery.isPublished && selectedPhotoCount === 0
                  ? "Select at least one photo in the Curation Workspace first"
                  : ""
              }
            >
              {working ? "Working..." : gallery.isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>

          {!gallery.isPublished && selectedPhotoCount === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
              Select at least one photo in the Curation Workspace above before publishing.
            </p>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Share link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 transition"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {gallery.selectedPhotoCount} photo{gallery.selectedPhotoCount !== 1 ? "s" : ""} will be
            shown on next publish (synced from the Curation Workspace)
          </p>

          <form onSubmit={handleChangePin} className="flex items-end gap-2 pt-4 border-t border-gray-100">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Change PIN</label>
              <input
                type="text"
                required
                minLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="New PIN"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={working}
              className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              Update
            </button>
          </form>
        </div>
      )}
    </div>
  );
}