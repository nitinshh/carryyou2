import "./App.css";
import { ToastContainer } from "react-toastify";
import { Routes, Route, Navigate } from "react-router-dom";

import LayoutWrapper from "./components/layout/LayoutWrapper";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./components/Profile";
import Resetpassword from "./components/Resetpassword";
import UserList from "./pages/User/UserList";
import UserView from "./pages/User/UserView";
import UserEdit from "./pages/User/UserEdit";

import { useState, useEffect } from "react";

function App() {
  // const isAuthenticated = false;
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    // Listen for token changes
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <>
      <Routes>
        {isAuthenticated ? (
          <Route
            element={
              <LayoutWrapper
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              />
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resetPassword" element={<Resetpassword />} />
            <Route path="/users_listing" element={<UserList />} />
            <Route path="/users_edit/:userId" element={<UserEdit />} />
            <Route path="/users_view/:userId" element={<UserView />} />


            {/* Redirect all unmatched routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>

      <ToastContainer position="top-right" autoClose={1000} />
    </>
  );
}

export default App;
