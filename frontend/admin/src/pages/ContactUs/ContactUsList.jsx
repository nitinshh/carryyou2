import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Trash2,
} from "lucide-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function ContactUsList() {
  // Initialize state from URL parameters
  const getInitialStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      page: Math.max(1, parseInt(params.get("page")) || 1),
      limit: parseInt(params.get("limit")) || 10,
      search: params.get("search") || "",
    };
  };

  // State management
  const initialState = getInitialStateFromURL();
  const navigate = useNavigate();
  const [contactUs, setContactUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState(initialState.limit);
  const [currentPage, setCurrentPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialState.search);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    initialState.search
  );

  // Get API hook
  const { getData, deleteData } = useApi();

  // Update URL without causing re-render
  const updateURL = useCallback((page, limit, search) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (search && search.trim()) {
      params.set("search", search.trim());
    }

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
  }, []);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch contact us data with server-side pagination and search
  const fetchContactUs = useCallback(
    async (page, limit, search = "") => {
      try {
        setLoading(true);
        const skip = page - 1;
        updateURL(page, limit, search);

        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          skip: skip.toString(),
          ...(search && { search: search.trim() }),
        });

        const response = await getData(
          `${ApiEndPoint.contactUsList}?${queryParams.toString()}`
        );
      console.log("response===>",response);
      
        if (response.body) {
          setContactUs(response.body.rows || []);
          setTotalRecords(response.body.count || 0);
          setTotalPages(Math.ceil((response.body.count || 0) / limit));
        }
      } catch (error) {
        console.error("Error fetching contact us:", error);
        setContactUs([]);
        setTotalRecords(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [getData, updateURL]
  );

  // Fetch contact us when component mounts or dependencies change
  useEffect(() => {
    fetchContactUs(currentPage, entriesPerPage, debouncedSearchQuery);
  }, [currentPage, entriesPerPage, debouncedSearchQuery]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== initialState.search && currentPage !== 1) {
      setCurrentPage(initialState.page);
    }
  }, [debouncedSearchQuery]);

  // Reset to first page when entries per page changes
  useEffect(() => {
    if (entriesPerPage !== initialState.limit && currentPage !== 1) {
      setCurrentPage(initialState.page);
    }
  }, [entriesPerPage]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle page changes
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle entries per page change
  const handleEntriesChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setEntriesPerPage(newLimit);
    setCurrentPage(1);
  };

  // Get priority label and color
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { label: "Low", color: "text-green-600 bg-green-100" };
      case 2:
        return { label: "Medium", color: "text-yellow-600 bg-yellow-100" };
      case 3:
        return { label: "High", color: "text-red-600 bg-red-100" };
      default:
        return { label: "N/A", color: "text-gray-600 bg-gray-100" };
    }
  };

  // Handle delete contact us
  const handleDeleteContactUs = async (id, subject) => {
    try {
      Swal.fire({
        title: "Are you sure?",
        text: `Are you sure you want to delete "${subject}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Delete!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await deleteData(`${ApiEndPoint.contactUsDelete}/${id}`);

            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: `"${subject}" has been deleted successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });

            fetchContactUs(currentPage, entriesPerPage, debouncedSearchQuery);
          } catch (error) {
            console.error("Delete error:", error);

            Swal.fire({
              icon: "error",
              title: "Delete Failed",
              text: error?.response?.data?.message || "Something went wrong!",
            });
          }
        }
      });
    } catch (error) {
      console.error("Error deleting contact us:", error);
    }
  };

  // Calculate display indices
  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-t-lg shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Contact Us</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-gray-600 mr-2">Show</span>
              <select
                value={entriesPerPage}
                onChange={handleEntriesChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S NO.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SUBJECT 
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SUBJECT (FI)
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MESSAGE 
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MESSAGE (FI)
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRIORITY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : contactUs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No data found matching your search"
                        : "No data found"}
                    </td>
                  </tr>
                ) : (
                  contactUs.map((item, index) => {
                    const priorityInfo = getPriorityInfo(item.priority);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {startIndex + index}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {item.subjectInEnglish || "N/A"}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {item.subjectInFinnish || "N/A"}
                          </div>
                        </td> */}
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs whitespace-pre-line break-words bg-gray-50 border border-gray-200 p-2 rounded">
                            {item.messageInEnglish?.length > 100
                              ? `${item.messageInEnglish.slice(0, 100)}...`
                              : item.messageInEnglish || "N/A"}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs whitespace-pre-line break-words bg-gray-50 border border-gray-200 p-2 rounded">
                            {item.messageInFinnish?.length > 100
                              ? `${item.messageInFinnish.slice(0, 100)}...`
                              : item.messageInFinnish || "N/A"}
                          </div>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}
                          >
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          {/* View Button */}
                          <button
                            onClick={() => navigate(`/contactUs_view/${item.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() =>
                              handleDeleteContactUs(
                                item.id,
                                item.subjectInEnglish || item.subjectInFinnish || "Contact"
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {totalRecords > 0 ? startIndex : 0} to {endIndex} of{" "}
              {totalRecords} entries
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {totalPages > 0 &&
                [...Array(Math.min(totalPages, 10)).keys()].map((number) => {
                  let pageNumber;
                  if (totalPages <= 10) {
                    pageNumber = number + 1;
                  } else {
                    const startPage = Math.max(1, currentPage - 5);
                    pageNumber = startPage + number;
                    if (pageNumber > totalPages) return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`flex items-center justify-center w-8 h-8 rounded-md ${
                        currentPage === pageNumber
                          ? "bg-[#529fb7] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUsList;