// pages/CustomerGallery.jsx
// The fully public route customers land on via the share link:
// /gallery/:slug -- no login, no Navbar, no admin UI of any kind.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Camera, Lock, AlertCircle, Calendar, MapPin } from "lucide-react";
import api from "../services/api";
import CustomerPhotoViewer from "../components/CustomerPhotoViewer";

export default function CustomerGallery() {
  const { slug } = useParams();

  const [status, setStatus] = useState("loading"); // loading | not-found | pin-entry | gallery
  const [eventInfo, setEventInfo] = useState(null);
  const [photos, setPhotos] = useState([]);

  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState("");

  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    api
      .get(`/gallery/${slug}`)
      .then((res) => {
        setEventInfo(res.data.event);
        setStatus("pin-entry");
      })
      .catch(() => setStatus("not-found"));
  }, [slug]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setPinError("");
    setVerifying(true);

    try {
      const res = await api.post(`/gallery/${slug}/verify`, { pin });
      setEventInfo(res.data.event);
      setPhotos(res.data.photos);
      setStatus("gallery");
    } catch (err) {
      if (err.response?.status === 429) {
        setPinError("Too many attempts. Please try again later.");
      } else if (err.response?.status === 401) {
        setPinError("Incorrect PIN. Please try again.");
      } else {
        setPinError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const eventDate = eventInfo
    ? new Date(eventInfo.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-white/50 text-sm">Loading gallery...</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto text-white/30 mb-4" size={40} />
          <h1 className="text-white text-xl font-semibold mb-2">Gallery unavailable</h1>
          <p className="text-white/50 text-sm">
            This gallery link is invalid, has been unpublished, or no longer exists.
          </p>
        </div>
      </div>
    );
  }

  if (status === "pin-entry") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
          <Camera className="mx-auto text-accent mb-4" size={32} />
          <h1 className="text-white text-xl font-semibold mb-1">{eventInfo.name}</h1>
          <div className="flex items-center justify-center gap-3 text-white/50 text-sm mb-6">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {eventDate}
            </span>
            {eventInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {eventInfo.location}
              </span>
            )}
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter gallery PIN"
                className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-lg pl-9 pr-3 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {pinError && (
              <p className="text-red-300 bg-red-500/10 rounded-lg p-2.5 text-sm">{pinError}</p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {verifying ? "Verifying..." : "View Gallery"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-ink text-white px-6 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{eventInfo.name}</h1>
        <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} /> {eventDate}
          </span>
          {eventInfo.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {eventInfo.location}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {photos.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No photos have been published yet.</p>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
            {photos.map((photo, i) => (
              <button
                key={photo._id}
                onClick={() => setPreviewIndex(i)}
                className="block w-full rounded-xl overflow-hidden break-inside-avoid hover:opacity-90 transition"
              >
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.filename}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {previewIndex !== null && (
        <CustomerPhotoViewer
          photos={photos}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
        />
      )}
    </div>
  );
}