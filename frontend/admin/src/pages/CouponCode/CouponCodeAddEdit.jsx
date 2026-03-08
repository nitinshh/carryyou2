import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";

const CouponCodeAddEdit = () => {
  const { couponId } = useParams();
  const navigate = useNavigate();
  const { getDataByParams, putData, postData } = useApi();

  const [couponData, setCouponData] = useState({
    name: "",
    code: "",
    percentageOff: "",
  });
  const [loading, setLoading] = useState(!!couponId);
  const [error, setError] = useState("");

  // Fetch existing Coupon (Edit mode)
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(
          ApiEndPoint.getDetailCouponCode,
          couponId
        );

        if (response?.code === 200 && response.body) {
          setCouponData({
            name: response.body?.name || "",
            code: response.body?.code || "",
            percentageOff: response.body?.percentageOff ?? "",
          });
        } else {
          toast.error("Failed to fetch coupon data");
        }
      } catch (err) {
        toast.error("Error fetching coupon");
        console.log(err)
      } finally {
        setLoading(false);
      }
    };

    if (couponId) fetchCoupon();
  }, [couponId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCouponData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!couponData.name.trim()) {
      setError("Coupon name is required.");
      return;
    }
    if (!couponData.code.trim()) {
      setError("Coupon code is required.");
      return;
    }
    if (couponData.percentageOff === "" || couponData.percentageOff === null) {
      setError("Percentage off is required.");
      return;
    }
    const pct = Number(couponData.percentageOff);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Percentage off must be between 0 and 100.");
      return;
    }

    setError("");
    setLoading(true);

    const payload = {
      name: couponData.name.trim(),
      code: couponData.code.trim().toUpperCase(),
      percentageOff: pct,
      ...(couponId && { id: couponId }),
    };

    try {
      const response = couponId
        ? await putData(ApiEndPoint.updateCouponCode, payload)
        : await postData(ApiEndPoint.addCouponCode, payload);

      if (response?.code === 200) {
        toast.success(
          couponId
            ? "Coupon updated successfully"
            : "Coupon added successfully"
        );
        setTimeout(() => navigate("/couponCode_listing"), 150);
      } else {
        toast.error(response?.message || "Failed to save coupon");
      }
    } catch (err) {
      toast.error("Error saving coupon");
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/couponCode_listing")}
          className="text-white p-2 rounded-md hover:opacity-90 transition"
          style={{
            background:
              "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {couponId ? "Edit Coupon Code" : "Add Coupon Code"}
        </h1>
      </div>

      {loading && couponId ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading coupon data...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6"
        >
          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Coupon Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={couponData.name}
              onChange={handleChange}
              placeholder="Enter coupon name"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Code Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={couponData.code}
              onChange={handleChange}
              placeholder="e.g. SAVE20"
              className="w-full border border-gray-300 rounded-md px-4 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Percentage Off Field */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Percentage Off (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="percentageOff"
              value={couponData.percentageOff}
              onChange={handleChange}
              placeholder="Enter percentage (0 - 100)"
              min="0"
              max="100"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
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
              onClick={() => navigate("/couponCode_listing")}
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
                background:
                  "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
              }}
            >
              {loading
                ? "Processing..."
                : couponId
                ? "Update Coupon"
                : "Add Coupon"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CouponCodeAddEdit;