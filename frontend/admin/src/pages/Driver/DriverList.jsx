import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function DriverList() {
  // Initialize state from URL parameters
  const getInitialStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      page: Math.max(1, parseInt(params.get("page")) || 1), // Ensure minimum page is 1
      limit: parseInt(params.get("limit")) || 10,
      search: params.get("search") || "",
    };
  };
  // State management
  const initialState = getInitialStateFromURL();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
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
  const { getData, deleteData, putData } = useApi();
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
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users data with server-side pagination and search
  const fetchUsers = useCallback(
    async (page, limit, search = "") => {
      try {
        setLoading(true);
        // Calculate skip value (offset)
        const skip = page - 1;
        // Update URL
        updateURL(page, limit, search);
        // Prepare query parameters
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          skip: skip.toString(),
          ...(search && { search: search.trim() }), // Only add search if it's not empty
        });
        // Make API call with query parameters
        const response = await getData(
          `${ApiEndPoint.getAllDriver}?${queryParams.toString()}`
        );

        if (response.body) {
          setUsers(response.body.rows || []);
          setTotalRecords(response.body.count || 0);
          setTotalPages(Math.ceil((response.body.count || 0) / limit));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
        setTotalRecords(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [getData, updateURL]
  ); // Remove dependencies to prevent infinite re-renders

  // Fetch users when component mounts or dependencies change
  useEffect(() => {
    fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
  }, [currentPage, entriesPerPage, debouncedSearchQuery]);

  // Reset to first page when search query changes (but not on initial load)
  useEffect(() => {
    // Only reset if we're not on the initial load and search actually changed
    if (debouncedSearchQuery !== initialState.search && currentPage !== 1) {
      setCurrentPage(initialState.page);
    }
  }, [debouncedSearchQuery]); // Remove entriesPerPage from dependency

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

  const handleStatusChange = async (userId, newStatus) => {
    try {
      // Set loading state for entire screen
      setStatusUpdateLoading(true);

      let data = {
        userId: userId,
        status: newStatus,
      };
      console.log("==", data);
      let response = await putData(ApiEndPoint.userStatusChange, data, false);

      if (response.code == 200) {
        Swal.fire("Success", "Status updated successfully", "success");
        fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
      } else {
        Swal.fire("Error", "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      // Remove loading state
      setStatusUpdateLoading(false);
    }
  };

  // Handle entries per page change
  const handleEntriesChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setEntriesPerPage(newLimit);
    setCurrentPage(1); // Reset to first page
  };

  // Handle delete user
  const handleDeleteUser = async (userId, userName) => {
    // if (window.confirm(`Are you sure you want to delete "${userName}"?`)) {
    try {
      // Add your delete API call here

      Swal.fire({
        title: "Are you sure?",
        text: `Are you sure you want to delete "${userName}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Delete!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // Show success message
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: `"${userName}" has been deleted successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });
            await deleteData(`${ApiEndPoint.deleteUser}/${userId}`);

            // Refresh user list
            fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
          } catch (error) {
            console.error("Delete error:", error);

            // Show error message
            Swal.fire({
              icon: "error",
              title: "Delete Failed",
              text: error?.response?.data?.message || "Something went wrong!",
            });
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: "Something went wrong!",
          });
        }
      });

      // Refresh the current page after deletion
      // fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);

      console.log("Driver deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      // Handle error (show toast/notification)
    }
    // }
  };

  // Calculate display indices
  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      {/* Enhanced Full Screen Loader with Pure Blur Background */}
      {statusUpdateLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Pure Blurred Background */}
          <div
            className="absolute inset-0 backdrop-blur-md"
            style={{
              backdropFilter: "blur(2px)",
              background: "rgba(0, 0, 0, 0.5)",
            }}
          ></div>

          {/* Crystal Clear Loader */}
          <div className="relative z-10 bg-white bg-opacity-95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white border-opacity-50">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-200 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Updating Status
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we process your request...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-t-lg shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Driver</h1>
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
                  placeholder="Search users..."
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
                    S&nbsp;NO.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMAIL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PHONE&nbsp;NO.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PROFILE&nbsp;PIC.
                  </th>
                  {/* <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th> */}

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No driver found matching your search"
                        : "No driver found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {startIndex + index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.countryCode + "-" + user.phoneNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profilePicture ? (
                          <img
                            src={`${ApiEndPoint.baseUrl}${user.profilePicture}`}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            No Image
                          </span>
                        )}
                      </td>

                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                user.status === 1 ? 0 : 1
                              )
                            }
                            disabled={statusUpdateLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                              user.status === 1 ? "bg-green-500" : "bg-red-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                user.status === 1
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td> */}

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {/* View Button */}
                        <button
                          onClick={() => navigate(`/driver_view/${user.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Edit Button */}
                        {/* <button
                          onClick={() => navigate(`/users_edit/${user.id}`)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button> */}

                        {/* Delete Button */}
                        <button
                          onClick={() =>
                            handleDeleteUser(user.id, user.fullName)
                          }
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
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
                    // Show pages around current page for large datasets
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

export default DriverList;
