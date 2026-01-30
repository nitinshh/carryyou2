import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  ChevronDown,
  Car,
  CarFront,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useApi from "../components/useApi";
import ApiEndPoint from "../components/ApiEndPoint";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedEarningsMonth, setSelectedEarningsMonth] = useState(
    new Date().getMonth()
  );
  const [selectedEarningsYear, setSelectedEarningsYear] = useState(
    new Date().getFullYear()
  );
  const [statsData, setStatsData] = useState({
    userCount: 0,
    driverCount:0,
    recentUser: null,
    recentUserUpdateProfile: null,
    monthData: [],
  });
  const [loading, setLoading] = useState(true);
  const { getData } = useApi();
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
  const [earningsMonthDropdownVisible, setEarningsMonthDropdownVisible] =
    useState(false);
  const [earningsYearDropdownVisible, setEarningsYearDropdownVisible] =
    useState(false);
  const dropdownYearRef = useRef(null);
  const earningsMonthRef = useRef(null);
  const earningsYearRef = useRef(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Convert month name to index
  const getMonthIndex = (monthName) => {
    const monthMap = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    return monthMap[monthName] || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getData(ApiEndPoint.DASHBOARD_DATA);
        console.log("API Response:", response);

        // Directly use response.body since API returns data in body
        if (response && response.body) {
          setStatsData({
            userCount: response.body.userCount || 0,
            driverCount:response.body.driverCount ||0,
            recentUser: response.body.recentUser || null,
            recentUserUpdateProfile:
              response.body.recentUserUpdateProfile || null,
            monthData: response.body.monthData || [],
            typeOfVechile:response.body.typeOfVechicle||0
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    function handleClickOutside(event) {
      if (
        dropdownYearRef.current &&
        !dropdownYearRef.current.contains(event.target)
      ) {
        setYearDropdownVisible(false);
      }
      if (
        earningsMonthRef.current &&
        !earningsMonthRef.current.contains(event.target)
      ) {
        setEarningsMonthDropdownVisible(false);
      }
      if (
        earningsYearRef.current &&
        !earningsYearRef.current.contains(event.target)
      ) {
        setEarningsYearDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const stats = [
    {
      id: 1,
      title: "Users",
      count: statsData.userCount,
      icon: <Users size={20} />,
      path: "/users_listing",
    },
    {
      id: 2,
      title: "Driver",
      count: statsData.driverCount,
      icon: <Car size={20} />,
      path: "/driver_listing",
    },
    {
      id: 3,
      title: "Type Of Vechile",
      count: statsData.typeOfVechile,
      icon: <CarFront size={20} />,
      path: "/typeOfVechile_listing",
    }, 
  ];

  const recentActivities = [
    {
      id: 1,
      action: "New user registered",
      user: statsData.recentUser?.fullName || "N/A",
      time: statsData.recentUser?.createdAt
        ? formatDistanceToNow(new Date(statsData.recentUser.createdAt), {
            addSuffix: true,
          })
        : "N/A",
      path: "/users_listing",
    },
    {
      id: 2,
      action: "User profile updated",
      user: statsData.recentUserUpdateProfile?.fullName || "N/A",
      time: statsData.recentUserUpdateProfile?.updatedAt
        ? formatDistanceToNow(
            new Date(statsData.recentUserUpdateProfile.updatedAt),
            { addSuffix: true }
          )
        : "N/A",
      path: "/users_listing",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="flex items-center p-4 bg-white rounded-2xl shadow-md cursor-pointer hover:bg-gray-50 transition"
            onClick={() => navigate(stat.path)}
          >
            <div
              className="p-3 rounded-full text-white"
              style={{
                background:
                  "linear-gradient(90deg, #0B1D3A 0%, #102A56 50%, #1E3A8A 100%)",
              }}
            >
              {stat.icon}
            </div>

            <div className="ml-4">
              <h3 className="text-lg font-bold">{stat.count}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Users Growth</h3>
            <div className="relative" ref={dropdownYearRef}>
              <button
                className="flex items-center gap-1 text-sm text-gray-700"
                onClick={() => setYearDropdownVisible(!yearDropdownVisible)}
              >
                {selectedYear} <ChevronDown size={16} />
              </button>

              {yearDropdownVisible && (
                <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
                  {["2025"].map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setYearDropdownVisible(false);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-72">
            {statsData.monthData && statsData.monthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsData.monthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    ticks={(() => {
                      const max = Math.max(
                        ...statsData.monthData.map((d) => d.users),
                        0
                      );
                      const result = [];
                      for (let i = 0; i <= max + 5; i += 5) result.push(i);
                      return result;
                    })()}
                  />

                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3c8f89"
                    activeDot={{ r: 6 }}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                onClick={() => navigate(activity.path)}
              >
                <div className="w-2.5 h-2.5 bg-[#3c8f89] rounded-full mt-1 mr-3 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <div className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
