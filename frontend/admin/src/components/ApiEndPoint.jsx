// local system url
// const API_BASE_URL = "http://localhost:4005";

// server base url
const API_BASE_URL = "http://52.66.122.106:4005";
 
const ApiEndPoint = {
  baseUrl:`${API_BASE_URL}`,
  LOGIN: `${API_BASE_URL}/api/login`,
  LOGOUT: `${API_BASE_URL}/api/logOut`,
  USER_LIST:`${API_BASE_URL}/api/userList`,
  userDetail:`${API_BASE_URL}/api/userDetail`,
  updateProfile:`${API_BASE_URL}/api/updateProfile`,
  changePassword:`${API_BASE_URL}/api/changePassword`,
  DASHBOARD_DATA:`${API_BASE_URL}/api/dashboard`,
  getAllUser:`${API_BASE_URL}/api/allUser`,
  getAllDriver:`${API_BASE_URL}/api/allDriver`,
  approveRejectDriver:`${API_BASE_URL}/api/approveRejectDriver`,

  updateUserDetails: `${API_BASE_URL}/api/updateUserDetails`,
  userStatusChange: `${API_BASE_URL}/api/userStatusChange`,

  deleteUser: `${API_BASE_URL}/api/deleteUser`,

  addTypeOfVechile: `${API_BASE_URL}/api/addTypeOfVechile`,
  getTypeOfVechleList: `${API_BASE_URL}/api/getTypeOfVechleList`,
  updateTypeOfVechile: `${API_BASE_URL}/api/updateTypeOfVechile`,
  deleteTypeOfVechile: `${API_BASE_URL}/api/deleteTypeOfVechile`,

  // Banners Endpoints
  bannerList: `${API_BASE_URL}/api/bannerList`,
  addBanner: `${API_BASE_URL}/api/addBanner`,
  deleteBanner:`${API_BASE_URL}/api/deleteBanner`,

  cms:`${API_BASE_URL}/api/cms`,
  cmsUpdate:`${API_BASE_URL}/api/cmsUpdate`,
  contactUsList:`${API_BASE_URL}/api/contactUsList`,
  contactUsDelete:`${API_BASE_URL}/api/contactUsDelete`,
  contactUsView:`${API_BASE_URL}/api/contactUsDetail`,
}
 
export default ApiEndPoint;

