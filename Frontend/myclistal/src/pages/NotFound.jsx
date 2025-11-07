// src/pages/NotFound.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>
      <div className=" flex-1 flex flex-col">
        <Navbar />
        <div className="flex text-center justify-center flex-col items-center h-full p-6">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            404 | Page{" "}
            <span className="font-mono text-blue-600">{location.pathname}</span>{" "}
            Not Found
          </h1>
          <p className="text-lg text-gray-700">
            The page{" "}
            <span className="font-mono text-blue-600">{location.pathname}</span>{" "}
            does not exist.
          </p>
        </div>
      </div>
    </div>
  );
}
