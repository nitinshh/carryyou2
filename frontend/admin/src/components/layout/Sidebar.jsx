import { Link, useLocation } from "react-router-dom";
import { Home, Users,Car,FileText, HelpCircle, Info, ShieldCheck, CarFront } from "lucide-react";

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();

  // Check if any of the routes array matches current path
  const isActive = (routes) => {
    const currentPath = location.pathname;

    // If routes is a string, convert to array
    const routeArray = Array.isArray(routes) ? routes : [routes];

    return routeArray.some((route) => {
      // Check exact match
      if (currentPath === route) return true;

      // Check if current path starts with route (for dynamic params like /users_view/:userId)
      if (currentPath.startsWith(route + "/")) return true;

      return false;
    });
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white/95 shadow-2xl z-30 transition-all duration-500 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div
        onClick={toggleSidebar}
        className="flex items-center justify-center p-4 cursor-pointer"
      >
        <div className="w-36 h-16 overflow-hidden">
          {" "}
          <img
            // src="/logo.jpeg"
            src={`${import.meta.env.BASE_URL}logo.jpeg`}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Menu */}
      <div
        className="overflow-y-auto hide-scrollbar"
        style={{
          height: "calc(100vh - 80px)",
        }}
      >
        <ul className="space-y-1 px-3 py-4">
          {[
            {
              to: "/dashboard",
              routes: ["/dashboard"],
              icon: <Home />,
              label: "Dashboard",
            },
            {
              to: "/users_listing",
              routes: ["/users_listing", "/users_edit", "/users_view"],
              icon: <Users />,
              label: "Users",
            },
            {
              to: "/driver_listing",
              routes: ["/driver_listing", "/driver_edit", "/driver_view"],
              icon: <Car />,
              label: "Driver",
            },
            {
              to: "/typeOfVechile_listing",
              routes: ["/typeOfVechile_listing", "/typeOfVechile_edit","/typeOfVechile_add", "/typeOfVechile_view"],
              icon: <CarFront />,
              label: "Type Of Vechile",
            },
             {
              to: "/contactUs_listing",
              routes: ["/contactUs_listing", "/contactUs_view"],
              icon: <HelpCircle />,
              label: "Contact Us",
            },
            {
              to: "/aboutUs",
              routes: ["/aboutUs"],
              icon: <Info />,
              label: "About Us",
            },
            {
              to: "/privacyPolicy",
              routes: ["/privacyPolicy"],
              icon: <ShieldCheck />,
              label: "Privacy Policy",
            },
            {
              to: "/termsAndCondition",
              routes: ["/termsAndCondition"],
              icon: <FileText />,
              label: "Terms & Condition",
            },
          ].map((item, index) => (
            <li key={index}>
              <Link
                to={item.to}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 transform-gpu ${
                  isActive(item.routes)
                    ? "text-white scale-105 shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                }`}
                style={
                  isActive(item.routes)
                    ? {
                        background:
                          "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
                      }
                    : {}
                }
              >
                {/* Icon */}
                <span
                  className={`transition-all duration-300 ${
                    sidebarOpen ? "text-[18px]" : "text-[28px]"
                  }`}
                >
                  {item.icon}
                </span>

                {/* Label with animation */}
                <span
                  className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out ${
                    sidebarOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  style={{
                    display: sidebarOpen ? "inline-block" : "inline-block",
                    pointerEvents: sidebarOpen ? "auto" : "none",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
          <li className="h-6"></li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
