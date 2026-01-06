import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";

// Pages
import Intro from "./pages/Intro";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import Settings from "./pages/Settings";
import Join from "./pages/Join";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Simple wrapper to handle private routes
function PrivateRoute({ children }) {
  const { user, loading } = useApp();

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
}

// Small wrapper to handle intro redirection
function RootRoute() {
  const { hasVisited, user } = useApp();
  if (user) return <Navigate to="/dashboard" replace />;
  return hasVisited ? <Navigate to="/login" replace /> : <Intro />;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/invite" element={<Join />} />
          <Route element={<PrivateRoute><Outlet /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<Project />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
