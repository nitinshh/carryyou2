import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import axios from "axios";

function DriverEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(!!userId);
  const { getDataByParams, putData } = useApi();
  const [previewImage, setPreviewImage] = useState("");
  const [countryCodes, setCountryCodes] = useState([]);
  const descriptionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(
          ApiEndPoint.getUserDetails,
          userId
        );
        if (response?.code === 200 && response.body) {
          setList(response.body || "");
          setFormData(response.body || {});
        } else {
          toast.error("Failed to fetch contact data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Error fetching contact data");
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchData();
    }
  }, [userId]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, profilePictureFile: file }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const dataToSend = new FormData();
      dataToSend.append("userId", userId);
      Object.keys(formData).forEach((key) => {
        if (key === "profilePictureFile" && formData[key]) {
          dataToSend.append("image", formData[key]);
        } else if (formData[key] != null) {
          dataToSend.append(key, formData[key]);
        }
      });
      const response = await putData(
        ApiEndPoint.updateUserDetails,
        dataToSend,
        true
      );
      if (response?.code === 200) {
        toast.success("User updated successfully");
        navigate("/users_listing");
      } else {
        toast.error("Failed to update user");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Error updating user");
    } finally {
      setLoading(false);
    }
  };

  console.log(countryCodes, "countryCodescountryCodescountryCodes");

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm max-w-2xxl mx-auto mt-3"
      style={{ marginLeft: "12px" }}
    >
      <div className="mb-8">
        <button
          onClick={() => navigate("/users_listing")}
          className="bg-gray-800 text-white p-2 rounded-md mb-4 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl text-center font-medium text-gray-700">
          Edit User Data
        </h1>
      </div>
      <div className="flex flex-col items-center mb-4">
        <label htmlFor="profileImageUpload" className="cursor-pointer">
          <img
            src={
              previewImage ||
              (list?.profilePicture
                ? `${ApiEndPoint.baseUrl}${list.profilePicture}`
                : "/default-profile.png")
            }
            alt="User Profile"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
          />
        </label>
        <input
          id="profileImageUpload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin h-6 w-6 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full" />
          Loading Data...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                First Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName || ""}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>
            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Country Code
              </label>
              <select
                name="countryCode"
                value={formData.countryCode || ""}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              >
                <option value="">Select country code</option>
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-[48%]">
              <label className="block mb-2 text-gray-700 font-medium">
                Phone No.
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleSave}
              className="bg-[#529fb7] text-white px-6 py-2 rounded-md"
            >
              Save Changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DriverEdit;
