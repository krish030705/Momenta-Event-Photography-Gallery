// pages/EventDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, UserPlus, X, Trash2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PhotoUploader from "../components/PhotoUploader";
import PhotoGrid from "../components/PhotoGrid";
import CurationWorkspace from "../components/CurationWorkspace";
import GalleryPanel from "../components/GalleryPanel";
import ConfirmDialog from "../components/ConfirmDialog";
import { EventDetailsSkeleton } from "../components/Skeleton";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [confirmingDeleteEvent, setConfirmingDeleteEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const fetchEvent = () => {
    setLoading(true);
    api
      .get(`/events/${id}`)
      .then((res) => setEvent(res.data.event))
      .catch((err) => setError(err.response?.data?.message || "Could not load event"))
      .finally(() => setLoading(false));
  };

  const fetchPhotos = () => {
    api
      .get(`/events/${id}/photos`)
      .then((res) => setPhotos(res.data.photos))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEvent();
    fetchPhotos();
  }, [id]);

  const isOwner = event && user && event.createdBy._id === user.id;

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    setAddingMember(true);
    try {
      const res = await api.post(`/events/${id}/members`, { email: newMemberEmail });
      setEvent((prev) => ({ ...prev, teamMembers: res.data.event.teamMembers }));
      setNewMemberEmail("");
      showToast("Team member added");
    } catch (err) {
      setMemberError(err.response?.data?.message || "Could not add team member");
    } finally {
      setAddingMember(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await api.delete(`/events/${id}/members/${memberToRemove._id}`);
      setEvent((prev) => ({ ...prev, teamMembers: res.data.event.teamMembers }));
      showToast(`${memberToRemove.name} removed from event`);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not remove team member", "error");
    } finally {
      setMemberToRemove(null);
    }
  };

  const handlePhotosUploaded = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    fetchEvent();
    if (newPhotos.length > 0) {
      showToast(`${newPhotos.length} photo${newPhotos.length !== 1 ? "s" : ""} uploaded`);
    }
  };

  const handlePhotoDeleted = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p._id !== photoId));
    fetchEvent();
  };

  const handleDeleteEvent = async () => {
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${id}`);
      showToast(`"${event.name}" deleted`);
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete event", "error");
      setDeletingEvent(false);
      setConfirmingDeleteEvent(false);
    }
  };

  if (loading) return <EventDetailsSkeleton />;

  if (error) {
    return (
      <div>
        <Link to="/" className="text-sm text-accent flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Back to events
        </Link>
        <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="text-sm text-accent flex items-center gap-1">
          <ArrowLeft size={14} /> Back to events
        </Link>

        {isOwner && (
          <button
            onClick={() => setConfirmingDeleteEvent(true)}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
          >
            <Trash2 size={14} /> Delete Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {eventDate}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {event.location}
                </span>
              )}
            </div>
          </div>
          {event.isPublished ? (
            <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full self-start">
              Gallery Published
            </span>
          ) : (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full self-start">
              Draft
            </span>
          )}
        </div>

        {event.description && <p className="text-sm text-gray-600 mt-4">{event.description}</p>}

        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-100 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Uploaded</p>
            <p className="font-semibold text-ink">{event.totalPhotos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Selected</p>
            <p className="font-semibold text-ink">{event.selectedPhotos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Photographers</p>
            <p className="font-semibold text-ink">{event.teamMembers.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-ink mb-4">Team Members</h2>

        {memberError && (
          <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm mb-4">{memberError}</p>
        )}

        {event.teamMembers.length === 0 ? (
          <p className="text-gray-400 text-sm mb-4">No team members added yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {event.teamMembers.map((member) => (
              <li
                key={member._id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="text-gray-400 hover:text-red-600"
                    title="Remove from event"
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="photographer@example.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={addingMember}
              className="flex items-center justify-center gap-1.5 bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              <UserPlus size={16} />
              {addingMember ? "Adding..." : "Add"}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <PhotoUploader eventId={id} onUploaded={handlePhotosUploaded} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {isOwner ? (
            <>
              <h2 className="font-semibold text-ink mb-4">
                Curation Workspace{" "}
                <span className="text-gray-400 font-normal">({photos.length} photos)</span>
              </h2>
              <CurationWorkspace
                eventId={id}
                photos={photos}
                teamMembers={event.teamMembers}
                onPhotosUpdated={setPhotos}
              />
            </>
          ) : (
            <>
              <h2 className="font-semibold text-ink mb-4">
                Your Uploads{" "}
                <span className="text-gray-400 font-normal">
                  ({photos.filter((p) => p.uploadedBy?._id === user.id).length})
                </span>
              </h2>
              <PhotoGrid
                photos={photos.filter((p) => p.uploadedBy?._id === user.id)}
                isEventOwner={false}
                onDeleted={handlePhotoDeleted}
              />
            </>
          )}
        </div>

        {isOwner && (
          <GalleryPanel eventId={id} selectedPhotoCount={photos.filter((p) => p.isSelected).length} />
        )}
      </div>

      {memberToRemove && (
        <ConfirmDialog
          title="Remove team member?"
          message={`${memberToRemove.name} will lose access to this event. Their already-uploaded photos will stay.`}
          confirmLabel="Remove"
          onConfirm={confirmRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}

      {confirmingDeleteEvent && (
        <ConfirmDialog
          title="Delete this event?"
          message={`This permanently deletes "${event.name}", all ${event.totalPhotos} of its photos, and its gallery. This cannot be undone.`}
          confirmLabel="Delete Event"
          onConfirm={handleDeleteEvent}
          onCancel={() => setConfirmingDeleteEvent(false)}
          working={deletingEvent}
        />
      )}
    </div>
  );
}