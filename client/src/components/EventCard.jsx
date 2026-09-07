// components/EventCard.jsx
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Image } from "lucide-react";

export default function EventCard({ event }) {
  const eventDate = new Date(event.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      to={`/events/${event._id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-ink text-lg">{event.name}</h3>
        {event.isPublished ? (
          <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
            Published
          </span>
        ) : (
          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
            Draft
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          {eventDate}
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            {event.location}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-gray-600">
          <Image size={14} />
          {event.totalPhotos} uploaded
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Users size={14} />
          {event.teamMembers.length} photographer{event.teamMembers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {event.totalPhotos > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {event.selectedPhotos} of {event.totalPhotos} selected
        </p>
      )}
    </Link>
  );
}