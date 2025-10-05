import { useState } from "react";
import { Home, FileText,ClipboardList, Calendar, MessageSquare, DollarSign, Shield, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
  { name: "Tasks", icon: <ClipboardList size={20} />, path: "/tasks" },
  { name: "Documents", icon: <FileText size={20} />, path: "/documents" },
  { name: "Calendar", icon: <Calendar size={20} />, path: "/calendar" },
  { name: "Communication", icon: <MessageSquare size={20} />, path: "/communication" },
  { name: "Billing", icon: <DollarSign size={20} />, path: "/billing" },
  { name: "Compliance", icon: <Shield size={20} />, path: "/compliance" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-20 bg-white shadow p-2 rounded-lg"
      >
        <Menu size={24} />
      </button>

      <aside
        className={`fixed md:static top-0 left-0 h-screen shadow-md bg-white w-60 p-4 transition-transform duration-300 z-10
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="mb-6">
          <img src="/Logo.png" alt="Logo" className="h-12 mx-auto" />
        </div>
        <nav className="space-y-2 text-lg">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 ${
                  isActive ? "bg-gray-100 text-blue-800 font-semibold" : "text-gray-700"
                }`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
