import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";

const DriverView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState({});
  const [loading, setLoading] = useState(!!userId);
  const { getDataByParams } = useApi();

  const descriptionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(ApiEndPoint.userDetail, userId);

        if (response?.success && response?.data) {
          setList(response.data);
        } else {
          toast.error("Failed to fetch user data");
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
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [list?.description]);

  const Field = ({ label, value }) => (
    <div className="w-full md:w-[48%]">
      <label className="block mb-1 text-xs uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </label>

      <div
        className="
        w-full px-4 py-3 rounded-xl
        bg-gradient-to-br from-slate-50 to-slate-100
        text-slate-800 font-medium
        shadow-sm
        border border-slate-200/60
        transition-all
        hover:shadow-md
      "
      >
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </div>
    </div>
  );

  const ImageField = ({ label, value }) => {
    // const defaultImage = "/logo.jpeg";
    
    return (
      <div className="w-full md:w-[48%]">
        <label className="block mb-2 text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {label}
        </label>

        <div
          className="
          w-full px-4 py-4 rounded-xl
          bg-gradient-to-br from-slate-50 to-slate-100
          shadow-sm
          border border-slate-200/60
          transition-all
          hover:shadow-md
        "
        >
          <img
            // src={value ? `${ApiEndPoint.baseUrl}${value}` : defaultImage}
            src={`${ApiEndPoint.baseUrl}${value}`}

            alt={label}
            className="w-full h-64 object-contain rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              // e.target.src = defaultImage;
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm max-w-2xxl mx-auto mt-3"
      style={{ marginLeft: "12px" }}
    >
      <div className="mb-8">
        <button
          onClick={() => navigate("/driver_listing")}
          className="bg-gray-800 text-white p-2 rounded-md mb-4 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl text-center font-medium text-gray-700">
          Driver View
        </h1>
      </div>

      <div className="flex justify-center mb-4">
        {list?.profilePicture ? (
          <img
            src={`${ApiEndPoint.baseUrl}${list.profilePicture}`}
            alt="User Profile"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
            onError={(e) => {
              e.target.onerror = null;
              // e.target.src = "https://via.placeholder.com/150/e2e8f0/64748b?text=No+Image";
            }}
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border border-gray-300">
            <span className="text-4xl font-semibold text-gray-700">
              {list?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin h-6 w-6 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full" />
          Loading Data...
        </div>
      ) : (
        <>
          {/* User Information Section */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Field label="Full Name" value={list.fullName} />
            <Field label="Email" value={list.email} />
            <Field
              label="Phone Number"
              value={`${list.countryCode || ""} ${list.phoneNumber || ""}`}
            />
            <Field label="Date Of Birth" value={list.dob} />
            <Field label="Nationality" value={list.nationality} />
            <Field label="License Number" value={list.driversLicenseNumber} />
            <Field label="Licence Type" value={list.licenceType} />
            <Field label="Registration Expiry Date" value={list.registrationExpiryDate} />
            <Field label="Insurance Expiry Date" value={list.insuranceExpiryDate} />
            <Field label="Vehicle Number" value={list.vehicleNumber} />
          </div>

          {/* Images Section */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Documents & Images
            </h2>
            <div className="flex flex-wrap gap-4">
              <ImageField label="Licence Front Image" value={list.licenceFrontImage} />
              <ImageField label="Licence Back Image" value={list.licenceBackImage} />
              <ImageField label="Picture Of Vehicle" value={list.pictureOfVehicle} />
              <ImageField label="Vehicle Registration Image" value={list.vehicleRegistrationImage} />
              <ImageField label="Insurance Policy Image" value={list.insurancePolicyImage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DriverView;