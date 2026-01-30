import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function TypeOfVechileList() {
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
  const [typeOfVechile, setTypeOfVechile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState(initialState.limit);
  const [currentPage, setCurrentPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialState.search);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    initialState.search
  );

  const { getData, deleteData } = useApi();

  const updateURL = useCallback((page, limit, search) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (search?.trim()) params.set("search", search.trim());

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
  }, []);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch FAQ
  const fetchFaq = useCallback(
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
          `${ApiEndPoint.getTypeOfVechleList}?${queryParams.toString()}`
        );
        console.log("response",response)
        if (response.body) {
          setTypeOfVechile(response.body.rows || []);
          setTotalRecords(response.body.count || 0);
          setTotalPages(Math.ceil((response.body.count || 0) / limit));
        }
      } catch (error) {
        console.error("Error fetching Language:", error);
        setTypeOfVechile([]);
        setTotalRecords(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [getData, updateURL]
  );

  useEffect(() => {
    fetchFaq(currentPage, entriesPerPage, debouncedSearchQuery);
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const paginate = (page) => setCurrentPage(page);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleDeleteFaq = async (id, title) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete!",
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await deleteData(`${ApiEndPoint.deleteTypeOfVechile}/${id}`);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchFaq(currentPage, entriesPerPage, debouncedSearchQuery);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: error?.response?.data?.message || "Something went wrong!",
          });
        }
      }
    });
  };

  const handleAddTypeOfVechile = () => navigate("/typeOfVechile_add");

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mt-0">
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
                  placeholder="Search SKill..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={handleAddTypeOfVechile}
                className="text-white px-4 py-2 rounded-md flex items-center transition-all duration-300 hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
                }}
              >
                <Plus size={18} className="mr-1" />
                Add Type Of Vechile
              </button>
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
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRICE PER MILE
                  </th> 
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IMAGE
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
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : typeOfVechile.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No data found matching your search"
                        : "No data found"}
                    </td>
                  </tr>
                ) : (
                  typeOfVechile.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {startIndex + index}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.price || "N/A"}
                      </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                        {/* {item.name || "N/A"} */}
                           {item.image ? (
                          <img
                            src={`${ApiEndPoint.baseUrl}${item.image}`}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            No Image
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-3">
                        {/* <button
                          onClick={() => navigate(`/skills_View/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button> */}

                        <button
                          onClick={() => navigate(`/typeOfVechile_edit/${item.id}`)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteFaq(item.id, item.name)
                          }
                          className="text-red-600 hover:text-red-800"
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
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(Math.min(totalPages, 10)).keys()].map((i) => {
                let page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      currentPage === page
                        ? "bg-[#529fb7] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400"
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

export default TypeOfVechileList;
