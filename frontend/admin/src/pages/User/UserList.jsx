import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function UserList() {
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
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState(initialState.limit);
  const [currentPage, setCurrentPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialState.search);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialState.search);

  const { getData, deleteData, putData } = useApi();

  const updateURL = useCallback((page, limit, search) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (search && search.trim()) params.set("search", search.trim());
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
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
        const response = await getData(`${ApiEndPoint.getAllUser}?${queryParams.toString()}`);
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
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (entriesPerPage !== initialState.limit && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [entriesPerPage]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      const response = await putData(ApiEndPoint.userStatusChange, { userId, status: newStatus }, false);
      if (response.code === 200) {
        Swal.fire("Success", "Status updated successfully", "success");
        fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
      } else {
        Swal.fire("Error", "Failed to update status", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
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
          Swal.fire({ icon: "success", title: "Deleted!", text: `"${userName}" has been deleted.`, timer: 1500, showConfirmButton: false });
          fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
        } catch (error) {
          Swal.fire({ icon: "error", title: "Delete Failed", text: error?.response?.data?.message || "Something went wrong!" });
        }
      }
    });
  };

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      {/* Full Screen Status Loader */}
      {statusUpdateLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md" style={{ backdropFilter: "blur(2px)", background: "rgba(0,0,0,0.5)" }} />
          <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl border border-white border-opacity-50">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Updating Status</h3>
                <p className="text-sm text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        {/* ── Header ── */}
        <div className="bg-white rounded-t-lg shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Users</h1>

          {/* ✅ ADD USER BUTTON */}
          <button
            onClick={() => navigate("/users/add")}
            className="flex items-center gap-2 bg-[#529fb7] hover:bg-[#3d8aa3] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* ── Main Content ── */}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S&nbsp;NO.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE&nbsp;NO.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROFILE&nbsp;PIC.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? "No users found matching your search" : "No users found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.countryCode && user.phoneNumber ? `${user.countryCode}-${user.phoneNumber}` : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profilePicture ? (
                          <img
                            src={`${ApiEndPoint.baseUrl}${user.profilePicture}`}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">No Image</span>
                        )}
                      </td>

                      {/* ── Action Buttons ── */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/users_view/${user.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>

                        {/* ✅ EDIT BUTTON */}
                        <button
                          onClick={() => navigate(`/users/edit/${user.id}`)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
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
              Showing {totalRecords > 0 ? startIndex : 0} to {endIndex} of {totalRecords} entries
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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
                      className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === pageNumber ? "bg-[#529fb7] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === totalPages || totalPages === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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

export default UserList;