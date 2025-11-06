import { useEffect, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import {
  getEvents,
  syncGoogleCalendar,
  getEventRequests,
  respondToEventRequest,
} from "../api/calendar";
import AddEventModal from "../components/calendar/AddEventModal";
import EventList from "../components/calendar/EventList";
import EventDetailsModal from "../components/calendar/EventDetailsModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useSocket } from "../contexts/SocketContext";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const socket = useSocket();

  /** ===================== Fetch ===================== */
  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await getEvents();
      setEvents(
        (data.events || []).map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          color: "#1e40af",
          extendedProps: { description: event.description },
        }))
      );
    } catch {
      toast.error("⚠️ Failed to load events");
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const { data } = await getEventRequests();
      setPendingRequests(data.requests || []);
    } catch {
      toast.error("⚠️ Failed to load pending requests");
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchPendingRequests();

    const interval = setInterval(() => {
      fetchEvents();
      fetchPendingRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchPendingRequests]);

  /** ===================== Socket Real-time ===================== */
  useEffect(() => {
    if (!socket) return;

    socket.on("calendar:eventCreated", (newEvent) => {
      setEvents((prev) => {
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [...prev, newEvent];
      });
      toast.info(`📅 New event: ${newEvent.title}`);
    });

    socket.on("calendar:eventDeleted", (eventId) => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.warn("🗑️ Event deleted");
    });

    socket.on("calendar:eventUpdated", async () => {
      await Promise.all([fetchEvents(), fetchPendingRequests()]);
      toast.info("🔄 Calendar updated");
    });

    return () => {
      socket.off("calendar:eventCreated");
      socket.off("calendar:eventDeleted");
      socket.off("calendar:eventUpdated");
    };
  }, [socket, fetchEvents, fetchPendingRequests]);

  /** ===================== Actions ===================== */
  const handleRequestAction = async (id, action) => {
    try {
      await respondToEventRequest(id, action);
      toast.success(`✅ Event ${action}ed successfully`);
      const request = pendingRequests.find((r) => r.id === id);
      if (action === "accept" && request) {
        const acceptedEvent = {
          id: request.id,
          title: request.title,
          start: request.start,
          end: request.end,
          color: "#1e40af",
          extendedProps: { description: request.description },
        };
        setEvents((prev) => [...prev, acceptedEvent]);
        if (socket) socket.emit("calendar:eventUpdated", acceptedEvent);
      }
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("❌ Failed to respond to request");
    }
  };

  const handleEventAdded = (newEvent) => {
    const eventObj = {
      id: newEvent.id,
      title: newEvent.title,
      start: newEvent.start,
      color: "#1e40af",
      extendedProps: { description: newEvent.description },
    };
    setEvents((prev) => [...prev, eventObj]);
    if (socket) socket.emit("calendar:eventCreated", eventObj);
  };

  const handleEventDeleted = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    if (socket) socket.emit("calendar:eventDeleted", id);
  };

  const handleSyncGoogle = async () => {
    try {
      await syncGoogleCalendar();
      toast.success("✅ Google Calendar synced!");
    } catch {
      toast.error("⚠️ Google Calendar sync failed");
    }
  };

  const handleEventClick = (info) => {
    const clickedEvent = {
      id: info.event.id,
      title: info.event.title,
      date: info.event.start,
      description: info.event.extendedProps?.description,
    };
    setSelectedEvent(clickedEvent);
  };

  /** ===================== Combine Calendar Events ===================== */
  const calendarEvents = useMemo(() => {
    const pendingWithColor = pendingRequests.map((req) => ({
      id: `pending-${req.id}`,
      title: `${req.title} (Pending)`,
      start: req.start,
      color: "#f59e0b",
      borderColor: "#fbbf24",
      extendedProps: { description: req.description, pending: true },
    }));
    return [...events, ...pendingWithColor];
  }, [events, pendingRequests]);

  /** ===================== UI ===================== */
  return (
    <div className="flex bg-white min-h-screen">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main>
          <div className="bg-white rounded-2xl  shadow-xl shadow-gray-200/40 p-6 transition hover:shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-black">
                Calendar & Events
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-4 py-2 rounded-4xl transition cursor-pointer ${
                    activeTab === "calendar"
                      ? "bg-blue-800 text-white shadow-sm hover:bg-blue-900"
                      : "border border-blue-800 text-blue-800 hover:bg-blue-50"
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 rounded-4xl transition cursor-pointer ${
                    activeTab === "pending"
                      ? "bg-blue-800 text-white shadow-sm hover:bg-blue-900"
                      : "border border-blue-800 text-blue-800 hover:bg-blue-50"
                  }`}
                >
                  Pending Requests ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-blue-800 text-white px-4 py-2 rounded-4xl shadow-sm hover:bg-blue-900 transition cursor-pointer"
                >
                  + Add Event
                </button>
                <button
                  onClick={handleSyncGoogle}
                  className="border border-blue-800 text-blue-800 px-4 py-2 rounded-4xl hover:bg-blue-800 hover:text-white cursor-pointer transition"
                >
                  Sync Google
                </button>
              </div>
            </div>

            {activeTab === "calendar" ? (
              <>
                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-6 bg-white">
                  <FullCalendar
                    plugins={[
                      dayGridPlugin,
                      timeGridPlugin,
                      interactionPlugin,
                      listPlugin,
                    ]}
                    initialView="dayGridMonth"
                    height="75vh"
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
                    }}
                  />
                </div>
                <EventList events={events} onDelete={handleEventDeleted} />
              </>
            ) : (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">
                   No pending requests
                  </p>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 border border-gray-200 cursor-pointer rounded-xl bg-white flex justify-between items-center hover:shadow-sm  transition-all duration-300"
                    >
                      <div>
                        <h3 className="font-semibold text-blue-900 text-lg">
                          {req.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(req.start).toLocaleString()}
                        </p>
                        {req.description && (
                          <p className="text-sm text-gray-700 mt-1">
                            {req.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          From: {req.createdBy?.email || "Unknown"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRequestAction(req.id, "accept")}
                          className="px-3 py-1 bg-blue-800 text-white rounded hover:bg-blue-900 shadow-sm transition cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, "reject")}
                          className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 shadow-sm transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
        <ToastContainer position="bottom-right" />
      </div>

      <AddEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEventAdded={handleEventAdded}
      />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleEventDeleted}
        />
      )}
    </div>
  );
};

export default Calendar;
