import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";

const LayoutWrapper = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 992) {
      toggleSidebar(false);
    }
  }, [location, toggleSidebar]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        toggleSidebar(false);
      } else {
        toggleSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [toggleSidebar]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
        style={{
          background:
            "linear-gradient(135deg, #2F3442 0%, #363C4F 50%, #3E4560 100%)",
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Page content with smooth transition */}
        <main className="flex-1 px-6 py-4 mt-[100px] overflow-y-auto">
          {/* <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            > */}
          <Outlet />
          {/* </motion.div> */}
          {/* </AnimatePresence> */}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LayoutWrapper;
