import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To avoid flicker
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Restore user session on first load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

    if (token && role && email) {
      setUser({ token, role, email });
    }
    setLoading(false); // Done restoring
  }, []);

  // ✅ Track and save last visited route (only if logged in)
  useEffect(() => {
    if (user && location.pathname !== "/" && location.pathname !== "/login") {
      localStorage.setItem("lastPath", location.pathname);
    }
  }, [location, user]);

  // ✅ Login and persist to localStorage
  const login = (data) => {
    if (!data?.token) return;

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("email", data.email);
    setUser(data);

    // Redirect to last visited path or dashboard
    const lastPath = localStorage.getItem("lastPath");
    navigate(lastPath || "/dashboard", { replace: true });
  };

  // ✅ Logout and clear everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("lastPath");
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token: user?.token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
