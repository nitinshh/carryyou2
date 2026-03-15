import React, { useEffect, useState } from "react";
import { ArrowLeft, User, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import axios from "axios";

function UserAddEdit() {
  const { userId } = useParams();
  const isEditMode = !!userId;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [countryCodes, setCountryCodes] = useState([]);
  const [originalImage, setOriginalImage] = useState(""); // ✅ track original
  const [imageRemoved, setImageRemoved] = useState(false); // ✅ track removal
  const [showPassword, setShowPassword] = useState(false);         // ✅ eye toggle
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ eye toggle
  const { getDataByParams, putData, postData } = useApi();

  // ─── Fetch user data in Edit mode ───────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(ApiEndPoint.userDetail, userId);
        console.log("response", response);
        if (response?.success === true && response.data) {
          const { fullName, email, countryCode, phoneNumber } = response.data;
          setFormData((prev) => ({ ...prev, fullName, email, countryCode, phoneNumber }));
          if (response.data.profilePicture) {
            const imgUrl = `${ApiEndPoint.baseUrl}${response.data.profilePicture}`;
            setPreviewImage(imgUrl);
            setOriginalImage(imgUrl); // ✅ save original
          }
        } else {
          toast.error("Failed to fetch user data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Error fetching user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // ─── Fetch Country Codes ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/all?fields=name,idd");
        const codes = response.data
          .map((country) => ({
            name: country.name.common,
            code: country.idd?.root
              ? country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : "")
              : "",
          }))
          .filter((c) => c.code)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountryCodes(codes);
      } catch (err) {
        console.error("Failed to fetch country codes", err);
      }
    };
    fetchCountryCodes();
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, profilePictureFile: file }));
      setImageRemoved(false); // ✅ new image selected, not removed
    }
  };

  // ✅ Remove image handler
  const handleRemoveImage = () => {
    setPreviewImage("");
    setFormData((prev) => ({ ...prev, profilePictureFile: null }));
    setImageRemoved(true);
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const { fullName, email, countryCode, phoneNumber, password, confirmPassword } = formData;

    if (!fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Valid email is required"); return false;
    }
    if (!countryCode) { toast.error("Country code is required"); return false; }
    if (!phoneNumber.trim() || !/^\d{7,15}$/.test(phoneNumber)) {
      toast.error("Valid phone number is required (7–15 digits)"); return false;
    }
    if (!isEditMode) {
      if (!password) { toast.error("Password is required"); return false; }
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
      if (password !== confirmPassword) { toast.error("Passwords do not match"); return false; }
    }

    return true;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const dataToSend = new FormData();

      if (isEditMode) dataToSend.append("userId", userId);
      dataToSend.append("role", 1);

      // ✅ Send removeImage key: true if image was removed, false otherwise
      if (isEditMode) {
        dataToSend.append("removeImage", imageRemoved ? "true" : "false");
      }

      Object.keys(formData).forEach((key) => {
        if (key === "confirmPassword") return;
        if (key === "password" && isEditMode) return;
        if (key === "profilePictureFile" && formData[key]) {
          dataToSend.append("image", formData[key]);
        } else if (formData[key] != null && formData[key] !== "") {
          dataToSend.append(key, formData[key]);
        }
      });

      let response;
      if (isEditMode) {
        response = await putData(ApiEndPoint.updateProfile, dataToSend, true);
      } else {
        response = await postData(ApiEndPoint.createUser, dataToSend, true);
      }

      if (response?.code === 200) {
        toast.success(`User ${isEditMode ? "updated" : "created"} successfully`);
        navigate("/users_listing");
      } else {
        toast.error(`Failed to ${isEditMode ? "update" : "create"} user`);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Error ${isEditMode ? "updating" : "creating"} user`);
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xxl mx-auto mt-3" style={{ marginLeft: "12px" }}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/users_listing")}
          className="bg-gray-800 text-white p-2 rounded-md mb-4 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl text-center font-medium text-gray-700">
          {isEditMode ? "Edit User" : "Add New User"}
        </h1>
      </div>

      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-6">
        <label htmlFor="profileImageUpload" className="cursor-pointer group relative">
          <img
            src={previewImage || "/default-profile.png"}
            alt="User Profile"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <User size={28} className="text-white" />
          </div>
        </label>
        <p className="text-xs text-gray-400 mt-1">Click to upload photo</p>
        <input
          id="profileImageUpload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* ✅ Remove image button — only show in edit mode when image exists */}
        {isEditMode && previewImage && (
          <button
            onClick={handleRemoveImage}
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
          >
            Remove Image
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin h-6 w-6 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full" />
          Loading Data...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">

            {/* Full Name */}
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>

            {/* Email */}
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                readOnly={isEditMode}
                className={`w-full border rounded-md px-3 py-2 text-gray-800 ${
                  isEditMode
                    ? "bg-gray-200 cursor-not-allowed text-gray-500"
                    : "bg-gray-100"
                }`}
              />
            </div>

            {/* Country Code */}
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Country Code <span className="text-red-500">*</span>
              </label>
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              >
                <option value="">Select country code</option>
                {countryCodes.map((c) => (
                  <option key={`${c.name}-${c.code}`} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Phone No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>

            {/* ✅ Password fields — Add mode ONLY, with eye toggle */}
            {!isEditMode && (
              <>
                <div className="w-full md:w-[48%]">
                  <label className="block mb-2 text-gray-700 font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="w-full border rounded-md px-3 py-2 pr-10 bg-gray-100 text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-[48%]">
                  <label className="block mb-2 text-gray-700 font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="w-full border rounded-md px-3 py-2 pr-10 bg-gray-100 text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Save Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#529fb7] text-white px-6 py-2 rounded-md disabled:opacity-60"
            >
              {isEditMode ? "Save Changes" : "Create User"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserAddEdit;