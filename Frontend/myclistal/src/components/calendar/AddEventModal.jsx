import { useState, useEffect } from "react";
import { createEvent, getAllUsers } from "../../api/calendar";
import { toast } from "react-toastify";

const AddEventModal = ({ open, onClose, onEventAdded }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    inviteUsers: [], // store selected user objects {id, email}
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await getAllUsers({ search: "" });
        setUsers(data.users);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddUser = (user) => {
    if (!form.inviteUsers.find((u) => u.id === user.id)) {
      setForm({
        ...form,
        inviteUsers: [...form.inviteUsers, user],
      });
    }
  };

  const handleRemoveUser = (id) => {
    setForm({
      ...form,
      inviteUsers: form.inviteUsers.filter((u) => u.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        inviteUsers: form.inviteUsers.map((u) => u.id), // send only IDs
      };
      const { data } = await createEvent(payload);
      toast.success("Event created successfully!");
      onEventAdded(data.event);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) &&
      !form.inviteUsers.find((selected) => selected.id === u.id)
  );

  return open ? (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">
          Create New Event
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600">Event Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter title"
              onChange={handleChange}
              value={form.title}
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-800 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Start Date & Time</label>
            <input
              type="datetime-local"
              name="start"
              onChange={handleChange}
              value={form.start}
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-800 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">End Date & Time</label>
            <input
              type="datetime-local"
              name="end"
              onChange={handleChange}
              value={form.end}
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-800 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              name="description"
              placeholder="Optional"
              onChange={handleChange}
              value={form.description}
              rows="3"
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-800 outline-none"
            />
          </div>

          {/* ================= Invite Users ================= */}
          <div>
            <label className="text-sm text-gray-600">Invite Users</label>
            <div className="flex flex-wrap gap-2 mb-1">
              {form.inviteUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {u.email}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(u.id)}
                    className="ml-1 text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-800 outline-none mb-1"
            />
            <div className="border rounded-lg max-h-32 overflow-y-auto">
              {loadingUsers ? (
                <p className="text-gray-500 p-2">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-gray-500 p-2">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 cursor-pointer hover:bg-blue-100"
                    onClick={() => handleAddUser(user)}
                  >
                    {user.email}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default AddEventModal;
