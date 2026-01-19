// local system url
const API_BASE_URL = "http://localhost:4005";

// server base url
// const API_BASE_URL = "http://52.66.122.106:4005";
 
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
  updateUserDetails: `${API_BASE_URL}/api/updateUserDetails`,
  userStatusChange: `${API_BASE_URL}/api/userStatusChange`,

  deleteUser: `${API_BASE_URL}/api/deleteUser`,

  beginnerUsersList: `${API_BASE_URL}/api/beginnerUsersList`,
  beginnerUsersPositions: `${API_BASE_URL}/api/beginnerUsersPositions`,
  beginnerUserCreate: `${API_BASE_URL}/api/beginnerUserCreate`,
  beginnerUserUpdate: `${API_BASE_URL}/api/beginnerUserUpdate`,
  beginnerUserDetail: `${API_BASE_URL}/api/beginnerUserDetail`,

  advanceUsersList: `${API_BASE_URL}/api/advanceUsersList`,
  advanceUsersPositions: `${API_BASE_URL}/api/advanceUsersPositions`,
  advanceUserCreate: `${API_BASE_URL}/api/advanceUserCreate`,
  advanceUserUpdate: `${API_BASE_URL}/api/advanceUserUpdate`,
  advanceUserDetail: `${API_BASE_URL}/api/advanceUserDetail`,

  advancedUsersList: `${API_BASE_URL}/api/advancedUsersList`,
  viewUser: `${API_BASE_URL}/api/viewUser`,

  // Banners Endpoints
  bannerList: `${API_BASE_URL}/api/bannerList`,
  addBanner: `${API_BASE_URL}/api/addBanner`,
  deleteBanner:`${API_BASE_URL}/api/deleteBanner`,
  
}
 
export default ApiEndPoint;

