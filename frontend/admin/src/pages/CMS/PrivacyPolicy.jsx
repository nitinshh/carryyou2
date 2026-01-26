import React, { useEffect, useState } from "react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PrivacyPolicy() {
  const { getDataByParams, putData } = useApi();
  const [id, setId] = useState("");

  const [data, setData] = useState({
    title: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);

  // Fetch Privacy Policy Data
  const getPrivacyPolicy = async () => {
    const response = await getDataByParams(`${ApiEndPoint.cms}`, 2);

    if (response?.body) {
      setData({
        title: response.body.title || "",
        content: response.body.description || "",
      });

      setId(response.body.id || "");
    } else {
      toast.error("Failed to load Privacy Policy data.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await getPrivacyPolicy();
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      id,
      title: data.title,
      description: data.content,
    };

    try {
      const res = await putData(`${ApiEndPoint.cmsUpdate}`, payload);

      if (res?.success) {
        toast.success("Privacy Policy Updated Successfully");
        getPrivacyPolicy();
      } else {
        toast.error(res?.message || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while updating.");
    }
  };

  return (
    <>
      <div className="min-h-screen px-4 py-6">
        <div className="max-w-5xl mx-auto bg-white rounded shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Privacy Policy
          </h1>

          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-4 py-2 font-bold"
                  disabled
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Content
                </label>
                <div className="bg-white border border-gray-300 rounded">
                  <CKEditor
                    editor={ClassicEditor}
                    data={data.content}
                    onChange={(event, editor) =>
                      setData({ ...data, content: editor.getData() })
                    }
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="text-white font-medium px-6 py-2 rounded shadow transition-all duration-300 hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(90deg, #24BDF9 0%, #6A80E6 47.89%, #FF00BF 100%)",
                }}
              >
                Update
              </button>
            </form>
          )}
        </div>
      </div>

      <ToastContainer />
    </>
  );
}

export default PrivacyPolicy;
