// src/pages/Chat.jsx
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ClientChat from "./ClientChat";
import StaffChat from "./StaffChat";

export default function Chat() {
  const { user } = useAuth();

  return (
    <div className="flex">
      {/* Sidebar Section (sticky left) */}
      <div className="h-full sticky bottom-0 top-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ">
        <Navbar />

        <main className="flex-1 min-h-screen">
          {user?.role === "Client" ? <ClientChat /> : <StaffChat />}
        </main>
      </div>
    </div>
  );
}
