import { useState } from "react";
import { deleteEvent } from "../../api/calendar";
import { toast } from "react-toastify";
import { Trash2, CalendarDays } from "lucide-react";
import EventDetailsModal from "./EventDetailsModal";

const EventList = ({ events, onDelete }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
      onDelete(id);
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold text-black mb-5 flex items-center gap-2">
        <CalendarDays className="text-black" />
        Upcoming Events
      </h3>

      {events.length > 0 ? (
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full border-collapse text-sm md:text-base">
            <thead className="bg-gradient-to-r from-blue-800 to-blue-700 text-white text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Start</th>
                <th className="px-4 py-3 font-semibold">End</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="hover:bg-blue-50 transition-all duration-200 cursor-pointer border-b border-gray-100 group"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 group-hover:text-blue-900">
                    {event.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(event.start)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(event.end)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        event.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : event.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {event.status || "Accepted"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800 transition cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mt-3">No upcoming events</p>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default EventList;
