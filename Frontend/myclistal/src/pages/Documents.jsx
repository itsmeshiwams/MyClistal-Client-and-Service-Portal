// src/pages/Documents.jsx
import { useEffect, useState } from "react";
import { fetchDocuments } from "../api/documents";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ClientDocument from "./ClientDocument";
import StaffDocument from "./StaffDocument";

export default function Documents() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadDocuments = async () => {
      const response = await fetchDocuments(user?.role);
      setData(response);
    };
    loadDocuments();
  }, [user]);

  if (!data)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className=" min-h-screen">
          {user?.role === "Client" ? (
            <ClientDocument data={data.documents} />
          ) : (
            <StaffDocument data={data.documents} />
          )}
        </main>
      </div>
    </div>
  );
}
