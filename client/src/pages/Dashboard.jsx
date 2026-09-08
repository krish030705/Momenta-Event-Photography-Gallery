// pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Plus, Calendar, Image, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import EventCard from "../components/EventCard";
import CreateEventModal from "../components/CreateEventModal";
import { EventCardSkeleton, StatCardSkeleton } from "../components/Skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    api
      .get("/events")
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(err.response?.data?.message || "Could not load events"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => !e.isPublished).length;
  const totalPhotos = events.reduce((sum, e) => sum + e.totalPhotos, 0);
  const publishedGalleries = events.filter((e) => e.isPublished).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {user?.role === "admin" ? "Your Events" : "Assigned Events"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === "admin"
              ? "Manage your events, teams, and galleries"
              : "Events you've been added to as a photographer"}
          </p>
        </div>

        {user?.role === "admin" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={16} />
            Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={<Calendar size={16} />} label="Total Events" value={totalEvents} />
            <StatCard icon={<Calendar size={16} />} label="Active (Unpublished)" value={activeEvents} />
            <StatCard icon={<Image size={16} />} label="Total Photos" value={totalPhotos} />
            <StatCard icon={<CheckCircle2 size={16} />} label="Published Galleries" value={publishedGalleries} />
          </>
        )}
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">
            {user?.role === "admin"
              ? "No events yet — create your first one to get started."
              : "You haven't been added to any events yet."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newEvent) => {
            setEvents((prev) => [newEvent, ...prev]);
            showToast(`"${newEvent.name}" created`);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}