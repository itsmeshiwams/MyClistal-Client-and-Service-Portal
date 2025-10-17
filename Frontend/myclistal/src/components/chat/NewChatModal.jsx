import React, { useState } from "react";
import { searchUsers, getOrCreatePrivateChat } from "../../api/chat";
import { X, Search } from "lucide-react";

export default function NewChatModal({ onClose, onOpenChat }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await searchUsers(val);
      setResults(res.data || []);
    } catch (err) {
      console.error("User search error", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectUser(u) {
    try {
      setCreating(true);
      const res = await getOrCreatePrivateChat(u._id);
      const { chat } = res.data;
      onOpenChat(chat);
      onClose();
    } catch (err) {
      console.error("create chat error", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          <X size={22} />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-blue-900 text-center">Start New Chat</h3>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={query}
            onChange={handleSearch}
            placeholder="Search user by email..."
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 
              focus:ring-2 focus:ring-blue-800 focus:border-blue-800 outline-none
              text-sm transition-all duration-200 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-6">Searching...</div>
        ) : results.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {results.map((u) => (
              <li
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="p-3 rounded-md flex justify-between items-center hover:bg-blue-50 cursor-pointer transition"
              >
                <span className="text-gray-800">{u.email}</span>
                <span className="text-xs text-gray-500">{u.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-400 py-6">No users found</div>
        )}

        {creating && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-gray-600 rounded-2xl">
            Creating chat...
          </div>
        )}
      </div>
    </div>
  );
}
