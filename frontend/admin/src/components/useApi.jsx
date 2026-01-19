import { useState } from "react";
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  // ✅ GET Request
  const getData = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}`, { 
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
       });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  const getDataByParams = async (endpoint,id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/${id}`, { 
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
       });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ POST Request
  const postData = async (endpoint, body, optional = false) => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Only set Content-Type if not using FormData
      if (!optional) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${endpoint}`, {
        method: "POST",
        headers,
        body: optional ? body : JSON.stringify(body),
      });

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const logOutData = async (endpoint) => {
    setLoading(true);
    setError(null);    
    try {
      const response = await fetch(`${endpoint}`, {
        method: "POST",
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ POST Request without token
  const postDataWithOutToken = async (endpoint, body) => {
    console.log("body", body);
    console.log("endpoint", endpoint);
    
    setLoading(true);
    setError(null);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json", // ✅ Fix: Tell the server it's JSON
            },
            body: JSON.stringify(body), // ✅ Convert body to JSON
        });

        const data = await response.json();
        setLoading(false);
        return data;
    } catch (err) {
        setError(err.message);
        setLoading(false);
    }
};


  // ✅ PUT Request
  const putData = async (endpoint, body,optional=false) => {
    setLoading(true);
    setError(null);
    try {
       const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Only set Content-Type if not using FormData
      if (!optional) {
        headers["Content-Type"] = "application/json";
      }
      const response = await fetch(`${endpoint}`, {
        method: "PUT",
        headers:headers,
        body: optional ? body : JSON.stringify(body),
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  const updateRecord = async (endpoint, body) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}`, {
        method: "PATCH",
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  // ✅ DELETE Request
  const deleteData = async (endpoint) => {
    setLoading(true);
    setError(null);
    console.log("endPoint",endpoint);
    
    
    try {
      await fetch(`${endpoint}`, {
        method: "DELETE", 
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
      
       });
      setLoading(false);
      return true; // Return success response
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return { getData,getDataByParams,updateRecord, postData,logOutData,postDataWithOutToken, putData, deleteData, loading, error };
};

export default useApi;
