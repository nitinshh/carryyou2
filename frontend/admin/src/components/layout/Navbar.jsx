import React, { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import Swal from "sweetalert2";
import useApi from "../useApi";
import ApiEndPoint from "../ApiEndPoint";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import rooftop from "../../assets/rooftop.mp4";

const Navbar = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState({
    fullName: "",
    profilePicture: "",
  });
  const [greeting, setGreeting] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { logOutData } = useApi();
  const navigate = useNavigate();

  // Load user
  useEffect(() => {
    const loadUser = () => {
      const userData = JSON.parse(localStorage.getItem("authData"));
      if (userData) setUser(userData);
    };

    loadUser();
    window.addEventListener("profileUpdated", loadUser);
    return () => window.removeEventListener("profileUpdated", loadUser);
  }, []);

  // Greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else if (hour < 22) setGreeting("Good Evening");
      else setGreeting("Welcome Back");
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout
  const handleLogout = () => {
    setDropdownOpen(false);
    Swal.fire({
      title: "Logout",
      html: '<div style="color: #6b7280; font-size: 15px; margin-top: 8px;">This will end your session</div>',
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "minimal-popup",
        title: "minimal-title",
        htmlContainer: "minimal-text",
        actions: "minimal-actions",
        confirmButton: "minimal-confirm-btn",
        cancelButton: "minimal-cancel-btn",
      },
      backdrop: `rgba(0,0,0,0.4)`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("storage"));

        await logOutData(ApiEndPoint.LOGOUT, user.token);

        logout();
        toast.success("Logout Successfully");

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 300);
      }
    });
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-1/2 backdrop-blur-lg bg-gray-900/40 rounded-2xl z-50 shadow-xl flex justify-between items-center px-6 py-3 select-none cursor-default">
        <div className="text-xl font-bold text-white">
          {greeting}, {user.fullName || "Admin"}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-2 rounded-full transition"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30">
              {user.profilePicture ? (
                <img
                  src={`${ApiEndPoint.baseUrl}${user.profilePicture}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {user.fullName?.[0] || "U"}
                </div>
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl z-50 animate-dropdown"
              style={{ animation: "dropdownIn 0.3s forwards" }}
            >
              {[
                {
                  label: "Profile",
                  icon: <User size={16} />,
                  action: () => {
                    setDropdownOpen(false);
                    navigate(`/profile`);
                  },
                },
                {
                  label: "Reset Password",
                  icon: <Settings size={16} />,
                  action: () => {
                    setDropdownOpen(false);
                    navigate(`/resetPassword`);
                  },
                },
                {
                  label: "Logout",
                  icon: <LogOut size={16} />,
                  action: handleLogout,
                  color: "text-red-600",
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className={`w-full flex items-center px-4 py-2 text-sm hover:scale-105 transition-transform ${
                    item.color ? item.color : "text-gray-700"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right-side video */}
      <div className="fixed top-5 right-10 h-18 w-48 overflow-hidden rounded-lg z-40">
        <video
          src={rooftop}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover rounded-lg shadow-lg"
        />
      </div>

      <style>
        {`
  @keyframes dropdownIn {
    0% { opacity: 0; transform: scale(0.95) rotateX(10deg); }
    100% { opacity: 1; transform: scale(1) rotateX(0deg); }
  }

  .minimal-confirm-btn {
    background-color: #ef4444 !important; /* red-500 */
    color: white !important;
    padding: 8px 22px !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    margin-right: 10px !important;
  }

  .minimal-cancel-btn {
    background-color: #d1d5db !important; /* gray-300 */
    color: #374151 !important;            /* gray-700 */
    padding: 8px 22px !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
  }

  .minimal-actions {
    display: flex !important;
    justify-content: center !important;
    gap: 10px !important;
    margin-top: 15px !important;
  }
`}
      </style>
    </>
  );
};

export default Navbar;
