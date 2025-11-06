import { deleteEvent } from "../../api/calendar";
import { toast } from "react-toastify";
import { Calendar, Users, XCircle, Clock, User } from "lucide-react";

const EventDetailsModal = ({ event, onClose, onDelete }) => {
  const handleDelete = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteEvent(event.id);
      toast.success("Event deleted successfully");
      onDelete(event.id);
      onClose();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Calendar className="text-blue-700" />
            Event Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition cursor-pointer"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-medium text-gray-900">Title:</span> {event.title}
          </p>

          {event.description && (
            <p>
              <span className="font-medium text-gray-900">Description:</span>{" "}
              {event.description}
            </p>
          )}

          <p className="flex items-center gap-2">
            <Clock className="text-blue-700" size={18} />
            <span>
              <span className="font-medium text-gray-900">Start:</span>{" "}
              {formatDateTime(event.start)}
            </span>
          </p>

          <p className="flex items-center gap-2">
            <Clock className="text-blue-700" size={18} />
            <span>
              <span className="font-medium text-gray-900">End:</span>{" "}
              {formatDateTime(event.end)}
            </span>
          </p>

          <p>
            <span className="font-medium text-gray-900">Status:</span>{" "}
            <span
              className={`font-semibold ${
                event.status === "Expired"
                  ? "text-red-600"
                  : event.status === "Ongoing"
                  ? "text-green-700"
                  : "text-blue-700"
              }`}
            >
              {event.status || event.eventStatus}
            </span>
          </p>

          {event.isCreator && (
            <p>
              <span className="font-medium text-gray-900">You are the creator.</span>
            </p>
          )}

          {event.userStatus && !event.isCreator && (
            <p>
              <span className="font-medium text-gray-900">Your Response:</span>{" "}
              <span
                className={`font-semibold ${
                  event.userStatus === "accepted"
                    ? "text-green-700"
                    : event.userStatus === "declined"
                    ? "text-red-600"
                    : event.userStatus === "pending"
                    ? "text-yellow-600"
                    : "text-gray-700"
                }`}
              >
                {event.userStatus.charAt(0).toUpperCase() + event.userStatus.slice(1)}
              </span>
            </p>
          )}

          {event.createdBy && (
            <div className="flex items-center gap-2 mt-2">
              <User className="text-blue-700" size={18} />
              <span>
                <span className="font-medium text-gray-900">Created By:</span>{" "}
                {event.createdBy.email}{" "}
                <span className="text-sm text-gray-500">
                  ({event.createdBy.role})
                </span>
              </span>
            </div>
          )}

          {event.attendees?.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                <Users className="text-blue-700" size={18} /> Attendees:
              </h4>
              <ul className="space-y-1 ml-2">
                {event.attendees.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg"
                  >
                    <span className="text-sm">{a.email}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        a.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : a.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : a.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition cursor-pointer"
          >
            Close
          </button>
          {event.isCreator && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
