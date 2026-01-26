import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../components/useApi';
import ApiEndPoint from '../../components/ApiEndPoint';

const ContactUsView = () => {
  const { contactUsId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState('');
  const [loading, setLoading] = useState(!!contactUsId);
  const { getDataByParams } = useApi();

  const messageEnRef = useRef(null);
  const messageFiRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDataByParams(ApiEndPoint.contactUsView, contactUsId);
        if (response?.code === 200 && response.body) {
          setList(response.body || '');
        } else {
          toast.error('Failed to fetch contact data');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Error fetching contact data');
      } finally {
        setLoading(false);
      }
    };

    if (contactUsId) {
      fetchData();
    }
  }, [contactUsId]);

  // Auto-resize textareas based on content
  useEffect(() => {
    if (messageEnRef.current) {
      messageEnRef.current.style.height = 'auto';
      messageEnRef.current.style.height = `${messageEnRef.current.scrollHeight}px`;
    }
    if (messageFiRef.current) {
      messageFiRef.current.style.height = 'auto';
      messageFiRef.current.style.height = `${messageFiRef.current.scrollHeight}px`;
    }
  }, [list?.messageInEnglish, list?.messageInFinnish]);

  // Get priority label and color
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { label: "Low", color: "bg-green-100 text-green-800 border-green-300" };
      case 2:
        return { label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case 3:
        return { label: "High", color: "bg-red-100 text-red-800 border-red-300" };
      default:
        return { label: "N/A", color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  const priorityInfo = getPriorityInfo(list?.priority);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto mt-3">
      <div className="mb-8">
        <button
          onClick={() => navigate('/contactUs_listing')}
          className="bg-gray-800 text-white p-2 rounded-md mb-4 cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl text-center font-medium text-gray-700">View Contact Us</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin h-6 w-6 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full" />
          Loading Data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subject in English */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Subject</label>
            <input
              type="text"
              value={list?.subjectInEnglish || 'N/A'}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
            />
          </div>

          {/* Subject in Finnish */}
          {/* <div>
            <label className="block mb-2 text-gray-700 font-medium">Subject (Finnish)</label>
            <input
              type="text"
              value={list?.subjectInFinnish || 'N/A'}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
            />
          </div> */}

          {/* Message in English */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Message </label>
            <textarea
              ref={messageEnRef}
              value={list?.messageInEnglish || 'N/A'}
              disabled
              rows={1}
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed resize-none overflow-hidden"
            />
          </div>

          {/* Message in Finnish */}
          {/* <div>
            <label className="block mb-2 text-gray-700 font-medium">Message (Finnish)</label>
            <textarea
              ref={messageFiRef}
              value={list?.messageInFinnish || 'N/A'}
              disabled
              rows={1}
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed resize-none overflow-hidden"
            />
          </div> */}

          {/* Priority */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Priority</label>
            <div className={`inline-block px-4 py-2 rounded-md border font-medium ${priorityInfo.color}`}>
              {priorityInfo.label}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Created At</label>
              <input
                type="text"
                value={list?.createdAt ? new Date(list.createdAt).toLocaleString() : 'N/A'}
                disabled
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>
            {/* <div>
              <label className="block mb-2 text-gray-700 font-medium">Updated At</label>
              <input
                type="text"
                value={list?.updatedAt ? new Date(list.updatedAt).toLocaleString() : 'N/A'}
                disabled
                className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUsView;