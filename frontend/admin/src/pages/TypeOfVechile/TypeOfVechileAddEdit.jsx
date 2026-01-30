import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";

const TypeOfVechileAddEdit = () => {
  const { typeOfVechileId } = useParams();
  const navigate = useNavigate();
  const { getDataByParams, putData, postData } = useApi();
  
  const [vehicleData, setVehicleData] = useState({
    name: "",
    price: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isServerImage, setIsServerImage] = useState(false); // Track if image is from server
  const [loading, setLoading] = useState(!!typeOfVechileId);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Fetch existing Vehicle Type
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(
          ApiEndPoint.getDetailTypeOfVechile,
          typeOfVechileId
        );
        console.log("response", response);
        
        if (response?.code === 200 && response.body) {
          setVehicleData({
            name: response.body?.name || "",
            price: response.body?.price || "",
            image: null,
          });
          // Set image preview if exists
          if (response.body?.image) {
            setImagePreview(response.body.image);
            setIsServerImage(true); // Mark as server image
          }
        } else {
          toast.error("Failed to fetch vehicle type data");
        }
      } catch (err) {
        toast.error("Error fetching vehicle type");
      } finally {
        setLoading(false);
      }
    };

    if (typeOfVechileId) fetchVehicle();
  }, [typeOfVechileId]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setVehicleData({ ...vehicleData, image: file });
      setIsServerImage(false); // Mark as local image
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setVehicleData({ ...vehicleData, image: null });
    setImagePreview(null);
    setIsServerImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get image source based on whether it's from server or local
  const getImageSource = () => {
    if (!imagePreview) return null;
    
    // If it's a server image (starts with / or http), prepend base URL
    if (isServerImage) {
      // Check if it's already a full URL
      if (imagePreview.startsWith('http://') || imagePreview.startsWith('https://')) {
        return imagePreview;
      }
      // Otherwise prepend base URL
      return `${ApiEndPoint.baseUrl}${imagePreview}`;
    }
    
    // For local images (blob or base64), use as is
    return imagePreview;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!vehicleData.name.trim()) {
      setError("Vehicle name is required.");
      return;
    }
    if (!vehicleData?.price?.toString().trim()) {
      setError("Price is required.");
      return;
    }
    if (isNaN(vehicleData.price) || Number(vehicleData.price) < 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!typeOfVechileId && !vehicleData.image) {
      setError("Image is required.");
      return;
    }

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("name", vehicleData.name.trim());
    formData.append("price", vehicleData.price.toString().trim());
    
    if (vehicleData.image) {
      formData.append("image", vehicleData.image);
    }

    if (typeOfVechileId) {
      formData.append("id", typeOfVechileId);
    }

    try {
      const response = typeOfVechileId
        ? await putData(ApiEndPoint.updateTypeOfVechile, formData, true)
        : await postData(ApiEndPoint.addTypeOfVechile, formData, true);
      
      console.log("response", response);
      
      if (response?.code === 200) {
        toast.success(
          typeOfVechileId
            ? "Vehicle type updated successfully"
            : "Vehicle type added successfully"
        );
        setTimeout(() => navigate("/typeOfVechile_listing"), 150);
      } else {
        toast.error(response?.message || "Failed to save vehicle type");
      }
    } catch (err) {
      toast.error("Error saving vehicle type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/typeOfVechile_listing")}
          className="text-white p-2 rounded-md hover:opacity-90 transition"
          style={{
            background: "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {typeOfVechileId ? "Edit Vehicle Type" : "Add Vehicle Type"}
        </h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading vehicle type...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Vehicle Name*
            </label>
            <input
              type="text"
              value={vehicleData.name}
              onChange={(e) =>
                setVehicleData({ ...vehicleData, name: e.target.value })
              }
              placeholder="Enter vehicle name"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Price Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Price*
            </label>
            <input
              type="number"
              step="0.01"
              value={vehicleData.price}
              onChange={(e) =>
                setVehicleData({ ...vehicleData, price: e.target.value })
              }
              placeholder="Enter price"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Image Upload Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Image{!typeOfVechileId && "*"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4 relative inline-block">
                <img
                  src={getImageSource()}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded-md border border-gray-300 object-cover"
                  onError={(e) => {
                    console.error("Image failed to load");
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/typeOfVechile_listing")}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-white px-6 py-2 rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
              }}
            >
              {loading
                ? "Processing..."
                : typeOfVechileId
                ? "Update Vehicle Type"
                : "Add Vehicle Type"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TypeOfVechileAddEdit;