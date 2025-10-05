import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/Logo.png"; // adjust path if needed
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Client");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 2000);
      return () => clearTimeout(timer); // cleanup
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password, role });
      login(data); // set context + localStorage
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white border shadow-md p-24 w-auto">
        {/* Logo */}
        <div className="flex justify-center align-middle self-center mb-12">
          <img src={Logo} alt="Clistal Logo" className="h-24 w-auto cursor-pointer" />
        </div>

        <h2 className="text-center text-4xl font-bold mb-4">Login to MyClistal</h2>
        <p className="text-center text-lg text-gray-500 mb-8">
          Enter your credentials to access your portal
        </p>

        {error && <p className="text-red-500 font-semibold text-center mb-2 transition-opacity duration-500">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label className="block text-lg mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ram@example.com"
            className="border rounded w-full p-2 text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-800"
          />

          <label className="block text-lg mb-1">Password</label>
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="border rounded w-full text-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-3 cursor-pointer text-blue-800"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-lg mb-1">Select Role</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  value="Client"
                  checked={role === "Client"}
                  onChange={(e) => setRole(e.target.value)}
                  className="accent-blue-800 cursor-pointer"
                />
                <span>Client</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  value="Staff"
                  checked={role === "Staff"}
                  onChange={(e) => setRole(e.target.value)}
                  className="accent-blue-800 cursor-pointer"
                />
                <span>Staff</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-800 text-white w-full text-lg py-2 cursor-pointer rounded hover:bg-blue-900 transition"
          >
            Login
          </button>
        </form>

        <p className="text-center text-lg text-gray-500 mt-4">
          Don't have an account?{" "}
          <a href="/login" className="text-blue-800 hover:underline">
            Contact Admin
          </a>
        </p>
      </div>
    </div>
  );
}
