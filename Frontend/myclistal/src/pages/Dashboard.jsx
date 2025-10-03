import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/dashboard";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ClientDashboard from "./ClientDashboard";
import StaffDashboard from "./StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const response = await fetchDashboard();
      setData(response);
    };
    loadData();
  }, []);

  if (!data) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6  min-h-screen">
          {user?.role === "Client" ? (
            <ClientDashboard data={data.dashboard} />
          ) : (
            <StaffDashboard data={data.dashboard} />
          )}
        </main>
      </div>
    </div>
  );
}
