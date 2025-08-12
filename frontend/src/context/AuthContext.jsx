import { createContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext();

import { useLocation } from 'react-router-dom';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const publicPaths = ["/", "/login", "/register"];

  useEffect(() => {
    if (publicPaths.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get("/user/verify", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [location.pathname]);

  

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
