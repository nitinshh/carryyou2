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
  FileDown,
} from "lucide-react";
import useApi from "../../components/useApi";
import ApiEndPoint from "../../components/ApiEndPoint";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function DriverList() {
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
  const [pdfLoading, setPdfLoading] = useState(false);
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
        const response = await getData(`${ApiEndPoint.getAllDriver}?${queryParams.toString()}`);
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
    if (debouncedSearchQuery !== initialState.search && currentPage !== 1) setCurrentPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (entriesPerPage !== initialState.limit && currentPage !== 1) setCurrentPage(1);
  }, [entriesPerPage]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleEntriesChange = (e) => { setEntriesPerPage(parseInt(e.target.value)); setCurrentPage(1); };

  const handleApprovalChange = async (userId, userName, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
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
          const response = await putData(ApiEndPoint.approveRejectDriver, { userId, adminApprovalStatus: newStatus }, false);
          if (response.code === 200) {
            Swal.fire({ icon: "success", title: "Success!", text: `Status changed to ${getStatusText(newStatus)}`, timer: 1500, showConfirmButton: false });
            fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
          } else {
            Swal.fire("Error", "Failed to update status", "error");
          }
        } catch (error) {
          Swal.fire("Error", "Something went wrong!", "error");
        } finally {
          setApprovalLoading(false);
        }
      } else {
        fetchUsers(currentPage, entriesPerPage, debouncedSearchQuery);
      }
    });
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

  // ✅ Helper: load image as base64
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  };

  // ✅ Helper: safely load image or return null
  const safeLoadImage = async (path) => {
    if (!path) return null;
    try {
      return await loadImageAsBase64(`${ApiEndPoint.baseUrl}${path}`);
    } catch {
      return null;
    }
  };

  // ✅ Single handleDownloadPDF — complete version
  const handleDownloadPDF = async (userId) => {
    try {
      setPdfLoading(true);

      const response = await getData(`${ApiEndPoint.userDetail}/${userId}`);
      const driver = response?.data || response?.body || {};

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(82, 159, 183);
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Driver Information", pageWidth / 2, 17, { align: "center" });

      // Profile Picture
      let yPos = 36;
      const profileImg = await safeLoadImage(driver.profilePicture);
      if (profileImg) {
        doc.addImage(profileImg, "JPEG", pageWidth / 2 - 15, yPos, 30, 30);
        yPos += 36;
      }

      // Section Title
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Personal & Vehicle Details", 14, yPos + 4);
      yPos += 6;

      // Main Info Table
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Field", "Details"]],
        body: [
          ["Full Name",                driver.fullName || "N/A"],
          ["Email",                    driver.email || "N/A"],
          ["Phone Number",             driver.countryCode && driver.phoneNumber ? `${driver.countryCode} ${driver.phoneNumber}` : "N/A"],
          ["Date Of Birth",            driver.dob ? new Date(driver.dob).toLocaleDateString() : "N/A"],
          ["Nationality",              driver.nationality || "N/A"],
          ["License Number",           driver.driversLicenseNumber || "N/A"],
          ["Licence Type",             driver.licenceType || "N/A"],
          ["Registration Expiry Date", driver.registrationExpiryDate ? new Date(driver.registrationExpiryDate).toLocaleDateString() : "N/A"],
          ["Insurance Expiry Date",    driver.insuranceExpiryDate ? new Date(driver.insuranceExpiryDate).toLocaleDateString() : "N/A"],
          ["Vehicle Number",           driver.vehicleNumber || "N/A"],
          ["Admin Approval",           driver.adminApprovalStatus === 1 ? "Approved" : driver.adminApprovalStatus === 2 ? "Rejected" : "Pending"],
        ],
        headStyles: { fillColor: [82, 159, 183], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 250, 252] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Load all document images in parallel
      const imageFields = [
        { label: "Licence Front Image",        path: driver.licenceFrontImage },
        { label: "Licence Back Image",         path: driver.licenceBackImage },
        { label: "Picture Of Vehicle",         path: driver.pictureOfVehicle },
        { label: "Vehicle Registration Image", path: driver.vehicleRegistrationImage },
        { label: "Insurance Policy Image",     path: driver.insurancePolicyImage },
      ];

      const loadedImages = await Promise.all(
        imageFields.map(async (item) => ({
          label: item.label,
          base64: await safeLoadImage(item.path),
        }))
      );

      const validImages = loadedImages.filter((img) => img.base64 !== null);

      if (validImages.length > 0) {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Documents & Images", 14, yPos);
        yPos += 8;

        const imgW = 80;
        const imgH = 55;
        const colGap = 10;
        const marginLeft = 14;
        const cols = 2;

        for (let i = 0; i < validImages.length; i++) {
          const col = i % cols;
          const xPos = marginLeft + col * (imgW + colGap);

          if (col === 0 && i !== 0) yPos += imgH + 18;
          if (yPos + imgH + 18 > pageHeight - 15) { doc.addPage(); yPos = 20; }

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(82, 159, 183);
          doc.text(validImages[i].label, xPos, yPos);

          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.4);
          doc.rect(xPos, yPos + 2, imgW, imgH);
          doc.addImage(validImages[i].base64, "JPEG", xPos, yPos + 2, imgW, imgH);
        }

        yPos += imgH + 18;
      } else {
        if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text("No document images available.", 14, yPos);
      }

      // Footer on every page
      const totalPagesCount = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPagesCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleString()}   |   Page ${p} of ${totalPagesCount}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: "center" }
        );
      }

      doc.save(`driver_${driver.fullName?.replace(/\s+/g, "_") || userId}.pdf`);

    } catch (error) {
      console.error("PDF generation error:", error);
      Swal.fire({ icon: "error", title: "PDF Failed", text: "Could not generate PDF. Please try again." });
    } finally {
      setPdfLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <div className="min-h-screen">
      {(statusUpdateLoading || approvalLoading || pdfLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md" style={{ backdropFilter: "blur(2px)", background: "rgba(0,0,0,0.5)" }} />
          <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl border border-white border-opacity-50">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {pdfLoading ? "Generating PDF..." : "Updating Status"}
                </h3>
                <p className="text-sm text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-t-lg shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Drivers</h1>
          <button
            onClick={() => navigate("/driver/add")}
            className="flex items-center gap-2 bg-[#529fb7] hover:bg-[#3d8aa3] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <UserPlus size={16} />
            Add Driver
          </button>
        </div>

        <div className="bg-white rounded-b-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-gray-600 mr-2">Show</span>
              <select value={entriesPerPage} onChange={handleEntriesChange} className="border border-gray-300 rounded px-2 py-1 text-sm w-16">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S&nbsp;NO.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE&nbsp;NO.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROFILE&nbsp;PIC.</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ADMIN&nbsp;APPROVAL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Loading...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? "No driver found matching your search" : "No driver found"}
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
                          <img src={`${ApiEndPoint.baseUrl}${user.profilePicture}`} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm text-gray-500">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <select
                            value={user.adminApprovalStatus}
                            onChange={(e) => handleApprovalChange(user.id, user.fullName, user.adminApprovalStatus, parseInt(e.target.value))}
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
                        <button onClick={() => navigate(`/driver_view/${user.id}`)} className="text-blue-600 hover:text-blue-800" title="View">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => navigate(`/driver/edit/${user.id}`)} className="text-green-600 hover:text-green-800" title="Edit">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDownloadPDF(user.id)} className="text-purple-600 hover:text-purple-800" title="Download PDF" disabled={pdfLoading}>
                          <FileDown size={18} />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.fullName)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {totalRecords > 0 ? startIndex : 0} to {endIndex} of {totalRecords} entries
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={prevPage} disabled={currentPage === 1}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <ChevronLeft size={16} />
              </button>
              {totalPages > 0 && [...Array(Math.min(totalPages, 10)).keys()].map((number) => {
                let pageNumber;
                if (totalPages <= 10) {
                  pageNumber = number + 1;
                } else {
                  const startPage = Math.max(1, currentPage - 5);
                  pageNumber = startPage + number;
                  if (pageNumber > totalPages) return null;
                }
                return (
                  <button key={pageNumber} onClick={() => paginate(pageNumber)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === pageNumber ? "bg-[#529fb7] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {pageNumber}
                  </button>
                );
              })}
              <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${currentPage === totalPages || totalPages === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
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