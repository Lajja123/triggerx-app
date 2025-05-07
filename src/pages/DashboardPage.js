import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { useStakeRegistry } from "./CreateJobPage/hooks/useStakeRegistry";
import WalletModal from "../components/WalletModal";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { Tooltip } from "antd";
import { useBalance, useAccount } from "wagmi";
import loader from "../assets/load.gif";

function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [jobDetails, setJobDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [connected, setConnected] = useState(false);
  const logoRef = useRef(null);
  const modelRef = useRef(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [tgBalance, setTgBalance] = useState(0);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isWalletInstalled, setIsWalletInstalled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isStaking, setIsStaking] = useState(false);
  const { address } = useAccount();
  const { data: accountBalance } = useBalance({
    address: address,
  });
  const data = new Array(15).fill({
    id: 1,
    type: "Condition-based",
    status: "Active",
  }); // Example data with more than 7 rows

  const toggleJobExpand = (jobId) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const outsideClick = (e) => {
    if (modelRef.current && !modelRef.current.contains(e.target)) {
      setStakeModalVisible(false);
      setStakeAmount("");
    }
  };

  const baseUrl = "https://app.triggerx.network";

  useEffect(() => {
    // Update meta tags when activeTab changes
    document.title = "TriggerX | Dashboard";
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");

    // Update Open Graph meta tags
    document
      .querySelector('meta[property="og:title"]')
      .setAttribute("content", "TriggerX | Dashboard");
    document
      .querySelector('meta[property="og:description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");
    document
      .querySelector('meta[property="og:image"]')
      .setAttribute("content", `${baseUrl}/images/dashboard-og.png`);
    document
      .querySelector('meta[property="og:url"]')
      .setAttribute("content", `${baseUrl}/leaderboard`);

    // Update Twitter Card meta tags
    document
      .querySelector('meta[name="twitter:title"]')
      .setAttribute("content", "TriggerX | Dashboard");
    document
      .querySelector('meta[name="twitter:description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");
    document
      .querySelector('meta[name="twitter:image"]')
      .setAttribute("content", `${baseUrl}/images/dashboard-og.png`);
  }, [baseUrl]);

  useEffect(() => {
    const initializeProvider = async () => {
      // console.log("Initializing provider...");
      if (typeof window.ethereum !== "undefined") {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        // console.log(ethProvider);
        setProvider(ethProvider);
        setIsWalletInstalled(true);
      } else {
        setIsWalletInstalled(false);
        setShowModal(true);
      }
    };

    initializeProvider();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", initializeProvider);
      window.ethereum.on("chainChanged", initializeProvider);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", initializeProvider);
        window.ethereum.removeListener("chainChanged", initializeProvider);
      }
    };
  }, []);

  useEffect(() => {
    if (provider) {
      fetchJobDetails();
    }
  }, [provider]);

  useEffect(() => {
    const logo = logoRef.current;
    if (logo) {
      logo.style.transform = "rotateY(0deg)";
      logo.style.transition = "transform 1s ease-in-out";

      const rotateLogo = () => {
        logo.style.transform = "rotateY(360deg)";
        setTimeout(() => {
          logo.style.transform = "rotateY(0deg)";
        }, 1000);
      };

      const interval = setInterval(rotateLogo, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    fetchTGBalance();
  });

  const getJobCreatorContract = async () => {
    if (!provider) {
      throw new Error("Web3 provider not initialized");
    }
    const signer = await provider.getSigner();
    const jobCreatorContractAddress =
      "0x98a170b9b24aD4f42B6B3630A54517fd7Ff3Ac6d";
    const jobCreatorABI = [
      // Contract ABI...
    ];
    return new ethers.Contract(
      jobCreatorContractAddress,
      jobCreatorABI,
      signer
    );
  };

  const fetchJobDetails = async () => {
    if (!provider) {
      return;
    }

    try {
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // console.log(userAddress, "address");

      // Fetch job details from the ScyllaDB API
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

      const response = await fetch(
        `${API_BASE_URL}/api/jobs/user/${userAddress}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch job details from the database");
      }

      const jobsData = await response.json();
      console.log("Fetched jobs data:", jobsData);

      // First, create a lookup for quick access by job_id
      const jobMap = {};
      jobsData.forEach((job) => {
        jobMap[job.job_id] = job;
      });

      // Build the linkedJobsMap
      const linkedJobsMap = {};
      jobsData.forEach((job) => {
        // Only process main jobs (chain_status === 0)
        if (job.chain_status === 0) {
          let mainJobId = job.job_id;
          let linkedJobs = [];
          // Start the chain from the main job's link_job_id
          let nextJobId = job.link_job_id;

          // Follow the chain until link_job_id is -1
          while (nextJobId !== -1) {
            const nextJob = jobMap[nextJobId];
            if (!nextJob) break; // in case of missing data
            linkedJobs.push(nextJob);
            nextJobId = nextJob.link_job_id;
          }

          linkedJobsMap[mainJobId] = linkedJobs;
        }
      });

      // Now create your tempJobs array by filtering main jobs and adding their linked jobs
      const tempJobs = jobsData
        .filter(
          (jobDetail) => jobDetail.chain_status === 0 && !jobDetail.status
        ) // Only main jobs with status === false
        .map((jobDetail) => ({
          id: jobDetail.job_id,
          type: mapJobType(jobDetail.job_type),
          status: "Active", // Only including jobs where status is false
          linkedJobs: linkedJobsMap[jobDetail.job_id] || [],
        }));

      // console.log(tempJobs);

      // console.log("All formatted jobs:", tempJobs);
      setJobDetails(tempJobs);
      if (tempJobs.length === 0 && connected && !loading) {
        toast("No jobs found. Create a new job to get started!", {
          icon: "ℹ️",
        });
      }
    } catch (error) {
      if (connected && error.message !== "Failed to fetch") {
        // Only show error toast for actual server errors, not for no jobs
        toast.error("Failed to fetch jobs. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map job type ID to label
  const mapJobType = (jobTypeId) => {
    // Convert jobTypeId to string to handle both string and number types
    const typeId = String(jobTypeId);

    switch (typeId) {
      case "1":
        return "Time-based";
      case "2":
        return "Time-based";
      case "3":
        return "Event-based";
      case "4":
        return "Event-based";
      case "5":
        return "Condition-based";
      case "6":
        return "Condition-based";
      default:
        return "Unknown";
    }
  };

  // useEffect to fetch job details on component mount
  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        fetchJobDetails();
        setConnected(true);
      } else {
        setConnected(false);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [provider]); // Add provider to dependency array

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) {
        toast.error("Please install MetaMask to use this application!");
        setConnected(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length === 0) {
          // Clear any existing toasts before showing connection message
          toast.dismiss();
          toast.error("Please connect your wallet to continue!");
        }
        setConnected(accounts.length > 0);
      } catch (error) {
        toast.error("Failed to check wallet connection!");
        setConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleUpdateJob = (id) => {
    setJobs(
      jobs.map((job) =>
        job.id === id
          ? { ...job, status: job.status === "Active" ? "Paused" : "Active" }
          : job
      )
    );
  };

  const handleDeleteJob = async (jobId) => {
    try {
      // Delete the job from the database
      // console.log("delete job");

      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/api/jobs/delete/${jobId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job from the database");
      }

      toast.success("Job deleted successfully");

      // Fetch the updated job details
      await fetchJobDetails();
    } catch (error) {
      // console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedJob(null);
  };

  const handleJobEdit = async (e) => {
    e.preventDefault();

    try {
      const jobCreatorContract = await getJobCreatorContract();

      const timeframeInSeconds =
        selectedJob.timeframe.years * 31536000 +
        selectedJob.timeframe.months * 2592000 +
        selectedJob.timeframe.days * 86400;

      const intervalInSeconds =
        selectedJob.timeInterval.hours * 3600 +
        selectedJob.timeInterval.minutes * 60 +
        selectedJob.timeInterval.seconds;

      const argType =
        selectedJob.argType === "None"
          ? 0
          : selectedJob.argType === "Static"
            ? 1
            : selectedJob.argType === "Dynamic"
              ? 2
              : 0;

      const result = await jobCreatorContract.updateJob(
        selectedJob.id,
        selectedJob.type,
        timeframeInSeconds,
        selectedJob.contractAddress,
        selectedJob.targetFunction,
        intervalInSeconds,
        argType,
        [],
        selectedJob.apiEndpoint
      );

      // console.log("Job updated successfully:", result);
      toast.success("Job updated successfully");

      // Refresh job details after update
      await fetchJobDetails();
      handleCloseModal();
    } catch (error) {
      // console.error("Error updating job:", error);
      toast.error("Error updating job");
    }
  };

  const handleChangeJobField = (field, value) => {
    setSelectedJob({ ...selectedJob, [field]: value });
  };

  const handleChangeTimeframe = (subfield, value) => {
    setSelectedJob({
      ...selectedJob,
      timeframe: { ...selectedJob.timeframe, [subfield]: parseInt(value) || 0 },
    });
  };

  const handleChangeTimeInterval = (subfield, value) => {
    setSelectedJob({
      ...selectedJob,
      timeInterval: {
        ...selectedJob.timeInterval,
        [subfield]: parseInt(value) || 0,
      },
    });
  };

  const { stakeRegistryAddress, stakeRegistryImplAddress, stakeRegistryABI } =
    useStakeRegistry();

  const fetchTGBalance = async () => {
    if (!provider || !isWalletInstalled) {
      return;
    }

    try {
      // const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const stakeRegistryContract = new ethers.Contract(
        stakeRegistryAddress,
        ["function getStake(address) view returns (uint256, uint256)"], // Assuming getStake returns (TG balance, other value)
        provider
      );

      const [_, tgBalance] = await stakeRegistryContract.getStake(userAddress);
      // console.log("Raw TG Balance:", tgBalance.toString());
      setTgBalance(ethers.formatEther(tgBalance));
    } catch (error) {
      // console.error("Error fetching TG balance:", error);
    }
  };

  useEffect(() => {
    if (connected && provider) {
      fetchJobDetails();
      fetchTGBalance();
    }
  }, [connected, provider]);

  const handleStake = async (e) => {
    e.preventDefault();
    try {
      setIsStaking(true);
      if (!isWalletInstalled) {
        throw new Error("Web3 wallet is not installed.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(
        stakeRegistryAddress,
        ["function stake(uint256 amount) external payable returns (uint256)"],
        signer
      );
      // console.log("Stake contract:", stakingContract);

      const stakeAmountInWei = ethers.parseEther(stakeAmount.toString());
      // console.log("Stake Amount in Wei:", stakeAmountInWei.toString());

      if (stakeAmountInWei === 0n) {
        // ✅ Correct way to check if BigInt is zero
        throw new Error("Stake amount must be greater than zero.");
      }

      const tx = await stakingContract.stake(
        ethers.parseEther(stakeAmount.toString()),
        { value: ethers.parseEther(stakeAmount.toString()) }
      );
      await tx.wait();

      toast.success("Staking successful!");
      fetchTGBalance();
      setStakeModalVisible(false);
      setStakeAmount("");
    } catch (error) {
      // console.error("Error staking:", error);
      toast.error("Staking failed ");
      setStakeModalVisible(false);
      setStakeAmount("");
    } finally {
      setIsStaking(false);
    }
  };

  useEffect(() => {
    // Check if MetaMask or any web3 wallet is installed
    if (typeof window.ethereum === "undefined") {
      setIsWalletInstalled(false);
      setShowModal(true);
    }
  }, []);

  const formatBalance = (balance) => {
    if (!balance) return "0";
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(4) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(4) + "K";
    }
    return num.toFixed(4);
  };

  return (
    <div>
     
      <div className="min-h-screen  text-white md:mt-[20rem] mt-[10rem]">
        <div className="fixed inset-0  pointer-events-none" />
        <div className="fixed  pointer-events-none" />

        <div className=" mx-auto px-6 py-8 lg:my-30 md:my-30 my-20 sm:my-20 ">
          <div className="flex max-w-[1600px] mx-auto justify-evenly gap-5 lg:flex-row flex-col ">
            <div className="lg:w-[70%] w-full">
              {loading ? (
                <DashboardSkeleton />
              ) : (
                <div className="bg-[#141414] backdrop-blur-xl rounded-2xl p-8 h-full">
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                    Active Jobs
                  </h2>
                  {jobDetails.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div
                        className="max-h-[650px] overflow-y-auto"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        <table className="w-full border-separate border-spacing-y-4 ">
                          <thead className="sticky top-0 bg-[#2A2A2A]">
                            <tr>
                              <th className="px-5 py-5 text-center text-[#FFFFFF] font-bold md:text-lg lg:text-lg xs:text-sm rounded-tl-lg rounded-bl-lg ">
                                ID
                              </th>
                              <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
                                Type
                              </th>
                              <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg  xs:text-sm">
                                Status
                              </th>
                              <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg  xs:text-sm rounded-tr-lg rounded-br-lg">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobDetails.map((job, index) => (
                              <React.Fragment>
                                <tr key={job.id} className="  ">
                                  <td className="px-5 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] text-center border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg bg-[#1A1A1A]">
                                    {index + 1}{" "}
                                    {/* Display sequential number instead of job.id */}
                                  </td>
                                  <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                                    {job.type}
                                  </td>
                                  <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] border border-l-0 border-[#2A2A2A] border-r-0">
                                    <span className="px-4 py-2 rounded-full text-[15px] border-[#5047FF] text-[#C1BEFF] border bg-[#5047FF1A]/10 md:text-md xs:text-[12px]">
                                      {job.status}
                                    </span>
                                  </td>
                                  <td className="bg-[#1A1A1A] px-6 py-5 space-x-2 text-white flex flex-row justify-between border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
                                    <div className="flex flex-row gap-5">
                                      <button
                                        disabled
                                        className="px-4 py-2 bg-[#C07AF6] rounded-lg text-sm text-white cursor-not-allowed"
                                      >
                                        Update
                                      </button>
                                      <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="px-4 py-2 bg-[#FF5757] rounded-lg text-sm text-white"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    {job.linkedJobs &&
                                      job.linkedJobs.some(
                                        (linkedJob) =>
                                          linkedJob.chain_status === 1
                                      ) && (
                                        <div
                                          onClick={() =>
                                            toggleJobExpand(job.id)
                                          }
                                          className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform duration-300 ${
                                              expandedJobs[job.id]
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                          >
                                            <path d="m6 9 6 6 6-6" />
                                          </svg>
                                        </div>
                                      )}
                                  </td>
                                </tr>
                                {expandedJobs[job.id] &&
                                  job.linkedJobs &&
                                  job.linkedJobs.length > 0 && (
                                    <tr>
                                      <td colSpan="4" className="">
                                        <div className="bg-[#1A1A1A] rounded-lg p-4">
                                          <h4 className="text-white font-bold mb-4">
                                            Linked Jobs
                                          </h4>
                                          <table className="w-full border-separate border-spacing-y-4 ">
                                            <thead className=" bg-[#2A2A2A]">
                                              <tr>
                                                <th className="px-5 py-5 text-center text-[#FFFFFF] font-bold md:text-lg lg:text-lg xs:text-sm rounded-tl-lg rounded-bl-lg ">
                                                  ID
                                                </th>
                                                <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg xs:text-sm">
                                                  Type
                                                </th>
                                                <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg  xs:text-sm">
                                                  Status
                                                </th>
                                                <th className="px-6 py-5 text-left text-[#FFFFFF] font-bold md:text-lg  xs:text-sm rounded-tr-lg rounded-br-lg">
                                                  Actions
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {job.linkedJobs.map(
                                                (linkedJob, index) => (
                                                  <tr
                                                    key={job.id}
                                                    className="  "
                                                  >
                                                    <td className="px-5 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] text-center border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg bg-[#1A1A1A]">
                                                      {index + 1}
                                                    </td>
                                                    <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border border-l-0 border-r-0 border-[#2A2A2A]">
                                                      {mapJobType(
                                                        linkedJob.job_type
                                                      )}
                                                    </td>
                                                    <td className="bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] border border-l-0 border-[#2A2A2A] border-r-0">
                                                      <span className="px-4 py-2 rounded-full text-[15px] border-[#5047FF] text-[#C1BEFF] border bg-[#5047FF1A]/10 md:text-md xs:text-[12px]">
                                                        {linkedJob.status
                                                          ? "InActive"
                                                          : "Active"}
                                                      </span>
                                                    </td>
                                                    <td className="bg-[#1A1A1A] px-6 py-5 space-x-2 text-white flex flex-row border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
                                                      <button
                                                        disabled
                                                        className="px-4 py-2 bg-[#C07AF6] rounded-lg text-sm text-white cursor-not-allowed"
                                                      >
                                                        Update
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDeleteJob(
                                                            job.id
                                                          )
                                                        }
                                                        className="px-4 py-2 bg-[#FF5757] rounded-lg text-sm text-white"
                                                      >
                                                        Delete
                                                      </button>
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <h4 className="text-center py-8 text-[#A2A2A2] flex items-center h-[650px] justify-center">
                      No active jobs found. Create your first job to get
                      started.
                    </h4>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-8 h-full lg:w-[25%] w-full">
              {loading ? (
                <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 animate-pulse">
                  <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                  <div className="p-6 bg-[#242323] rounded-lg">
                    <div className="h-4 bg-gray-700 rounded w-40 mb-7"></div>
                    <div className="h-8 bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 ">
                  <h3 className="xl:text-2xl text-lg font-bold mb-6  text-white">
                    Your Balance
                  </h3>
                  <div className="p-6 bg-[#242323] rounded-lg ">
                    <p className="text-[#A2A2A2] xl:text-md text-sm mb-7 font-bold tracking-wider">
                      Total TG Balance
                    </p>
                    <Tooltip title={`${tgBalance} TG`} placement="top">
                      <p className="xl:text-4xl text-2xl font-extrabold text-[#D9D9D9] truncate">
                        {formatBalance(tgBalance)} TG
                      </p>
                    </Tooltip>
                  </div>
                </div>
              )}
              <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 ">
                {loading ? (
                  <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="p-6 bg-[#242323] rounded-lg">
                      <div className="h-4 bg-gray-700 rounded w-40 mb-7"></div>
                      <div className="h-8 bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className=" xl:text-2xl text-lg font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                      Quick Actions
                    </h3>

                    <div className="space-y-8  ">
                      <div className="my-5">
                        <button
                          onClick={() => setStakeModalVisible(true)}
                          className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full"
                        >
                          <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                          <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                          <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base">
                            Stake ETH
                          </span>
                        </button>
                      </div>

                      <Link to="/">
                        <button className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full">
                          <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                          <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                          <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base">
                            Create New Job
                          </span>
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 ">
                {loading ? (
                  <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="p-6 bg-[#242323] rounded-lg">
                      <div className="h-4 bg-gray-700 rounded w-40 mb-7"></div>
                      <div className="h-8 bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="xl:text-2xl text-lg font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                      Statistics
                    </h3>
                    <div className="space-y-4 text-gray-300">
                      <div className="flex justify-start items-center gap-7">
                        <p className="font-semibold text-[#A2A2A2] bg-[#242323] py-3 px-4 rounded-md xl:text-md text-sm ">
                          {jobDetails.length}
                        </p>
                        <p className="text-[#A2A2A2] xl:text-md text-sm mb-2 font-bold tracking-wider">
                          Total Jobs
                        </p>
                      </div>
                      <div className="flex justify-start items-center gap-7">
                        <p className="font-semibold text-[#A2A2A2] bg-[#242323] py-3 px-4 rounded-md">
                          {
                            jobDetails.filter((job) => job.status === "Active")
                              .length
                          }
                        </p>
                        <p className="text-[#A2A2A2] text-md mb-2 font-bold tracking-wider">
                          Active Jobs
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isModalVisible && selectedJob && (
          <div className="fixed inset-0  backdrop-blur-sm flex justify-center items-center p-4">
            <div className=" p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                Update Job
              </h2>
              <form onSubmit={handleJobEdit} className="space-y-6">
                <div className="flex gap-4 justify-center">
                  <button
                    type="submit"
                    className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full"
                  >
                    <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                    <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                    <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base">
                      Save Changes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalVisible(false)}
                    className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full "
                  >
                    <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                    <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                    <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base">
                      Cancel
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {stakeModalVisible && (
          <div
            onClick={outsideClick}
            className="fixed inset-0  backdrop-blur-sm flex justify-center items-center p-4 z-50"
          >
            <div
              ref={modelRef}
              className="bg-[#141414] p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                Stake ETH
              </h2>
              <form onSubmit={handleStake} className="space-y-6">
                <div>
                  {isStaking ? (
                    <div className="flex justify-center p-5">
                      <img src={loader} alt="" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Amount (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-[#141414] border border-[#3C3C3C] rounded-lg focus:outline-none text-white"
                        placeholder="Enter ETH amount"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    disabled={
                      isStaking ||
                      !stakeAmount ||
                      Number(stakeAmount) >
                        Number(accountBalance?.formatted || 0)
                    }
                    className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full"
                  >
                    <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                    <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                    <span
                      className={`font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base ${
                        isStaking ||
                        !stakeAmount ||
                        Number(stakeAmount) >
                          Number(accountBalance?.formatted || 0)
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      {isStaking
                        ? "Staking..."
                        : Number(stakeAmount) >
                            Number(accountBalance?.formatted || 0)
                          ? "Insufficient ETH"
                          : "Stake"}
                    </span>
                  </button>

                  {/* <button
                    onClick={() => setStakeModalVisible(false)}
                    className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full "
                  >
                    <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                    <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                    <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base">
                      Cancel
                    </span>
                  </button> */}
                </div>
              </form>
            </div>
          </div>
        )}

        {!isWalletInstalled && showModal && (
          <WalletModal onClose={() => setShowModal(false)} />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
