"use client";
import React, { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { Helmet } from 'react-helmet-async';
import LeaderboardSkeleton from "../components/LeaderboardSkeleton";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("keeper");
  const [copyStatus, setCopyStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState({
    keepers: [],
    developers: [],
    contributors: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    pointsSort: 'highToLow', // 'highToLow' or 'lowToHigh'
    tasksSort: 'highToLow', // 'highToLow' or 'lowToHigh'
    dateRange: 'all', // 'all', 'week', 'month', 'year'
  });
  const baseUrl = 'https://app.triggerx.network';


  //   // Update meta tags when activeTab changes
  //   document.title = 'TriggerX | Leaderboard';
  //   document.querySelector('meta[name="description"]').setAttribute('content', 'Automate Tasks Effortlessly');

  //   // Update Open Graph meta tags
  //   document.querySelector('meta[property="og:title"]').setAttribute('content', 'TriggerX | Leaderboard');
  //   document.querySelector('meta[property="og:description"]').setAttribute('content', 'Automate Tasks Effortlessly');
  //   document.querySelector('meta[property="og:image"]').setAttribute('content', `${baseUrl}/images/leaderboard-og.png`);
  //   document.querySelector('meta[property="og:url"]').setAttribute('content', `${baseUrl}/leaderboard`);

  //   // Update Twitter Card meta tags
  //   document.querySelector('meta[name="twitter:title"]').setAttribute('content', 'TriggerX | Leaderboard');
  //   document.querySelector('meta[name="twitter:description"]').setAttribute('content', 'Automate Tasks Effortlessly');
  //   document.querySelector('meta[name="twitter:image"]').setAttribute('content', `${baseUrl}/images/leaderboard-og.png`);
  // }, [activeTab, baseUrl]);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let apiUrl;
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

        if (activeTab === "keeper") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/keepers`;
        } else if (activeTab === "developer" || activeTab === "contributor") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/users`;
        }

        const response = await fetch(apiUrl);

        const data = await response.json();
        console.log("Raw API response:", data);

        // Transform the data to match the table structure
        if (activeTab === "keeper") {
          const transformedKeeperData = Array.isArray(data)
            ? data.map((keeper) => ({
              operator: keeper.keeper_name,
              address: keeper.keeper_address,
              performed: keeper.tasks_executed,
              attested: keeper.tasks_executed, // If you don't have a separate attested field
              points: keeper.keeper_points,
            }))
            : [];

          // Sort the keepers by points in descending order
          transformedKeeperData.sort((a, b) => b.points - a.points);

          setLeaderboardData((prev) => ({
            ...prev,
            keepers: transformedKeeperData,
          }));
        } else if (activeTab === "developer") {
          const transformedUserData = Array.isArray(data)
            ? data.map((user) => ({
              address: user.user_address,
              totalJobs: user.total_jobs,
              tasksExecuted: user.tasks_completed, // If you don't have a separate attested field
              points: user.user_points,
            }))
            : [];

          // Sort developers by points in descending order
          transformedUserData.sort((a, b) => b.points - a.points);

          setLeaderboardData((prev) => ({
            ...prev,
            developers: transformedUserData,
          }));
        } else {
          // Sort contributors by points in descending order if they exist
          const sortedContributors = Array.isArray(data)
            ? [...data].sort((a, b) => b.points - a.points)
            : [];

          setLeaderboardData((prev) => ({
            ...prev,
            contributors: sortedContributors,
          }));
        }
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]); // Re-fetch when activeTab changes

  const copyAddressToClipboard = async (address, id) => {
    await navigator.clipboard.writeText(address);

    setCopyStatus((prev) => ({ ...prev, [id]: true }));

    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Filter data based on search term and filters
  const getFilteredData = (dataList) => {
    let filtered = [...dataList];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (activeTab === "keeper") {
          return (
            (item.operator && item.operator.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        } else if (activeTab === "developer") {
          return item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    // Apply points sorting
    if (filters.pointsSort === 'highToLow') {
      filtered.sort((a, b) => b.points - a.points);
    } else {
      filtered.sort((a, b) => a.points - b.points);
    }

    // Apply tasks/jobs sorting
    if (filters.tasksSort === 'highToLow') {
      if (activeTab === "keeper") {
        filtered.sort((a, b) => b.performed - a.performed);
      } else if (activeTab === "developer") {
        filtered.sort((a, b) => b.tasksExecuted - a.tasksExecuted);
      }
    } else {
      if (activeTab === "keeper") {
        filtered.sort((a, b) => a.performed - b.performed);
      } else if (activeTab === "developer") {
        filtered.sort((a, b) => a.tasksExecuted - b.tasksExecuted);
      }
    }

    return filtered;
  };

  // Use filtered data for tables
  const filteredKeepers = getFilteredData(leaderboardData.keepers || []);
  const filteredDevelopers = getFilteredData(leaderboardData.developers || []);
  const filteredContributors = getFilteredData(leaderboardData.contributors || []);

  // Render keeper/operators table
  const renderKeeperTable = () => {
    return (
      <table className="w-full border-separate border-spacing-y-4 max-h-[650px] h-auto">
        <thead className="sticky top-0 bg-[#2A2A2A]">
          <tr>
            <th className="px-5 py-5 text-left text-[#FFFFFF] font-bold md:text-lg lg:text-lg xs:text-sm rounded-tl-lg rounded-bl-lg">
              Operator
            </th>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
              Address
            </th>
            <Tooltip title="Job Performed" color="#2A2A2A">
              <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
                Performed
              </th>
            </Tooltip>
            <Tooltip title="Job Attested" color="#2A2A2A">
              <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg">
                Attested
              </th>
            </Tooltip>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
              Points
            </th>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm rounded-tr-lg rounded-br-lg">
              Profile
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredKeepers.length > 0
            ? filteredKeepers.map((item, index) => (
              <tr key={index}>
                <td className="px-5 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] text-left border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg bg-[#1A1A1A]">
                  {item.operator}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">


                  {item.address ? `${item.address.substring(0, 8)}...${item.address.substring(item.address.length - 7)}` : ""}
                  <button
                    onClick={() =>
                      copyAddressToClipboard(item.address, item.id)
                    }
                    className="ml-2 p-1 hover:bg-[#252525] rounded-md transition-all"
                    title="Copy address"
                  >
                    {copyStatus[item.id] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#A2A2A2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#A2A2A2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    )}
                  </button>
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                  {item.performed}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                  {item.attested}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] border border-l-0 border-[#2A2A2A] border-r-0 ">
                  <span className="px-7 py-3 bg-[#F8FF7C] text-md border-none font-extrabold text-black md:text-[15px] xs:text-[12px] rounded-lg w-[200px]">
                    {Number(item.points).toFixed(5)}
                  </span>
                </td>
                <Tooltip title="View Profile" color="#2A2A2A">
                  <td className="bg-[#1A1A1A] px-6 py-5 space-x-2 text-white flex-row justify-between border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
                    <button
                      onClick={() =>
                        window.open(
                          `https://app.eigenlayer.xyz/operator/${item.address}`,
                          "_blank"
                        )
                      }
                      className="px-5 py-2 text-sm text-white underline decoration-2 decoration-white underline-offset-4"
                    >
                      View
                    </button>
                  </td>
                </Tooltip>
              </tr>
            ))
            : !isLoading && (
              <tr>
                <td colSpan="6" className="text-center text-[#A2A2A2] py-5">
                  No keeper data available
                </td>
              </tr>
            )}
        </tbody>
      </table>
    );
  };

  // Render developer table with different columns
  const renderDeveloperTable = () => {
    return (
      <table className="w-full border-separate border-spacing-y-4 max-h-[650px] h-auto">
        <thead className="sticky top-0 bg-[#2A2A2A]">
          <tr>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm rounded-tl-lg rounded-bl-lg">
              Address
            </th>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
              Total Jobs
            </th>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
              Task Performed
            </th>
            <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm rounded-tr-lg rounded-br-lg">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredDevelopers.length > 0
            ? filteredDevelopers.map((item, index) => (
              <tr key={index}>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg flex items-center">
                  <span className="truncate max-w-[180px] md:max-w-[220px] lg:max-w-[250px]">
                    {item.address ? `${item.address.substring(0, 5)}...${item.address.substring(item.address.length - 4)}` : ""}
                  </span>
                  <button
                    onClick={() =>
                      copyAddressToClipboard(item.address, item.id)
                    }
                    className="ml-2 p-1 hover:bg-[#252525] rounded-md transition-all"
                    title="Copy address"
                  >
                    {copyStatus[item.id] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#A2A2A2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#A2A2A2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    )}
                  </button>
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                  {item.totalJobs}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                  {item.tasksExecuted}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
                  <span className="px-7 py-3 bg-[#F8FF7C] text-md border-none text-[#C1BEFF] text-black md:text-md xs:text-[12px] rounded-lg">
                    {Number(item.points).toFixed(5)}
                  </span>
                </td>
              </tr>
            ))
            : !isLoading && (
              <tr>
                <td colSpan="4" className="text-center text-[#A2A2A2] py-5">
                  No developer data available
                </td>
              </tr>
            )}
        </tbody>
      </table>
    );
  };

  const renderContributorTable = () => {
    return (
      <table className="w-full border-separate border-spacing-y-4 max-h-[650px] h-auto">
        <thead className="sticky top-0 bg-[#2A2A2A]">
          <tr>
            <th className="px-6 py-5 text-center text-[#FFFFFF] font-bold md:text-lg xs:text-sm rounded-tl-lg rounded-bl-lg">
              Name
            </th>
            <th className="px-6 py-5 text-center text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
              Points
            </th>
            <th className="px-6 py-5 text-center text-[#FFFFFF] font-bold md:text-lg xs:text-sm rounded-tr-lg rounded-br-lg">
              Profile
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredContributors.length > 0
            ? filteredContributors.map((item, index) => (
              <tr key={index}>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg">
                  {item.name}
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] border border-l-0 border-[#2A2A2A] border-r-0">
                  <span className="px-7 py-3 bg-[#F8FF7C] text-md border-none text-[#C1BEFF] text-black md:text-md xs:text-[12px] rounded-lg">
                    {Number(item.points).toFixed(5)}
                  </span>
                </td>
                <td className="bg-[#1A1A1A] px-6 py-5 space-x-2 text-white border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
                  <button className="px-5 py-2 border-[#C07AF6] rounded-full text-sm text-white border">
                    View
                  </button>
                </td>
              </tr>
            ))
            : !isLoading && (
              <tr>
                <td colSpan="3" className="text-center text-[#A2A2A2] py-5">
                  No contributor data available
                </td>
              </tr>
            )}
        </tbody>
      </table>
    );
  };

  // Render filter dropdown
  const renderFilterDropdown = () => {
    if (!showFilters) return null;

    return (
      <div 
        className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg z-50 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[#A2A2A2] mb-2 text-start">Sort by Points</label>
            <select
              value={filters.pointsSort}
              onChange={(e) => setFilters(prev => ({ ...prev, pointsSort: e.target.value }))}
              className="w-full bg-[#2A2A2A] text-[#EDEDED] rounded-lg px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="highToLow">High to Low</option>
              <option value="lowToHigh">Low to High</option>
            </select>
          </div>

          {(activeTab === "keeper" || activeTab === "developer") && (
            <div>
              <label className="block text-[#A2A2A2] mb-2 text-start">Sort by Tasks/Jobs</label>
              <select
                value={filters.tasksSort}
                onChange={(e) => setFilters(prev => ({ ...prev, tasksSort: e.target.value }))}
                className="w-full bg-[#2A2A2A] text-[#EDEDED] rounded-lg px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="highToLow">High to Low</option>
                <option value="lowToHigh">Low to High</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[#A2A2A2] mb-2 text-start">Time Period</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full bg-[#2A2A2A] text-[#EDEDED] rounded-lg px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(false);
            }}
            className="w-full bg-[#C07AF6] hover:bg-[#a46be0] text-white rounded-lg px-4 py-2 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    );
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.filter-dropdown')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  return (
    <>
      <Helmet>
        <title>TriggerX | Leaderboard</title>
        <meta name="description" content="View real-time rankings and performance metrics for TriggerX operators, developers, and contributors" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`TriggerX | ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Leaderboard`} />
        <meta property="og:description" content="View real-time rankings and performance metrics for TriggerX operators, developers, and contributors" />
        <meta property="og:image" content={`${baseUrl}/images/${activeTab}-og.png`} />
        <meta property="og:url" content={`${baseUrl}/leaderboard`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`TriggerX | ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Leaderboard`} />
        <meta name="twitter:description" content="View real-time rankings and performance metrics for TriggerX operators, developers, and contributors" />
        <meta name="twitter:image" content={`${baseUrl}/images/${activeTab}-og.png`} />
      </Helmet>
      <div className="min-h-screen md:mt-[20rem] mt-[10rem]">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center">
          Leaderboard
        </h1>
        <div className="flex justify-between  w-[85%] max-w-[1600px]  mx-auto items-end">
          <div className=" mt-8 ">
            <h2 className="text-2xl font-semibold text-[#C07AF6] mb-2">Points & Fair Use</h2>
            <ul className="list-disc pl-6 text-[#EDEDED] mb-2">
              <li>Operator and developer points are tracked separately and do not affect each other's rewards.</li>
              <li>Each wallet has a maximum point cap to ensure fair participation and prevent scripted job farming.</li>
            </ul>
            <p className="text-[#A2A2A2] text-sm mt-2">The system is designed to reward genuine contributions.</p>
          </div>
          <div className="flex justify-center items-end  mb-8 ">
          <div className="flex items-center  max-w-xl ">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-[#181818] text-[#EDEDED] border border-[#A2A2A2]  placeholder-[#A2A2A2] rounded-l-full px-6 py-3 focus:outline-none  text-lg shadow-none"
            />
            <button className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors  w-14 h-14 flex items-center justify-center -ml-5 z-10 border border-[#A2A2A2] rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="ml-4 w-14 h-14 rounded-full border border-[#A2A2A2] flex items-center justify-center bg-transparent hover:bg-[#232323] transition-colors relative filter-dropdown"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="10" x2="4" y2="3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="8" x2="12" y2="3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="21" x2="20" y2="16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="12" x2="20" y2="3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="4" cy="12" r="2" fill="#C07AF6" />
                <circle cx="12" cy="10" r="2" fill="#C07AF6" />
                <circle cx="20" cy="14" r="2" fill="#C07AF6" />
              </svg>
              {renderFilterDropdown()}
            </button>
          </div>
        </div>
        </div>
       
        <div className="max-w-[1600px] w-[85%] mx-auto flex justify-between items-center my-10 bg-[#181818F0] p-2 rounded-lg">
          <button
            className={`w-[33%] text-[#FFFFFF] font-bold md:text-lg xs:text-sm p-4 rounded-lg ${activeTab === "keeper"
              ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
              : "bg-transparent"
              }`}
            onClick={() => setActiveTab("keeper")}
          >
            Keeper
          </button>
          <button
            className={`w-[33%] text-[#FFFFFF] font-bold md:text-lg xs:text-sm p-4 rounded-lg ${activeTab === "developer"
              ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
              : "bg-transparent"
              }`}
            onClick={() => setActiveTab("developer")}
          >
            Developer
          </button>
          <button
            className={`w-[33%] text-[#FFFFFF] font-bold md:text-lg xs:text-sm p-4 rounded-lg ${activeTab === "contributor"
              ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
              : "bg-transparent"
              }`}
            onClick={() => setActiveTab("contributor")}
          >
            Contributor
          </button>
        </div>
        <div className="overflow-x-auto">
          <div
            className="max-w-[1600px] mx-auto w-[85%] bg-[#141414] px-5 rounded-lg"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Only render the table when not loading */}
            {!isLoading && (
              <div className={filteredKeepers.length > 0 || filteredDevelopers.length > 0 || filteredContributors.length > 0 ? "h-[650px] overflow-y-auto" : "h-auto"}>
                {activeTab === "keeper"
                  ? renderKeeperTable()
                  : activeTab === "developer"
                    ? renderDeveloperTable()
                    : renderContributorTable()}
              </div>
            )}

            {/* Display loading or error states */}
            {isLoading && <LeaderboardSkeleton activeTab={activeTab} />}

            {error && !isLoading && (
              <div className="flex justify-center h-[500px] items-center">
                <div className="text-center text-red-500">Error: {error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
