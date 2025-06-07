import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { useStakeRegistry } from "./CreateJobPage/hooks/useStakeRegistry";
import WalletModal from "../components/WalletModal";
import { Tooltip } from "antd";
import { useBalance, useAccount } from "wagmi";
import useApi from "../hooks/useApi";
import timeBasedSvg from "../assets/time-based.svg"
import eventBasedSvg from "../assets/event-based.svg"
import conditionBasedSvg from "../assets/condition-based.svg"

// --- Add Constants for Time Calculations ---
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE; // 3600
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;    // 86400

// Helper function to slice address
const sliceAddress = (address) => {
  if (!address) return 'Not specified';
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
};

function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [jobDetails, setJobDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const logoRef = useRef(null);
  const modelRef = useRef(null);
  const dropdownRef = useRef(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [expandedJobDetails, setExpandedJobDetails] = useState({});
  const [expandedLinkedJobDetails, setExpandedLinkedJobDetails] = useState({});
  const [tgBalance, setTgBalance] = useState(0);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isWalletInstalled, setIsWalletInstalled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isStaking, setIsStaking] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const { address } = useAccount();
  const { data: accountBalance } = useBalance({
    address: address,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const api = useApi(); // Add the useApi hook

  // Add state for custom select dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const linkedJobsRef = useRef(null); // Single ref for the linked jobs section

  const toggleJobExpand = (jobId) => {
    setExpandedJobs((prev) => {
      // Create a new object with all jobs collapsed
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      // Toggle the clicked job
      newState[jobId] = !prev[jobId];

      // If we're expanding the job, scroll to the linked jobs section after a short delay
      if (!prev[jobId]) {
        setTimeout(() => {
          if (linkedJobsRef.current) {
            const headerOffset = 200;
            const elementPosition = linkedJobsRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 500);
      }

      return newState;
    });

    // Close job details when expanding linked jobs
    setExpandedJobDetails((prev) => ({
      ...prev,
      [jobId]: false,
    }));
  };

  const toggleJobDetails = (jobId) => {
    setExpandedJobDetails((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
    // Close linked jobs when expanding job details
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: false,
    }));
  };

  const toggleLinkedJobDetails = (jobId) => {
    setExpandedLinkedJobDetails((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const outsideClick = (e) => {
    // Check if click is outside both the dropdown button and menu


    const dropdownButton = document.querySelector('.dropdown-button');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownButton && !dropdownButton.contains(e.target) &&
      dropdownMenu && !dropdownMenu.contains(e.target)) {
      setIsDropdownOpen(false);
    }
    if (modelRef.current && !modelRef.current.contains(e.target)) {
      setStakeModalVisible(false);
      setStakeAmount("")
    }
  };

  useEffect(() => {
    // Add click event listener to handle outside clicks
    document.addEventListener('mousedown', outsideClick);
    return () => {
      document.removeEventListener('mousedown', outsideClick);
    };
  }, []);

  useEffect(() => {
    const initializeProvider = async () => {
      if (typeof window.ethereum !== "undefined") {

        if (address) {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
        }
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
  }, [address]);

  useEffect(() => {
    // Only fetch job details if provider exists and user is connected (address exists)
    if (provider && address) {
      fetchJobDetails();
    }
  }, [provider, address]);


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
      setLoading(true);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Fetch job details from the ScyllaDB API using our new useApi hook
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/api/jobs/user/${userAddress}`);
      const jobsData = await response.json();
      console.log("Raw jobs data from API:", jobsData); // Debug log

      // If the server is down, the useApi hook will have triggered the modal
      // and returned an object with success: false
      if (!response.ok) {
        throw new Error("Failed to fetch job details from the database");
      }

      // First, create a lookup for quick access by job_id
      const jobMap = {};
      jobsData.forEach((job) => {
        jobMap[job.job_data.job_id] = job;
      });

      // Build the linkedJobsMap
      const linkedJobsMap = {};
      jobsData.forEach((job) => {
        // Only process main jobs (chain_status === 0)
        if (job.job_data.chain_status === 0) {
          let mainJobId = job.job_data.job_id;
          let linkedJobs = [];
          // Start the chain from the main job's link_job_id
          let nextJobId = job.job_data.link_job_id;

          // Follow the chain until link_job_id is -1
          while (nextJobId !== -1) {
            const nextJob = jobMap[nextJobId];
            if (!nextJob) break; // in case of missing data

            // Process the linked job data similarly to the main jobs
            const typeSpecificData = nextJob.time_job_data || nextJob.event_job_data || nextJob.condition_job_data || {};

            const processedLinkedJob = {
              id: nextJob.job_data.job_id,
              title: nextJob.job_data.job_title,
              jobTitle: nextJob.job_data.job_title,
              type: mapJobType(nextJob.job_data.job_type),
              status: "Active", // Or derive status if available in raw data
              // linkedJobs: [], // Linked jobs of linked jobs are not currently displayed/processed
              taskDefinitionId: nextJob.job_data.task_definition_id,
              userId: nextJob.job_data.user_id,
              priority: nextJob.job_data.priority, // Assuming priority and security are in job_data
              security: nextJob.job_data.security,
              linkJobId: nextJob.job_data.link_job_id,
              chainStatus: nextJob.job_data.chain_status,
              custom: nextJob.job_data.custom,
              timeFrame: nextJob.job_data.time_frame || {},
              recurring: typeSpecificData.recurring,
              timeInterval: typeSpecificData.time_interval || {},
              triggerChainId: typeSpecificData.trigger_chain_id,
              triggerContractAddress: typeSpecificData.trigger_contract_address,
              triggerEvent: typeSpecificData.trigger_event,
              scriptIPFSUrl: typeSpecificData.script_ipfs_url,
              scriptTriggerFunction: typeSpecificData.script_trigger_function,
              targetChainId: typeSpecificData.target_chain_id,
              targetContractAddress: typeSpecificData.target_contract_address,
              targetFunction: typeSpecificData.target_function,
              argType: typeSpecificData.arg_type,
              arguments: typeSpecificData.arguments,
              scriptTargetFunction: typeSpecificData.script_target_function,
              abi: typeSpecificData.abi,
              cost_prediction: nextJob.job_data.job_cost_prediction,
              createdAt: nextJob.job_data.created_at,
              lastExecutedAt: nextJob.job_data.last_executed_at,
              taskIds: nextJob.job_data.task_ids,
              feeUsed: nextJob.job_data.fee_used
            };

            linkedJobs.push(processedLinkedJob);
            nextJobId = nextJob.job_data.link_job_id;
          }

          linkedJobsMap[mainJobId] = linkedJobs;
        }
      });
      console.log("Linked Jobs Map:", linkedJobsMap); // Debug log

      // Now create your tempJobs array by filtering main jobs and adding their linked jobs
      const tempJobs = jobsData
        .filter(
          (jobDetail) => jobDetail.job_data.chain_status === 0 // Temporarily remove status check
        ) // Only main jobs (temporarily)
        .map((jobDetail) => {
          console.log("Processing job detail:", jobDetail); // Debug log
          // Get the type-specific data based on job type
          const typeSpecificData = jobDetail.time_job_data || jobDetail.event_job_data || jobDetail.condition_job_data || {};

          const job = {
            id: jobDetail.job_data.job_id,
            title: jobDetail.job_data.job_title,
            jobTitle: jobDetail.job_data.job_title,
            type: mapJobType(jobDetail.job_data.job_type),
            status: "Active",
            linkedJobs: linkedJobsMap[jobDetail.job_data.job_id] || [],
            taskDefinitionId: jobDetail.job_data.task_definition_id,
            userId: jobDetail.job_data.user_id,
            linkJobId: jobDetail.job_data.link_job_id,
            chainStatus: jobDetail.job_data.chain_status,
            custom: jobDetail.job_data.custom,
            timeFrame: jobDetail.job_data.time_frame || {},
            timeInterval: typeSpecificData.time_interval || {},
            targetChainId: typeSpecificData.target_chain_id,
            targetContractAddress: typeSpecificData.target_contract_address,
            targetFunction: typeSpecificData.target_function,
            argType: typeSpecificData.arg_type,
            abi: typeSpecificData.abi,
            cost_prediction: jobDetail.job_data.job_cost_prediction, // Get from job_data
            createdAt: jobDetail.job_data.created_at,
            lastExecutedAt: jobDetail.job_data.last_executed_at,
          };
          console.log("Processed job object:", job); // Debug log
          return job;
        });

      console.log("Final tempJobs array:", tempJobs); // Debug log
      setJobDetails(tempJobs);
      if (tempJobs.length === 0 && connected && !loading) {
        toast("No jobs found. Create a new job to get started!", {
          icon: "ℹ️",
        });
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      // No need to show error toast here as the useApi hook 
      // and ErrorContext will handle displaying the server-down modal
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map job type ID to label
  const mapJobType = (taskDefinitionId) => {
    // Convert taskDefinitionId to string to handle both string and number types
    const typeId = String(taskDefinitionId);

    switch (typeId) {
      case "1":
      case "2":
        return "Time-based";
      case "3":
      case "4":
        return "Event-based";
      case "5":
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
        // Use wagmi's useAccount hook instead of directly calling ethereum
        // This will respect the autoConnect setting from App.js
        setConnected(!!address);

        // Only show toast if we have ethereum but no address (wallet exists but not connected)
        if (!address && window.ethereum) {
          toast.dismiss();
          toast("Connect your wallet to view your dashboard", {
            icon: "ℹ️",
          });
        }
      } catch (error) {
        toast.error("Failed to check wallet connection!");
        setConnected(false);
      }
    };

    checkConnection();
  }, [address]); // Add address to dependencies

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
      setDeleteConfirmationVisible(false);
      setJobToDelete(null);

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
      toast.error("Failed to delete job");
    }
  };

  const showDeleteConfirmation = (jobId) => {
    setJobToDelete(jobId);
    setDeleteConfirmationVisible(true);
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
        (selectedJob.timeframe.days || 0) * SECONDS_PER_DAY +
        (selectedJob.timeframe.hours || 0) * SECONDS_PER_HOUR +
        (selectedJob.timeframe.minutes || 0) * SECONDS_PER_MINUTE;

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

      toast.success("Job updated successfully");

      // Refresh job details after update
      await fetchJobDetails();
      handleCloseModal();
    } catch (error) {
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
      setTgBalance(ethers.formatEther(tgBalance));
    } catch (error) {
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

      const stakeAmountInWei = ethers.parseEther(stakeAmount.toString());
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
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toFixed(2);
  };

  // Add new helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add new helper function for text truncation
  const truncateText = (text, maxLength = 20) => {
    if (!text) return 'Not specified';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Add pagination helper functions
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Pagination bar with ellipsis and page numbers (like leaderboard)
  const renderPagination = (totalPages) => {
    if (totalPages <= 1) return null;
    const pageWindow = 2;
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - pageWindow && i <= currentPage + pageWindow)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - pageWindow - 1 && currentPage - pageWindow > 2) ||
        (i === currentPage + pageWindow + 1 && currentPage + pageWindow < totalPages - 1)
      ) {
        pages.push('ellipsis-' + i);
      }
    }
    // Remove duplicate ellipsis
    pages = pages.filter((item, idx, arr) => {
      if (typeof item === 'string' && item.startsWith('ellipsis')) {
        return idx === 0 || arr[idx - 1] !== item;
      }
      return true;
    });
    return (
      <div className="flex justify-center items-center space-x-2 py-8">
        {/* Previous Arrow */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-lg flex items-center justify-center border border-[#EDEDED] ${currentPage === 1 ? 'bg-[#444] text-[#bbb] opacity-50 cursor-not-allowed' : 'bg-white text-black hover:bg-[#F8FF7C]'} transition`}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {/* Page Numbers & Ellipsis */}
        {pages.map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${currentPage === page
                ? 'border-[#C07AF6] text-white bg-[#271039] font-bold'
                : 'border-[#EDEDED] text-white bg-transparent hover:bg-white hover:border-white hover:text-black'} transition`}
            >
              {page}
            </button>
          ) : (
            <span
              key={page}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#232323] text-[#EDEDED] border border-[#232323]"
            >
              ...
            </span>
          )
        )}
        {/* Next Arrow */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-full flex items-center justify-center border border-[#EDEDED] ${currentPage === totalPages ? 'bg-[#fff] text-[#bbb] opacity-50 cursor-not-allowed' : 'bg-white text-black hover:bg-[#F8FF7C]'} transition`}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    );
  };

  // Add this function to filter jobs
  const getFilteredJobs = () => {
    if (selectedType === "all") {
      return jobDetails;
    }
    return jobDetails.filter(job => mapJobType(job.taskDefinitionId) === selectedType);
  };

  return (
    <div className="min-h-screen mt-[10rem] lg:mt-[17rem] max-w-[1600px] w-[85%] mx-auto">
      <h1 className="text-3xl sm:text-4xl lg:text-7xl font-[300]  bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white text-center">
        Dashboard      </h1>

      <div className="fixed inset-0  pointer-events-none" />
      <div className="fixed  pointer-events-none" />

      <div className=" mx-auto  lg:my-15 md:my-20 my-10 sm:my-20 ">
        <div className="flex max-w-[1600px] mx-auto justify-evenly gap-5 lg:flex-row flex-col ">
          <div className="xl:w-[73%] lg:w-[70%] w-full">
            <div className="bg-[#141414] backdrop-blur-xl rounded-2xl p-4 md:p-8">
              <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-3 md:flex-row">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                  Active Jobs
                </h2>
                <div className="flex items-center gap-4">
                  {/* Custom Select Dropdown */}
                  <div className="relative">
                    {/* Visible Select Button */}
                    <div
                      className="dropdown-button bg-[#1A1A1A] text-[#A2A2A2] border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-none  cursor-pointer  rounded-full transition-colors duration-200 flex items-center justify-between w-[200px]"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <li className="text-[#A2A2A2] list-none">{selectedType === "all" ? "All Types" : selectedType}</li>
                      {/* Dropdown Arrow Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`ml-2 w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Dropdown Options List */}
                    {isDropdownOpen && (
                      <div ref={dropdownRef} className="dropdown-menu absolute z-10 mt-1 w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg">
                        <ul className="py-0">
                          {[
                            { type: 'all', label: 'All Types', icon: null },
                            { type: 'Time-based', label: 'Time-based', icon: timeBasedSvg },
                            { type: 'Event-based', label: 'Event-based', icon: eventBasedSvg },
                            { type: 'Condition-based', label: 'Condition-based', icon: conditionBasedSvg }
                          ].map(({ type, label, icon }) => (
                            <li
                              key={type}
                              className={`rounded-lg px-4 py-2 cursor-pointer my-2 text-[#A2A2A2] hover:bg-[#2A2A2A] ${selectedType === type ? 'bg-[#2A2A2A] text-white' : ''}`}
                              onClick={() => {
                                setSelectedType(type === 'all' ? 'all' : type);
                                setIsDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {icon && (
                                  <img
                                    src={icon}
                                    alt={label}
                                    className="w-5 h-5 "
                                  />
                                )}
                                <span className="hidden md:inline">{label}</span>
                                <span className="md:hidden">{label}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="">

                {getFilteredJobs().length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3">
                      {getPaginatedData(getFilteredJobs()).map((job, index) => (
                        <div key={job.id} className={`bg-[#1A1A1A] rounded-xl border ${expandedJobs[job.id] ? 'bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border-2 border-white shadow-lg' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'} transition-all duration-300 relative ${expandedJobDetails[job.id] ? 'h-auto' : 'h-[310px]'} hover:transform hover:scale-[1.02] transition-transform duration-300 ease`}>
                          <div>
                            <div className={`flex justify-between items-center mb-4 p-3  ${expandedJobs[job.id] ? 'border-b border-white ' : 'border-[#2A2A2A] border-b hover:border-[#3A3A3A]'}`} >
                              <h3 className="text-[#FBF197] font-bold text-lg ">{job.jobTitle}</h3>

                              <div>
                                {job.linkedJobs && job.linkedJobs.length > 0 && (
                                  <Tooltip title="Linked Job" color="#141414">
                                    <button
                                      onClick={() => toggleJobExpand(job.id)}
                                      className="p-2 rounded-full text-white hover:bg-[#3A3A3A] transition-colors bg-[#2a2a2a] border-[#FFFFFF] border"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`transition-transform duration-300 ${expandedJobs[job.id] ? "rotate-180" : ""}`}
                                      >
                                        <path d="m6 9 6 6 6-6" />
                                      </svg>
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            <div className={` space-y-2  px-3 `}>
                              <div className="flex items-center justify-between gap-2 py-1.5">
                                <span className="text-sm text-white font-bold">Job Type :</span>
                                <div className="flex items-center gap-2">

                                  <span className="text-[#A2A2A2] text-sm">
                                    {mapJobType(job.taskDefinitionId)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 py-1.5">
                                <span className="text-sm text-white font-bold">Job Status :</span>
                                <span className=" text-[#A2A2A2] text-sm  ">
                                  {job.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 py-1.5">
                                <span className="text-sm text-white font-bold">TG Used :</span>
                                <span className="text-[#A2A2A2] text-sm">{parseFloat(job.cost_prediction).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 py-1.5">
                                <span className="text-sm text-white font-bold">Timeframe :</span>
                                <span className="text-[#A2A2A2] text-sm">
                                  {job.timeFrame}
                                </span>
                              </div>

                              {expandedJobDetails[job.id] && (
                                <div className=" space-y-2 text-[#A2A2A2] text-sm">
                                  <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Avg Type :</span><span className="text-[#A2A2A2] text-sm">{job.argType}</span></div>
                                  <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Interval :</span><span className="text-[#A2A2A2] text-sm"> {job.timeInterval}</span></div>

                                  <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target Contract :</span><span className="text-[#A2A2A2] text-sm"> {sliceAddress(job.targetContractAddress)} </span></div>
                                  <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Created At:</span><span className="text-[#A2A2A2] text-sm"> {formatDate(job.createdAt)}</span></div>
                                  <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target Function :</span><span className="text-[#A2A2A2] text-sm"> {truncateText(job.targetFunction)}</span></div>
                                  <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target ChainId :</span><span className="text-[#A2A2A2] text-sm"> {job.targetChainId}</span></div>
                                  {/* <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Last Execution :</span><span className="text-[#A2A2A2] text-sm"> {job.lastExecutedAt}</span></div> */}
                                </div>
                              )}
                            </div>
                            <div className={`flex justify-end gap-2 mt-4  p-3  ${expandedJobs[job.id] ? 'border-t border-white ' : 'border-[#2A2A2A] border-t hover:border-[#3A3A3A]'}`}>
                              <Tooltip title="Update" color="#141414">
                                <button
                                  disabled
                                  className="p-2 bg-[#C07AF6] rounded-full text-white cursor-not-allowed hover:bg-[#a46be0] transition-colors"
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.1998 3.2793C13.7298 3.2793 16.6298 5.8893 17.1198 9.2793H19.1998L15.6998 13.2793L12.1998 9.2793H14.5198C14.2959 8.30049 13.7469 7.42647 12.9623 6.79988C12.1777 6.1733 11.2039 5.83116 10.1998 5.8293C8.7498 5.8293 7.4698 6.5393 6.6598 7.6093L4.9498 5.6593C5.60453 4.91111 6.41174 4.31164 7.31724 3.90115C8.22275 3.49065 9.2056 3.27862 10.1998 3.2793ZM9.7998 16.7193C6.2798 16.7193 3.3698 14.1093 2.8798 10.7193H0.799805L4.2998 6.7193C5.4698 8.0493 6.6298 9.3893 7.7998 10.7193H5.4798C5.70369 11.6981 6.25273 12.5721 7.03732 13.1987C7.82191 13.8253 8.79572 14.1674 9.7998 14.1693C11.2498 14.1693 12.5298 13.4593 13.3398 12.3893L15.0498 14.3393C14.3959 15.0885 13.5889 15.6887 12.6832 16.0992C11.7775 16.5098 10.7942 16.7213 9.7998 16.7193Z" fill="white" />
                                  </svg>
                                </button>
                              </Tooltip>
                              <Tooltip title="Delete" color="#141414">
                                <button
                                  onClick={() => showDeleteConfirmation(job.id)}
                                  className="p-2 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.33317 4.99935H11.6665C11.6665 4.55732 11.4909 4.1334 11.1783 3.82084C10.8658 3.50828 10.4419 3.33268 9.99984 3.33268C9.55781 3.33268 9.13389 3.50828 8.82133 3.82084C8.50877 4.1334 8.33317 4.55732 8.33317 4.99935ZM6.6665 4.99935C6.6665 4.11529 7.01769 3.26745 7.64281 2.64233C8.26794 2.01721 9.11578 1.66602 9.99984 1.66602C10.8839 1.66602 11.7317 2.01721 12.3569 2.64233C12.982 3.26745 13.3332 4.11529 13.3332 4.99935H17.4998C17.7208 4.99935 17.9328 5.08715 18.0891 5.24343C18.2454 5.39971 18.3332 5.61167 18.3332 5.83268C18.3332 6.0537 18.2454 6.26566 18.0891 6.42194C17.9328 6.57822 17.7208 6.66602 17.4998 6.66602H16.7648L16.0265 15.2827C15.9555 16.1147 15.5748 16.8898 14.9597 17.4546C14.3446 18.0194 13.5399 18.3328 12.7048 18.3327H7.29484C6.45976 18.3328 5.65507 18.0194 5.03996 17.4546C4.42486 16.8898 4.04415 16.1147 3.97317 15.2827L3.23484 6.66602H2.49984C2.27882 6.66602 2.06686 6.57822 1.91058 6.42194C1.7543 6.26566 1.6665 6.0537 1.6665 5.83268C1.6665 5.61167 1.7543 5.39971 1.91058 5.24343C2.06686 5.08715 2.27882 4.99935 2.49984 4.99935H6.6665ZM12.4998 9.99935C12.4998 9.77833 12.412 9.56637 12.2558 9.41009C12.0995 9.25381 11.8875 9.16602 11.6665 9.16602C11.4455 9.16602 11.2335 9.25381 11.0772 9.41009C10.921 9.56637 10.8332 9.77833 10.8332 9.99935V13.3327C10.8332 13.5537 10.921 13.7657 11.0772 13.9219C11.2335 14.0782 11.4455 14.166 11.6665 14.166C11.8875 14.166 12.0995 14.0782 12.2558 13.9219C12.412 13.7657 12.4998 13.5537 12.4998 13.3327V9.99935ZM8.33317 9.16602C8.11216 9.16602 7.9002 9.25381 7.74392 9.41009C7.58763 9.56637 7.49984 9.77833 7.49984 9.99935V13.3327C7.49984 13.5537 7.58763 13.7657 7.74392 13.9219C7.9002 14.0782 8.11216 14.166 8.33317 14.166C8.55418 14.166 8.76615 14.0782 8.92243 13.9219C9.07871 13.7657 9.1665 13.5537 9.1665 13.3327V9.99935C9.1665 9.77833 9.07871 9.56637 8.92243 9.41009C8.76615 9.25381 8.55418 9.16602 8.33317 9.16602Z" fill="white" />
                                  </svg>
                                </button>
                              </Tooltip>
                              <Tooltip title="View Details" color="#141414">
                                <button
                                  onClick={() => toggleJobDetails(job.id)}
                                  className="p-2 bg-[#2A2A2A] rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                              </Tooltip>
                            </div>
                          </div>




                        </div>
                      ))}

                    </div>
                    {/* Linked Jobs Section */}
                    {getPaginatedData(getFilteredJobs()).map((job, index) => (
                      job.linkedJobs && job.linkedJobs.length > 0 && expandedJobs[job.id] && (
                        <div key={`linked-${job.id}`} className={`rounded-lg   `}>
                          <h4
                            ref={linkedJobsRef}
                            className="text-white font-bold my-7 text-lg sm:text-xl"
                          >
                            Linked Jobs
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6  xl:grid-cols-3">
                            {job.linkedJobs.map((linkedJob) => (
                              <div key={linkedJob.job_id} className={`bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all duration-300 ${expandedLinkedJobDetails[linkedJob.job_id] ? 'h-auto' : 'h-[320px]'} hover:transform hover:scale-[1.02] transition-transform duration-300 ease`}>
                                <div className="flex flex-row justify-between items-start gap-3 sm:gap-4">
                                  <div className="flex-1">
                                    <div className="border-[#2A2A2A] border-b p-3 mb-4">
                                      <h3 className="text-[#FBF197] font-bold text-lg">{linkedJob.jobTitle || linkedJob.title}</h3>
                                    </div>
                                    <div className="space-y-2 p-3">
                                      <div className="flex items-center justify-between gap-2 py-1">
                                        <span className="text-sm text-white">Job Type :</span>
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={
                                              mapJobType(linkedJob.taskDefinitionId) === "Time-based"
                                                ? timeBasedSvg
                                                : mapJobType(linkedJob.taskDefinitionId) === "Event-based"
                                                  ? eventBasedSvg
                                                  : conditionBasedSvg
                                            }
                                            alt={mapJobType(linkedJob.taskDefinitionId)}
                                            className="w-4 h-4"
                                          />
                                          <span className="text-[#A2A2A2] text-sm">
                                            {mapJobType(linkedJob.taskDefinitionId)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 py-1">
                                        <span className="text-sm text-white">Job Status :</span>
                                        <span className=" text-[#A2A2A2] rounded-full text-xs sm:text-sm  whitespace-nowrap">
                                          {linkedJob.status}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 py-2 py-1">
                                        <span className="text-sm text-white">TG Used :</span>
                                        <span className="text-[#A2A2A2] text-sm">{parseFloat(linkedJob.cost_prediction).toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 py-1">
                                        <span className="text-sm text-white">Timeframe :</span>
                                        <span className="text-[#A2A2A2] text-sm">
                                          {linkedJob.timeFrame}
                                        </span>
                                      </div>
                                      {expandedLinkedJobDetails[linkedJob.job_id] && (
                                        <div className=" space-y-2 text-[#A2A2A2] text-sm">
                                          <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Avg Type :</span><span className="text-[#A2A2A2] text-sm">{linkedJob.argType}</span></div>
                                          <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Interval :</span><span className="text-[#A2A2A2] text-sm"> {linkedJob.timeInterval}</span></div>

                                          <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target Contract :</span><span className="text-[#A2A2A2] text-sm"> {sliceAddress(linkedJob.targetContractAddress)} </span></div>
                                          <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Created At:</span><span className="text-[#A2A2A2] text-sm"> {formatDate(linkedJob.createdAt)}</span></div>
                                          <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target Function :</span><span className="text-[#A2A2A2] text-sm"> {truncateText(linkedJob.targetFunction)}</span></div>
                                          <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1"><span className="text-sm text-white">Target ChainId :</span><span className="text-[#A2A2A2] text-sm"> {linkedJob.targetChainId}</span></div>
                                          {/* <div className="flex items-center justify-between gap-2 py-1"><span className="text-sm text-white">Last Execution :</span><span className="text-[#A2A2A2] text-sm"> {linkedJob.lastExecutedAt}</span></div> */}
                                        </div>
                                      )}
                                    </div>
                                    <div className={`flex justify-end gap-2 mt-4  p-3  border-[#2A2A2A] border-t hover:border-[#3A3A3A]`}>
                                      <Tooltip title="Update" color="#141414">
                                        <button
                                          disabled
                                          className="p-1.5 sm:p-2 bg-[#C07AF6] rounded-full text-white cursor-not-allowed hover:bg-[#a46be0] transition-colors"
                                        >
                                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
                                            <path d="M10.1998 3.2793C13.7298 3.2793 16.6298 5.8893 17.1198 9.2793H19.1998L15.6998 13.2793L12.1998 9.2793H14.5198C14.2959 8.30049 13.7469 7.42647 12.9623 6.79988C12.1777 6.1733 11.2039 5.83116 10.1998 5.8293C8.7498 5.8293 7.4698 6.5393 6.6598 7.6093L4.9498 5.6593C5.60453 4.91111 6.41174 4.31164 7.31724 3.90115C8.22275 3.49065 9.2056 3.27862 10.1998 3.2793ZM9.7998 16.7193C6.2798 16.7193 3.3698 14.1093 2.8798 10.7193H0.799805L4.2998 6.7193C5.4698 8.0493 6.6298 9.3893 7.7998 10.7193H5.4798C5.70369 11.6981 6.25273 12.5721 7.03732 13.1987C7.82191 13.8253 8.79572 14.1674 9.7998 14.1693C11.2498 14.1693 12.5298 13.4593 13.3398 12.3893L15.0498 14.3393C14.3959 15.0885 13.5889 15.6887 12.6832 16.0992C11.7775 16.5098 10.7942 16.7213 9.7998 16.7193Z" fill="white" />
                                          </svg>
                                        </button>
                                      </Tooltip>
                                      <Tooltip title="Delete" color="#141414">
                                        <button
                                          onClick={() => showDeleteConfirmation(linkedJob.job_id)}
                                          className="p-1.5 sm:p-2 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
                                        >
                                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
                                            <path d="M8.33317 4.99935H11.6665C11.6665 4.55732 11.4909 4.1334 11.1783 3.82084C10.8658 3.50828 10.4419 3.33268 9.99984 3.33268C9.55781 3.33268 9.13389 3.50828 8.82133 3.82084C8.50877 4.1334 8.33317 4.55732 8.33317 4.99935ZM6.6665 4.99935C6.6665 4.11529 7.01769 3.26745 7.64281 2.64233C8.26794 2.01721 9.11578 1.66602 9.99984 1.66602C10.8839 1.66602 11.7317 2.01721 12.3569 2.64233C12.982 3.26745 13.3332 4.11529 13.3332 4.99935H17.4998C17.7208 4.99935 17.9328 5.08715 18.0891 5.24343C18.2454 5.39971 18.3332 5.61167 18.3332 5.83268C18.3332 6.0537 18.2454 6.26566 18.0891 6.42194C17.9328 6.57822 17.7208 6.66602 17.4998 6.66602H16.7648L16.0265 15.2827C15.9555 16.1147 15.5748 16.8898 14.9597 17.4546C14.3446 18.0194 13.5399 18.3328 12.7048 18.3327H7.29484C6.45976 18.3328 5.65507 18.0194 5.03996 17.4546C4.42486 16.8898 4.04415 16.1147 3.97317 15.2827L3.23484 6.66602H2.49984C2.27882 6.66602 2.06686 6.57822 1.91058 6.42194C1.7543 6.26566 1.6665 6.0537 1.6665 5.83268C1.6665 5.61167 1.7543 5.39971 1.91058 5.24343C2.06686 5.08715 2.27882 4.99935 2.49984 4.99935H6.6665ZM12.4998 9.99935C12.4998 9.77833 12.412 9.56637 12.2558 9.41009C12.0995 9.25381 11.8875 9.16602 11.6665 9.16602C11.4455 9.16602 11.2335 9.25381 11.0772 9.41009C10.921 9.56637 10.8332 9.77833 10.8332 9.99935V13.3327C10.8332 13.5537 10.921 13.7657 11.0772 13.9219C11.2335 14.0782 11.4455 14.166 11.6665 14.166C11.8875 14.166 12.0995 14.0782 12.2558 13.9219C12.412 13.7657 12.4998 13.5537 12.4998 13.3327V9.99935ZM8.33317 9.16602C8.11216 9.16602 7.9002 9.25381 7.74392 9.41009C7.58763 9.56637 7.49984 9.77833 7.49984 9.99935V13.3327C7.49984 13.5537 7.58763 13.7657 7.74392 13.9219C7.9002 14.0782 8.11216 14.166 8.33317 14.166C8.55418 14.166 8.76615 14.0782 8.92243 13.9219C9.07871 13.7657 9.1665 13.5537 9.1665 13.3327V9.99935C9.1665 9.77833 9.07871 9.56637 8.92243 9.41009C8.76615 9.25381 8.55418 9.16602 8.33317 9.16602Z" fill="white" />
                                          </svg>
                                        </button>
                                      </Tooltip>
                                      <Tooltip title="View Details" color="#141414">
                                        <button
                                          onClick={() => toggleLinkedJobDetails(linkedJob.job_id)}
                                          className="p-1.5 sm:p-2 bg-[#2A2A2A] rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
                                        >
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                          </svg>
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                  {/* <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm border-[#82FBD0] text-[#82FBD0] border bg-[#82FBD01A]/10 whitespace-nowrap">
              {linkedJob.status ? "InActive" : "Active"}
            </span> */}
                                </div>


                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </>
                ) : !connected ? (
                  <div className="col-span-full text-center py-8">
                    <div className="flex flex-col items-center justify-center lg:h-[200px] h-[150px] text-[#A2A2A2]">
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                        <path d="M12 17C12.2833 17 12.521 16.904 12.713 16.712C12.905 16.52 13.0007 16.2827 13 16C12.9993 15.7173 12.9033 15.48 12.712 15.288C12.5207 15.096 12.2833 15 12 15C11.7167 15 11.4793 15.096 11.288 15.288C11.0967 15.48 11.0007 15.7173 11 16C10.9993 16.2827 11.0953 16.5203 11.288 16.713C11.4807 16.9057 11.718 17.0013 12 17ZM12 13C12.2833 13 12.521 12.904 12.713 12.712C12.905 12.52 13.0007 12.2827 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22Z" fill="#A2A2A2" />
                      </svg>
                      <p className="text-sm lg:text-lg md:text-lg mb-2">Wallet Not Connected</p>
                      <p className="text-sm lg:text-md md:text-md text-center text-[#666666] mb-4 tracking-wide">
                        Please connect your wallet to interact with the contract
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-[#A2A2A2]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-4"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <p className="text-sm lg:text-lg md:text-md mb-2 text-center">No {selectedType === 'all' ? '' : selectedType} jobs found</p>
                    <p className="text-md text-[#666666] mb-4 text-sm lg:text-lg md:text-md text-center" >
                      {selectedType === 'all' ? (
                        <Link to="/" className="text-[#666666] underline transition-all underline-offset-4 hover:text-[#F8ff7c]/60">
                          Create your first job to get started
                        </Link>
                      ) : (
                        <span className="text-sm lg:text-md md:text-md">Try selecting a different job type.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>



              {getFilteredJobs().length > 0 && renderPagination(getTotalPages(getFilteredJobs()))}
            </div>
          </div>

          <div className="space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
            <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-8 ">
              <h3 className="xl:text-2xl text-lg font-bold mb-6  text-white">
                Your Balance
              </h3>
              <div className="p-6 bg-[#242323] rounded-lg ">
                <p className="text-[#A2A2A2] xl:text-md text-sm mb-7 font-bold tracking-wider">
                  Total TG Balance
                </p>
                <p className="xl:text-4xl text-2xl font-extrabold text-[#D9D9D9] truncate">
                  {formatBalance(tgBalance)} TG
                </p>
              </div>
            </div>

            <div className="bg-[#1C1C1C] backdrop-blur-xl rounded-2xl p-6 ">
              <div>
                <h3 className=" xl:text-2xl text-lg font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                  Quick Actions
                </h3>

                <div className="space-y-8  ">
                  <div className="my-5">
                    <button
                      onClick={() => setStakeModalVisible(true)}
                      disabled={!connected}
                      className={`relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full ${!connected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                      <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                      <span className="bottom-[3px] font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base">
                        Top Up TG
                      </span>
                    </button>
                  </div>

                  <Link to="/">
                    <button className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full">
                      <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                      <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                      <span className="bottom-[3px] font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base">
                        Create New Job
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 ">
              <div>
                <h3 className="xl:text-2xl text-lg font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                  Statistics
                </h3>
                <div className="space-y-4 text-gray-300">
                  <div className="flex justify-start items-center gap-7">
                    <p className="font-semibold text-[#A2A2A2] bg-[#242323] py-3 px-4 rounded-md xl:text-md text-sm ">
                      {jobDetails.length}
                    </p>
                    <p className="text-[#A2A2A2] xl:text-lg text-sm  font-bold tracking-wider">
                      Total Jobs
                    </p>
                  </div>
                  <div className="flex justify-start items-center gap-7">
                    <p className="font-semibold text-[#A2A2A2] bg-[#242323] py-3 px-4 rounded-md xl:text-md text-sm ">
                      {jobDetails.reduce((total, job) => total + (job.linkedJobs?.length || 0), 0)}
                    </p>
                    <p className="text-[#A2A2A2] xl:text-lg text-sm  font-bold tracking-wider">
                      Linked Jobs
                    </p>
                  </div>

                </div>
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
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                Top Up TG
              </h2>
              <span className="text-gray-300 text-sm ">Exchange ETH to TG (Flue of your job) to automate jobs on TriggerX.
                1 ETH = 1000 TG
              </span>
              <form onSubmit={handleStake} className="space-y-6 mt-6">
                <div>
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

                    {stakeAmount && Number(stakeAmount) > 0 && (
                      <div className="mt-3 p-3 bg-[#242323] rounded-lg flex flex-col">
                        <span className="text-[#A2A2A2] text-sm"> Estimated TG </span>
                        <span className="text-white text-xl font-bold mt-1 tracking-wider">
                          {(Number(stakeAmount) * 1000).toFixed(2)} TG
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    disabled={
                      isStaking ||
                      !stakeAmount ||
                      Number(stakeAmount) >
                      Number(accountBalance?.formatted || 0)
                    }
                    className="relative bg-[#FFFFFF] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full"
                  >
                    <span
                      className={`font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base ${isStaking ||
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
                          : "Top Up TG"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!isWalletInstalled && showModal && (
          <WalletModal onClose={() => setShowModal(false)} />
        )}

        {deleteConfirmationVisible && (
          <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <div className="bg-[#141414] p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md">
              <h2 className="text-2xl font-actayRegular  mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                Confirm Delete
              </h2>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this job? This action cannot be undone.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleDeleteJob(jobToDelete)}
                  className="px-0 py-3 bg-[#FF5757] rounded-full font-semibold hover:bg-[#ff4444] transition-all duration-300 w-full"
                >
                  <span className="">
                    Delete
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmationVisible(false);
                    setJobToDelete(null);
                  }}
                  className="px-0 py-3 bg-white/10 rounded-full font-semibold hover:bg-white/20 transition-all duration-300 w-full"
                >
                  <span className="">
                    Cancel
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;