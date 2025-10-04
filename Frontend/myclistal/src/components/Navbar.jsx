import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex justify-between items-center  px-6 py-4 top-0 z-10">
      <h2 className="text-2xl font-bold text-gray-900">
        {user?.role === "Client" ? "Client" : "Staff "}
      </h2>
      <div className="flex items-center gap-5">
        <div className="relative">
          <Bell className="text-gray-600 cursor-pointer hover:text-gray-800 transition w-6 h-6" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </div>
        <span className="hidden sm:inline text-base font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
          {user?.email}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white cursor-pointer bg-blue-800 px-3 py-2 rounded-lg hover:bg-blue-900 transition"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
