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
  CheckCircle,
  XCircle,
  Clock,
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
      page: Math.max(1, parseInt(params.get("page")) || 1),
      limit: parseInt(params.get("limit")) || 10,
      search: params.get("search") || "",
    };
  };
  
  const initialState = getInitialStateFromURL();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState(initialState.limit);
  const [currentPage, setCurrentPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialState.search);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    initialState.search
  );

  const { getData, deleteData, putData } = useApi();
  
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(
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
  );

  useEffect(() => {
    fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
  }, [currentPage, entriesPerPage, debouncedSearchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery !== initialState.search && currentPage !== 1) {
      setCurrentPage(initialState.page);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (entriesPerPage !== initialState.limit && currentPage !== 1) {
      setCurrentPage(initialState.page);
    }
  }, [entriesPerPage]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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

  // Handle approval status change from dropdown
  const handleApprovalChange = async (userId, userName, currentStatus, newStatus) => {
    // Don't do anything if status hasn't changed
    if (currentStatus === newStatus) {
      return;
    }

    const getStatusText = (status) => {
      switch (status) {
        case 0: return "Pending";
        case 1: return "Approved";
        case 2: return "Rejected";
        default: return "Unknown";
      }
    };

    const statusColor = newStatus === 1 ? "#3085d6" : newStatus === 2 ? "#d33" : "#6c757d";
    
    Swal.fire({
      title: "Confirm Status Change",
      html: `Change status for <strong>"${userName}"</strong> to <strong>${getStatusText(newStatus)}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: statusColor,
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, change it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setApprovalLoading(true);

          const data = {
            userId: userId,
            adminApprovalStatus: newStatus,
          };

          const response = await putData(
            ApiEndPoint.approveRejectDriver,
            data,
            false
          );

          if (response.code === 200) {
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: `Status changed to ${getStatusText(newStatus)}`,
              timer: 1500,
              showConfirmButton: false,
            });
            fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
          } else {
            Swal.fire("Error", "Failed to update status", "error");
          }
        } catch (error) {
          console.error("Approval update error:", error);
          Swal.fire("Error", "Something went wrong!", "error");
        } finally {
          setApprovalLoading(false);
        }
      } else {
        // If cancelled, refresh to reset dropdown
        fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
      }
    });
  };

  const handleEntriesChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setEntriesPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
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
            await deleteData(`${ApiEndPoint.deleteUser}/${userId}`);
            
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: `"${userName}" has been deleted successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });

            fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
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

      console.log("Driver deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      {/* Loading Overlay */}
      {(statusUpdateLoading || approvalLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-md"
            style={{
              backdropFilter: "blur(2px)",
              background: "rgba(0, 0, 0, 0.5)",
            }}
          ></div>

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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ADMIN&nbsp;APPROVAL
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
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <select
                            value={user.adminApprovalStatus}
                            onChange={(e) =>
                              handleApprovalChange(
                                user.id,
                                user.fullName,
                                user.adminApprovalStatus,
                                parseInt(e.target.value)
                              )
                            }
                            disabled={approvalLoading}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                              user.adminApprovalStatus === 0
                                ? "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 focus:ring-yellow-300"
                                : user.adminApprovalStatus === 1
                                ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100 focus:ring-green-300"
                                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100 focus:ring-red-300"
                            }`}
                          >
                            <option value={0}>Pending</option>
                            <option value={1}>Approved</option>
                            <option value={2}>Rejected</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => navigate(`/driver_view/${user.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>

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

export default DriverList;