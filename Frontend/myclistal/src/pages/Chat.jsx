// src/pages/Chat.jsx
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ClientChat from "./ClientPages/ClientChat";
import StaffChat from "./StaffPages/StaffChat";

export default function Chat() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-white">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          {user?.role === "Client" ? <ClientChat /> : <StaffChat />}
        </main>
      </div>
    </div>
  );
}
