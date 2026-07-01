import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { api } from "./api";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Repos from "./pages/Repos";
import Rules from "./pages/Rules";
import Dashboard from "./pages/Dashboard";

function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      api.get("/auth/me").then((r) => setUser(r.data)).catch(() => {});
    }
  }, []);

  const withUser = (Component) => <Protected><Component user={user} /></Protected>;

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={withUser(Dashboard)} />
          <Route path="/repos" element={withUser(Repos)} />
          <Route path="/rules" element={withUser(Rules)} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
