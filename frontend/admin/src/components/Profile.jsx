import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Camera, Save, Edit3, X } from "lucide-react";
import useApi from "../components/useApi";
import { toast } from "react-toastify";
import ApiEndPoint from "../components/ApiEndPoint";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState({});
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [initialName, setInitialName] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef();
  const { putData } = useApi();
  const [countryCodes, setCountryCodes] = useState([]);

  const [changed, setChanged] = useState(false);

  useEffect(() => {
    setChanged(
      name !== initialName ||
        !!profilePicture ||
        imageRemoved ||
        phoneNumber !== user?.phoneNumber ||
        countryCode !== user?.countryCode
    );
  }, [
    name,
    initialName,
    profilePicture,
    imageRemoved,
    phoneNumber,
    countryCode,
  ]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("authData"));
    if (userData) {
      setUser(userData);
      setName(userData.fullName || "");
      setPhoneNumber(userData.phoneNumber || "");
      setCountryCode(userData.countryCode || "");
      setImagePreview(userData.profilePicture || null);
      setInitialName(userData.fullName || "");
    }
  }, [successMessage]);

  // const isChanged = name !== initialName || !!profilePicture || imageRemoved;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setProfilePicture(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const response = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,idd"
        );
        const codes = response.data
          .map((country) => ({
            name: country.name.common,
            code: country.idd?.root
              ? country.idd.root +
                (country.idd.suffixes ? country.idd.suffixes[0] : "")
              : "",
          }))
          .filter((c) => c.code);
        codes.sort((a, b) => a.name.localeCompare(b.name));
        setCountryCodes(codes);
      } catch (err) {
        console.error("Failed to fetch country codes", err);
      }
    };
    fetchCountryCodes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phoneNumber", phoneNumber);
    formData.append("countryCode", countryCode);

    if (profilePicture) {
      formData.append("image", profilePicture);
    }

    if (imageRemoved) {
      formData.append("removeImage", "true");
    }

    const response = await putData(ApiEndPoint.updateProfile, formData, true);

    if (response && response.code === 200 && response.body) {
      localStorage.setItem("authData", JSON.stringify(response.body));
      setUser(response.body);
      setName(`${response.body.fullName}`);
      setInitialName(`${response.body.fullName}`);
      setPhoneNumber(response.body.phoneNumber || "");
      setCountryCode(response.body.countryCode || "");

      // ✅ Only reset profilePicture (new file) but set imagePreview from backend
      setProfilePicture(null);
      setImagePreview(response.body.profilePicture || null);
      setImageRemoved(false);

      // Dispatch custom event
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Profile updated successfully");
      setSuccessMessage("Profile updated successfully!");

      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage("");
      }, 0);
    } else {
      setIsLoading(false);
    }
  };

  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
  };

  return (
    <div className="min-h-[auto] py-10">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-emerald-800 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4 lg:flex-shrink-0">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-2xl border-4 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    {imagePreview ? (
                      <img
                        src={
                          imagePreview?.startsWith("blob:")
                            ? imagePreview
                            : `${ApiEndPoint.baseUrl}${imagePreview}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={48} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Camera size={20} className="text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <button
                    onClick={removeImage}
                    className="flex items-center space-x-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    <X size={16} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                        <User size={16} className="text-slate-600" />
                      </div>
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all duration-200 bg-white hover:border-slate-300"
                        placeholder="Enter your full name"
                      />
                      <Edit3
                        size={18}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                        <Mail size={16} className="text-slate-600" />
                      </div>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Phone size={16} className="text-slate-600" />
                    </div>
                    Phone Number
                  </label>
                  <div className="flex space-x-4">
                    <select
                      name="countryCode"
                      value={countryCode}
                      onChange={handleCountryCodeChange}
                      className="w-28 md:w-32 border rounded-md px-2 py-2 bg-gray-100 text-gray-800 text-sm appearance-none"
                    >
                      <option value="">Country Code</option>
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !changed}
                    className="w-full md:w-auto px-8 py-4  bg-gradient-to-r from-[#0B1D3A] via-[#102A56] to-[#1E3A8A]
                hover:opacity-90 transition-all text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating Profile...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
