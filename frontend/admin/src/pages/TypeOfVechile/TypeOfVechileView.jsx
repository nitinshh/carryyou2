import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../components/useApi';
import ApiEndPoint from '../../components/ApiEndPoint';

const TypeOfVechileView = () => {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const { getDataByParams } = useApi();

  const [faqData, setFaqData] = useState({
    question: '',
  });

  const [loading, setLoading] = useState(!!languageId);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        setLoading(true);

        const response = await getDataByParams(ApiEndPoint.allCommanDetail, languageId);
        
        if (response?.code === 200 && response.body) {
          setFaqData({
            title: response.body.title || '',
          });
        } else {
          toast.error('Failed to fetch Language data');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Error fetching Language');
      } finally {
        setLoading(false);
      }
    };

    if (languageId) fetchFaq();
  }, [languageId]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/skills_listing')}
            className="bg-gray-800 text-white p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl text-center font-semibold text-gray-800 flex-1">
            View Skill
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin h-8 w-8 mx-auto mb-3 border-4 border-[#529fb7] border-t-transparent rounded-full" />
            <p>Loading skill...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* QUESTION */}
            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Title
              </label>
              <input
                type="text"
                value={faqData.title}
                disabled
                className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-50 text-gray-800 cursor-not-allowed"
                placeholder="No question available"
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TypeOfVechileView;
