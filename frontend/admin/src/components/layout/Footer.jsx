import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full py-6 border-t border-gray-200"
      style={{
        background:
          "linear-gradient(135deg, #2F3442 0%, #363C4F 50%, #3E4560 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-white text-sm ml-2">
              &copy; {currentYear} Donation Power Admin Panel. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
