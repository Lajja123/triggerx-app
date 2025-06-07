//index.js
import React, { useEffect, useRef, useState } from "react";
import { PageHeader } from "./components/PageHeader";
import { useJobCreation } from "./hooks/useJobCreation";
import { ChevronDown } from "lucide-react";
import { TimeframeInputs } from "./components/TimeframeInputs";
import { useTimeManagement } from "./hooks/useTimeManagement";
import { TimeIntervalInputs } from "./components/TimeIntervalInputs";
import { ContractDetails } from "./components/ContractDetails";
import { useContractInteraction } from "./hooks/useContractInteraction";
import { EstimatedFeeModal } from "./components/EstimatedFeeModal";
import { useStakeRegistry } from "./hooks/useStakeRegistry";
import { useAccount } from "wagmi";
import { optimismSepolia, baseSepolia } from "wagmi/chains";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
// import ProcessModal from "./components/ProcessModel";
import BalanceMaintainer from "../../components/BalanceMaintainer";
import PriceOracle from "../../components/PriceOracle";
import StakingRewards from "../../components/StakingRewards";
import timeBasedGif from "../../assets/time-based.gif";
import conditionBasedGif from "../../assets/condition-based.gif";
import eventBasedGif from "../../assets/event-based.gif";
import templates from "../../data/templates.json";
import eventBasedSvg from "../../assets/event-based.svg";
import conditionBasedSvg from "../../assets/condition-based.svg";
import timeBasedSvg from "../../assets/time-based.svg";

import DeleteConfirmationButton from "./components/DeleteConfirmationButton";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE; // 3600
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR; // 86400

const networkIcons = {
  [optimismSepolia.name]: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Optimism SVG path */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28ZM12.5021 19.1895C11.7876 19.1895 11.2022 19.0214 10.7458 18.6851C10.2955 18.3429 10.0703 17.8565 10.0703 17.2261C10.0703 17.094 10.0853 16.9318 10.1153 16.7397C10.1934 16.3074 10.3045 15.788 10.4486 15.1816C10.8569 13.5304 11.9107 12.7048 13.6099 12.7048C14.0723 12.7048 14.4866 12.7828 14.8528 12.9389C15.2191 13.089 15.5073 13.3172 15.7175 13.6234C15.9276 13.9236 16.0327 14.2839 16.0327 14.7042C16.0327 14.8303 16.0177 14.9894 15.9877 15.1816C15.8976 15.7159 15.7895 16.2353 15.6634 16.7397C15.4533 17.5623 15.09 18.1778 14.5736 18.586C14.0572 18.9883 13.3668 19.1895 12.5021 19.1895ZM12.6282 17.8925C12.9645 17.8925 13.2496 17.7935 13.4838 17.5953C13.724 17.3972 13.8951 17.094 13.9972 16.6857C14.1353 16.1212 14.2404 15.6289 14.3125 15.2086C14.3365 15.0825 14.3485 14.9534 14.3485 14.8213C14.3485 14.2749 14.0632 14.0017 13.4929 14.0017C13.1566 14.0017 12.8684 14.1007 12.6282 14.2989C12.394 14.4971 12.2259 14.8003 12.1238 15.2086C12.0158 15.6109 11.9077 16.1032 11.7996 16.6857C11.7756 16.8057 11.7636 16.9318 11.7636 17.0639C11.7636 17.6164 12.0518 17.8925 12.6282 17.8925ZM16.2939 19.0362C16.3299 19.0782 16.381 19.0993 16.447 19.0993H17.6719C17.7319 19.0993 17.789 19.0782 17.843 19.0362C17.897 18.9941 17.9301 18.9401 17.9421 18.8741L18.3564 16.9016H19.5723C20.3589 16.9016 20.9773 16.7365 21.4277 16.4063C21.884 16.076 22.1872 15.5656 22.3373 14.8751C22.3734 14.713 22.3914 14.5569 22.3914 14.4068C22.3914 13.8844 22.1872 13.4851 21.7789 13.2089C21.3766 12.9327 20.8422 12.7946 20.1757 12.7946H17.78C17.7199 12.7946 17.6629 12.8156 17.6088 12.8576C17.5548 12.8997 17.5218 12.9537 17.5098 13.0198L16.2669 18.8741C16.2549 18.9341 16.2638 18.9881 16.2939 19.0362ZM20.2928 15.4515C20.1067 15.5896 19.8875 15.6587 19.6354 15.6587H18.5996L18.9418 14.0465H20.0226C20.2688 14.0465 20.4429 14.0945 20.545 14.1906C20.6471 14.2807 20.6981 14.4128 20.6981 14.5869C20.6981 14.665 20.6891 14.755 20.6711 14.8571C20.6111 15.1153 20.485 15.3134 20.2928 15.4515Z"
        fill="currentColor"
      />
    </svg>
  ),
  [baseSepolia.name]: (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.98995 14C11.3092 14 14 11.3137 14 8C14 4.6863 11.3092 2 7.98995 2C4.84104 2 2.25776 4.41765 2.0009 7.49506H10.9195V8.49416H2C2.25171 11.5767 4.83736 14 7.98995 14Z"
        fill="currentColor"
      />
    </svg>
  ),
};

const supportedNetworks = [optimismSepolia, baseSepolia];

const useFormKeyboardNavigation = () => {
  // This ref will help us avoid re-focusing the first input when unnecessary

  const handleKeyDown = (event) => {
    // Only process if the key is Enter and not in a textarea
    if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
      event.preventDefault(); // Prevent form submission

      // Get all focusable elements in the form
      const form = event.target.closest("form");
      if (!form) return;

      const focusableElements = [
        ...form.querySelectorAll(
          'input, select, button, [tabindex]:not([tabindex="-1"]), [role="button"]'
        ),
      ].filter(
        (el) =>
          !el.disabled && el.style.display !== "none" && el.type !== "submit"
      );

      // Find current element index
      const currentIndex = focusableElements.indexOf(event.target);

      // If it's a dropdown trigger element, open the dropdown
      if (
        event.target.getAttribute("role") === "button" ||
        event.target.closest('[role="button"]') ||
        event.target.classList.contains("cursor-pointer")
      ) {
        // Simulate click to open dropdown
        event.target.click();
        return;
      }

      // Move to next element if available
      if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
      }
    }
  };
  return { handleKeyDown };
};

// trigger option
const options = [
  {
    value: "1",
    label: "Time-based Trigger",
    icon: timeBasedSvg,
    selectedIcon: timeBasedGif,
  },
  {
    value: "2",
    label: "Condition-based Trigger",
    icon: conditionBasedSvg,
    selectedIcon: conditionBasedGif,
  },
  {
    value: "3",
    label: "Event-based Trigger",
    icon: eventBasedSvg,
    selectedIcon: eventBasedGif,
  },
];

function extractFunctions(abi) {
  // console.log("Extracting functions from ABI:", abi); // Optional logging
  try {
    let abiArray;
    if (typeof abi === "string") {
      try {
        abiArray = JSON.parse(abi);
      } catch (e) {
        // console.error("Invalid ABI string format for extraction:", e); // Optional logging
        // If parsing fails but it's a non-empty string, maybe it's just bad JSON?
        // Return empty for safety if parsing fails.
        return [];
        // throw new Error("Invalid ABI string format");
      }
    } else if (Array.isArray(abi)) {
      abiArray = abi;
    } else if (abi && typeof abi === "object" && !Array.isArray(abi)) {
      // Handle cases where ABI might be passed as a single object instead of array
      // This might happen if the JSON string was just '{}'
      // Or if the location.state accidentally passed an object directly
      // Check if it looks like an ABI entry
      if (abi.type && abi.name) {
        abiArray = [abi];
      } else {
        // console.warn("Received non-array, non-string ABI object, attempting to treat as array:", abi);
        // Try to be lenient if possible, otherwise return empty
        abiArray = Array.isArray(Object.values(abi)) ? Object.values(abi) : [];
      }
    } else {
      // console.warn("ABI is not an array, object, or valid JSON string:", abi);
      // throw new Error("ABI must be an array, object, or valid JSON string");
      return []; // Return empty if type is unexpected
    }

    // Ensure abiArray is actually an array before filtering
    if (!Array.isArray(abiArray)) {
      // console.error("Processed ABI is not an array:", abiArray);
      // throw new Error("Processed ABI is not an array");
      return [];
    }

    const functions = abiArray
      .filter(
        (item) =>
          item && // Check if item exists
          item.type === "function" &&
          (item.stateMutability === "nonpayable" || // Filter for writable
            item.stateMutability === "payable")
      )
      .map((func) => ({
        name: func.name || "unnamed",
        // Ensure inputs/outputs are arrays even if missing in source ABI
        inputs: Array.isArray(func.inputs) ? func.inputs : [],
        outputs: Array.isArray(func.outputs) ? func.outputs : [],
        stateMutability: func.stateMutability || "nonpayable", // Default stateMut.
        // Optional fields, provide defaults if needed
        payable: func.payable === true, // Ensure boolean
        constant: func.constant === true, // Ensure boolean
      }));

    // console.log("Extracted writable functions:", functions); // Optional logging
    return functions;
  } catch (error) {
    console.error("Error processing ABI:", error, "Input ABI:", abi);
    return []; // Return empty array on error
  }
}

function CreateJobPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState(
    supportedNetworks[0].name
  );
  const [isLoading, setIsLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [triggerChainId, setTriggerChainId] = useState(supportedNetworks[0].id);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [linkedJobs, setLinkedJobs] = useState({});
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [jobDetails, setJobDetails] = useState([]);
  const { address, isConnected } = useAccount();
  const formRef = useRef(null);
  const { handleKeyDown } = useFormKeyboardNavigation();
  const [contractDetails, setContractDetails] = useState({});
  const [recurring, setRecurring] = useState(true);
  const baseUrl = "https://app.triggerx.network";
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Function to handle job selection
  const handleJobSelect = (template) => {
    setSelectedJob(template);
    // Update URL with template parameter
    setSearchParams({ template: template.id });

    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const templateSection = document.querySelector(".w-full.lg\\:w-3\\/4");
        if (templateSection) {
          templateSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  };

  // Function to render the appropriate component based on selected template
  const renderSelectedTemplate = () => {
    if (!selectedJob) return null;

    switch (selectedJob.id) {
      case "balance-maintainer":
        return <BalanceMaintainer setSelectedJob={setSelectedJob} />;
      case "price-oracle":
        return <PriceOracle setSelectedJob={setSelectedJob} />;
      case "staking-rewards":
        return <StakingRewards setSelectedJob={setSelectedJob} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    // Update meta tags when activeTab changes
    document.title = "TriggerX | Build";
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");

    // Update Open Graph meta tags
    document
      .querySelector('meta[property="og:title"]')
      .setAttribute("content", "TriggerX | Build");
    document
      .querySelector('meta[property="og:description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");
    document
      .querySelector('meta[property="og:image"]')
      .setAttribute("content", `${baseUrl}/images/build-og.png`);
    document
      .querySelector('meta[property="og:url"]')
      .setAttribute("content", `${baseUrl}`);

    // Update Twitter Card meta tags
    document
      .querySelector('meta[name="twitter:title"]')
      .setAttribute("content", "TriggerX | Build");
    document
      .querySelector('meta[name="twitter:description"]')
      .setAttribute("content", "Automate Tasks Effortlessly");
    document
      .querySelector('meta[name="twitter:image"]')
      .setAttribute("content", `${baseUrl}/images/build-og.png`);
  }, [baseUrl]);

  const eventdropdownRef = useRef(null);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        eventdropdownRef.current &&
        !eventdropdownRef.current.contains(event.target)
      ) {
        setIsEventOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownRef = useRef(null);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNetworkOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [processSteps, setProcessSteps] = useState([
    { id: 1, text: "Updating Database", status: "pending" },
    { id: 2, text: "Validating Job", status: "pending" },
    { id: 3, text: "Calculating Fees", status: "pending" },
  ]);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const resetProcessSteps = () => {
    setProcessSteps([
      { id: 1, text: "Updating Database", status: "pending" },
      { id: 2, text: "Validating Job", status: "pending" },
      { id: 3, text: "Calculating Fees", status: "pending" },
    ]);
  };

  const handleLinkJob = (jobType) => {
    setLinkedJobs((prevJobs) => {
      const existingJobs = prevJobs[jobType] || [];
      if (existingJobs.length < 3) {
        const newJobId = existingJobs.length + 1;

        setContractDetails((prevDetails) => ({
          ...prevDetails,
          [jobType]: {
            ...prevDetails[jobType], // Keep existing jobs
            [newJobId]: {
              // New linked job
              contractAddress: "",
              contractABI: "",
              functions: [],
              targetFunction: "",
              argumentType: "static",
              argsArray: [],
              ipfsCodeUrl: "",
            },
          },
        }));

        return {
          ...prevJobs,
          [jobType]: [...existingJobs, newJobId],
        };
      }
      return prevJobs;
    });
  };

  const handleDeleteLinkedJob = (e, jobType, jobId) => {
    e.preventDefault();
    setLinkedJobs((prevJobs) => {
      const updatedJobs = {
        ...prevJobs,
        [jobType]: prevJobs[jobType].filter((id) => id !== jobId),
      };

      // Re-index the remaining jobs
      if (updatedJobs[jobType]) {
        updatedJobs[jobType] = updatedJobs[jobType].map(
          (id, index) => index + 1
        ); // Re-index from 1
      }

      // If there are no linked jobs left for this jobType, remove the jobType entry
      if (updatedJobs[jobType]?.length === 0) {
        delete updatedJobs[jobType];
      }

      return updatedJobs;
    });

    setContractDetails((prevDetails) => {
      const updatedDetails = {
        ...prevDetails,
        [jobType]: { ...prevDetails[jobType] },
      };

      const jobIds = Object.keys(updatedDetails[jobType])
        .filter((key) => key !== "main")
        .sort((a, b) => parseInt(a) - parseInt(b));

      if (jobIds.length === 0) {
        return updatedDetails; // No linked jobs, nothing to do
      }

      // Find the last valid index
      const lastIndex = parseInt(jobIds[jobIds.length - 1]);

      // Swap details
      const temp = updatedDetails[jobType][jobId];
      updatedDetails[jobType][jobId] = updatedDetails[jobType][lastIndex];
      updatedDetails[jobType][lastIndex] = temp;

      // Now delete the last index
      delete updatedDetails[jobType][lastIndex];

      // If there are no linked jobs left for this jobType, remove the jobType entry
      if (
        Object.keys(updatedDetails[jobType]).length === 1 &&
        updatedDetails[jobType]["main"] !== undefined
      ) {
        //Only 'main' is left
        // delete updatedDetails[jobType];
      }

      return updatedDetails;
    });
  };

  const {
    timeframe,
    setTimeframe,
    timeframeInSeconds,
    setTimeframeInSeconds,
    timeInterval,
    setTimeInterval,
    intervalInSeconds,
    setIntervalInSeconds,
    errorFrame,
    setErrorFrame,
    errorInterval,
    setErrorInterval,
    errorFrameRef,
    errorIntervalRef,
    handleTimeframeChange,
    handleTimeIntervalChange,
  } = useTimeManagement();

  const {
    jobType,
    setJobType,
    estimateFee,
    estimatedFee,
    // setEstimatedFee,
    isSubmitting,
    isLoading: jobCreationIsLoading,
    setIsLoading: setJobCreationIsLoading,
    userBalance,
    isModalOpen,
    setIsModalOpen,
    handleSubmit,
    isJobCreated,
    handleDashboardClick,
  } = useJobCreation();

  const { stakeRegistryAddress, stakeRegistryImplAddress, stakeRegistryABI } =
    useStakeRegistry();

  useEffect(() => {
    if (location.state) {
      console.log("Received state from previous page:", location.state);

      const {
        jobType: incomingJobType,
        jobTitle: incomingJobTitle,
        contractAddress: incomingContractAddress,
        abi: incomingAbiString,
        timeframe: incomingTimeframe,
        timeInterval: incomingTimeInterval,
        argumentType: incomingArgumentType,
        ipfsCodeUrl: incomingIpfsCodeUrl,
      } = location.state;

      // 0. set job title
      if (incomingJobTitle !== undefined) {
        setJobTitle(incomingJobTitle); // Ensure it's a number
        setSelectedJob(null); // Clear selected job when job type is set
      }

      // 1. Set Job Type
      if (incomingJobType !== undefined) {
        setJobType(Number(incomingJobType)); // Ensure it's a number
        setSelectedJob(null); // Clear selected job when job type is set
      }

      // 2. Set Timeframe and recalculate seconds
      if (incomingTimeframe) {
        setTimeframe(incomingTimeframe);
        // --- Updated Calculation ---
        const tfSeconds =
          (incomingTimeframe.days || 0) * SECONDS_PER_DAY +
          (incomingTimeframe.hours || 0) * SECONDS_PER_HOUR +
          (incomingTimeframe.minutes || 0) * SECONDS_PER_MINUTE;
        setTimeframeInSeconds(tfSeconds);
        setErrorFrame(""); // Clear any previous errors
      }

      // 3. Set Time Interval (only if jobType is 1) and recalculate seconds
      // Check the actual incomingJobType value
      if (Number(incomingJobType) === 1 && incomingTimeInterval) {
        setTimeInterval(incomingTimeInterval);
        // Recalculate intervalInSeconds based on the incoming object
        const tiSeconds =
          incomingTimeInterval.hours * 3600 +
          incomingTimeInterval.minutes * 60 +
          incomingTimeInterval.seconds;
        setIntervalInSeconds(tiSeconds);
        setErrorInterval(""); // Clear any previous errors
      } else {
        // If job type is not 1, reset time interval (optional, depends on desired behavior)
        // setTimeInterval({ hours: 0, minutes: 0, seconds: 0 });
        // setIntervalInSeconds(0);
      }

      // 4. Set Contract Details (Address and ABI) for the 'main' job
      // We use the incomingJobType directly here to ensure the key is correct
      if (
        incomingContractAddress &&
        incomingAbiString &&
        incomingJobType !== undefined
      ) {
        const extractedFunctions = extractFunctions(incomingAbiString);

        let defaultTargetFunctionSignature = "";
        // If writable functions exist, select the first one's signature

        if (extractedFunctions && extractedFunctions.length > 0) {
          const firstFunc = extractedFunctions[0];
          // Construct the full signature (e.g., "functionName(type1,type2)")
          defaultTargetFunctionSignature = `${firstFunc.name}(${firstFunc.inputs.map((input) => input.type).join(",")})`;
        }
        let argumentType = "static"; // Default to static arguments
        let finalIpfsUrl = "";

        if (incomingArgumentType) {
          argumentType = incomingArgumentType;
        }

        if (incomingIpfsCodeUrl) {
          // Check if it was sent (even if empty string)
          finalIpfsUrl = incomingIpfsCodeUrl;
        }

        // Update the contractDetails state for the specific job type's 'main' entry
        // Using functional update ensures we're working with the latest state
        setContractDetails((prevDetails) => {
          const currentJobTypeKey = Number(incomingJobType);

          const newMainDetails = {
            ...(prevDetails[currentJobTypeKey]?.main || {}),
            contractAddress: incomingContractAddress,
            contractABI: incomingAbiString,
            functions: extractedFunctions,
            // Pre-select the maintainBalances function
            targetFunction: defaultTargetFunctionSignature, // Set the default function
            argumentType: argumentType,
            argsArray: [],
            ipfsCodeUrl: finalIpfsUrl,
          };
          // Return the updated state object
          return {
            ...prevDetails,
            [currentJobTypeKey]: {
              ...(prevDetails[currentJobTypeKey] || {}),
              main: newMainDetails,
            },
          };
        });
      }

      // This prevents the form from being re-filled if the user navigates back and forth
      // or refreshes the page. Use with caution if you need the state for other purposes.
      navigate(".", { replace: true, state: null });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [
    location.state,
    setJobType,
    setJobTitle,
    setTimeframe,
    setTimeframeInSeconds, // Add dependency
    setTimeInterval,
    setIntervalInSeconds, // Add dependency
    setContractDetails,
    setErrorFrame, // Add dependency
    setErrorInterval, // Add dependency
    navigate, // Add dependency if using navigate to clear state
  ]);

  // Add event listener for popstate events
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        // Process the state change
        const {
          jobType,
          jobTitle,
          contractAddress,
          abi,
          timeframe,
          timeInterval,
          argumentType,
          ipfsCodeUrl,
        } = event.state;

        if (jobType !== undefined) {
          setJobType(Number(jobType));
          setSelectedJob(null);
        }
        if (jobTitle !== undefined) {
          setJobTitle(jobTitle);
          setSelectedJob(null);
        }

        if (timeframe) {
          setTimeframe(timeframe);
          const tfSeconds =
            (timeframe.days || 0) * SECONDS_PER_DAY +
            (timeframe.hours || 0) * SECONDS_PER_HOUR +
            (timeframe.minutes || 0) * SECONDS_PER_MINUTE;
          setTimeframeInSeconds(tfSeconds);
        }

        if (timeInterval && Number(jobType) === 1) {
          setTimeInterval(timeInterval);
          const tiSeconds =
            timeInterval.hours * 3600 +
            timeInterval.minutes * 60 +
            timeInterval.seconds;
          setIntervalInSeconds(tiSeconds);
        }

        if (contractAddress && abi) {
          const extractedFunctions = extractFunctions(abi);

          let defaultTargetFunctionSignature = "";
          if (extractedFunctions && extractedFunctions.length > 0) {
            const firstFunc = extractedFunctions[0];
            defaultTargetFunctionSignature = `${firstFunc.name}(${firstFunc.inputs.map((input) => input.type).join(",")})`;
          }
          const defaultArgumentType = "static";

          console.log(
            "Default Target Function (popstate):",
            defaultTargetFunctionSignature
          ); // Debug log
          console.log("Default Argument Type (popstate):", defaultArgumentType); // Debug log

          let argType = "static"; // Default to static arguments
          let finalIpfsUrl = "";

          if (argumentType) {
            argType = argumentType;
          }

          if (ipfsCodeUrl) {
            // Check if it was sent (even if empty string)
            finalIpfsUrl = ipfsCodeUrl;
          }

          setContractDetails((prevDetails) => ({
            ...prevDetails,
            [Number(jobType)]: {
              main: {
                contractAddress: contractAddress,
                contractABI: abi,
                functions: extractedFunctions,
                // Pre-select the maintainBalances function
                targetFunction: defaultTargetFunctionSignature,
                argumentType: argType,
                argsArray: [],
                ipfsCodeUrl: finalIpfsUrl,
              },
            },
          }));
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    setJobType,
    setJobTitle,
    setTimeframe,
    setTimeframeInSeconds,
    setTimeInterval,
    setIntervalInSeconds,
    setContractDetails,
  ]);

  const handleContractDetailChange = (jobType, jobKey, field, value) => {
    setContractDetails((prevDetails) => ({
      ...prevDetails,
      [jobType]: {
        ...prevDetails[jobType],
        [jobKey]: {
          ...prevDetails[jobType]?.[jobKey],
          [field]: value,
        },
      },
    }));
  };

  useEffect(() => {
    setContractDetails((prevDetails) => {
      // Only initialize if the entry for the *current* jobType doesn't exist yet.
      // The location.state useEffect might have already created it.
      if (!prevDetails[jobType]) {
        return {
          ...prevDetails,
          [jobType]: {
            main: {
              contractAddress: "",
              contractABI: "",
              functions: [],
              targetFunction: "",
              argumentType: "static",
              argsArray: [],
              ipfsCodeUrl: "",
            },
          },
        };
      }
      // If it already exists (potentially from location.state), just return the previous details.
      return prevDetails;
    });
  }, [jobType]);

  const eventContractInteraction = useContractInteraction("job-3");

  const handleFormSubmit = async (e, jobType) => {
    e.preventDefault();

    if (
      timeframe.days === 0 &&
      timeframe.hours === 0 &&
      timeframe.minutes === 0
    ) {
      setErrorFrame("Please set a valid timeframe before submitting.");

      setTimeout(() => {
        errorFrameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100); // Small delay ensures it happens after state updates

      return;
    }
    if (jobType === 1) {
      if (
        (timeInterval.hours === 0 &&
          timeInterval.minutes === 0 &&
          timeInterval.seconds === 0) ||
        timeInterval.hours * 3600 +
        timeInterval.minutes * 60 +
        timeInterval.seconds <
        30
      ) {
        setErrorInterval(
          "Please set a valid time interval of at least 30 seconds before submitting."
        );
        setTimeout(() => {
          errorIntervalRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
        return;
      }
    }

    try {
      const allJobsDetails = [];
      const mainJobDetails = contractDetails[jobType]?.["main"];

      // Calculate taskdefinitionid and argType based on job type and argument type
      const getTaskDefinitionId = (argumentType) => {
        return argumentType === "static"
          ? jobType === 1
            ? 1
            : jobType === 2
              ? 5
              : 3
          : jobType === 1
            ? 2
            : jobType === 2
              ? 6
              : 4;
      };

      const getArgType = (argumentType) => (argumentType === "static" ? 0 : 1);

      // Add main job details if available
      if (mainJobDetails) {
        const taskdefinitionid = getTaskDefinitionId(
          mainJobDetails.argumentType
        );
        const argType = getArgType(mainJobDetails.argumentType);

        allJobsDetails.push({
          jobType: jobType,
          job_title: jobTitle,
          user_address: address,
          stake_amount: 0,
          token_amount: 0,
          task_definition_id: taskdefinitionid,
          priority: 1,
          security: 1,
          time_frame: timeframeInSeconds,
          time_interval: intervalInSeconds,
          recurring: recurring,
          trigger_chain_id: triggerChainId.toString(),
          trigger_contract_address:
            eventContractInteraction.contractAddress || "NULL",
          trigger_event: "NULL",
          script_ipfs_url: mainJobDetails.ipfsCodeUrl || "",
          script_target_function: "trigger",
          target_chain_id: triggerChainId.toString(),
          target_contract_address: mainJobDetails.contractAddress,
          target_function: mainJobDetails.targetFunction?.split("(")[0],
          arg_type: argType,
          arguments: mainJobDetails.argsArray,
          script_trigger_function: "action",
          hasABI: !!mainJobDetails.contractABI,
          abi: mainJobDetails.contractABI,
        });
      }

      // Collect details for linked jobs
      if (linkedJobs[jobType]) {
        for (const jobId of linkedJobs[jobType]) {
          const linkedJobDetails = contractDetails[jobType]?.[jobId];

          if (linkedJobDetails) {
            const taskdefinitionid = getTaskDefinitionId(
              linkedJobDetails.argumentType
            );
            const argType = getArgType(linkedJobDetails.argumentType);

            allJobsDetails.push({
              jobType: jobType,
              job_title: jobTitle,
              user_address: address,
              stake_amount: 0,
              token_amount: 0,
              task_definition_id: taskdefinitionid,
              priority: 1,
              security: 1,
              time_frame: timeframeInSeconds,
              time_interval: intervalInSeconds,
              recurring: recurring,
              trigger_chain_id: triggerChainId.toString(),
              trigger_contract_address:
                eventContractInteraction.contractAddress || "NULL",
              trigger_event: "NULL",
              script_ipfs_url: linkedJobDetails.ipfsCodeUrl || "",
              script_target_function: "trigger",
              target_chain_id: triggerChainId.toString(),
              target_contract_address: linkedJobDetails.contractAddress,
              target_function: linkedJobDetails.targetFunction,
              arg_type: argType,
              arguments: linkedJobDetails.argsArray,
              script_trigger_function: "action",
              hasABI: !!linkedJobDetails.contractABI,
              abi: linkedJobDetails.contractABI,
            });
          }
        }
      }
      setIsLoading(true);
      console.log("Job Details", allJobsDetails);
      setJobDetails(allJobsDetails);

      const codeUrls = allJobsDetails.map((job) => job.script_ipfs_url);

      try {
        resetProcessSteps();
        setShowProcessModal(true);

        // Step 1: Update Database
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 1 ? { ...step, status: "pending" } : step
          )
        );

        // Wait for 1.5 seconds to simulate database update
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mark Database step as completed
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 1 ? { ...step, status: "completed" } : step
          )
        );

        // Wait for 500ms before starting next step
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Validate Job
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 2 ? { ...step, status: "pending" } : step
          )
        );

        // Wait for 1.5 seconds to simulate validation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mark Validation step as completed
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 2 ? { ...step, status: "completed" } : step
          )
        );

        // Wait for 500ms before starting next step
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 3: Calculate Fees
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 3 ? { ...step, status: "pending" } : step
          )
        );

        // Ensure estimateFee is awaited properly
        await estimateFee(
          timeframeInSeconds,
          intervalInSeconds,
          codeUrls,
          processSteps,
          setProcessSteps
        );

        // Ensure UI updates and animation completes
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mark Fee Calculation step as completed only after actual calculation
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 3 ? { ...step, status: "completed" } : step
          )
        );

        // await new Promise((resolve) => setTimeout(resolve, 1000));
        if (processSteps.every((step) => step.status === "completed")) {
          setIsModalOpen(true);
          setShowProcessModal(false);
          toast.success("Job created successfully !");
        }
      } catch (error) {
        console.error("Error during fee estimation:", error);
        setProcessSteps((prev) =>
          prev.map((step) =>
            step.id === 3 ? { ...step, status: "error" } : step
          )
        );
        toast.error("Failed to estimate fee!");
      }
    } catch (error) {
      console.error("Error during job creation:", error);
      setProcessSteps((prev) =>
        prev.map((step) =>
          step.status === "pending" ? { ...step, status: "error" } : step
        )
      );
      toast.error("Failed to create job!");
    }
  };

  const handleJobTypeChange = (e, newJobType) => {
    e.preventDefault();
    setJobType(Number(newJobType));
    // Clear URL parameters when switching to custom job
    setSearchParams({});
  };

  // Add this effect after other useEffect hooks
  useEffect(() => {
    const templateId = searchParams.get("template");
    if (templateId) {
      const template = templates.templates.find((t) => t.id === templateId);
      if (template) {
        setSelectedJob(template);
      }
    }
  }, [searchParams]);

  return (
    <div>
      {/* <ProcessModal isOpen={showProcessModal} steps={processSteps} /> */}

      <div className="min-h-screen text-white pt-10 md:pt-20 lg:pt-32 pb-20 mt-[5rem] lg:mt-[9rem] relative">
        {/* Background gradients */}
        <div className="fixed inset-0  pointer-events-none" />
        <div className="fixed top-0 left-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

        <div className="mx-auto px-6 relative z-30">
          <PageHeader />

          <div className="flex flex-col xl:flex-row lg:flex-col gap-6 justify-center max-w-[1600px] mx-auto">
            {/* Sidebar with actual posts */}
            <div className="w-full xl:w-1/3 space-y-4">
              {/* Points System Box */}
              <div className="bg-[#141414] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Points System
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm md:text-md bg-[#F8FF7C] text-black w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                      20
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300">
                      Points for every custom job you create
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className=" text-sm md:text-md bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                      10
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300">
                      Points for every job created via a template
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-3 pt-3 border-t border-white/10">
                    Earn more by building more. Every job counts.
                  </p>
                </div>
              </div>

              {/* Template List Box */}
              <div className="bg-[#141414] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 h-fit">
                <div className="flex justify-between gap-3 items-center mb-6">
                  <h2 className="text-base md:text-lg font-semibold">
                    Template
                  </h2>
                  {/* <button

                    className="bg-white text-[#0F0F0F] px-4 py-2 rounded-full  text-md"
                  >

                  </button> */}
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setJobType(null);
                      // Clear the URL parameters to return to base URL
                      setSearchParams({});

                      // Reset timeframe and interval to initial values
                      setTimeframe({ days: 0, hours: 0, minutes: 0 });
                      setTimeframeInSeconds(0);

                      setTimeInterval({ hours: 0, minutes: 0, seconds: 0 });
                      setIntervalInSeconds(0);

                      // Clear contract details
                      setContractDetails({});

                      // Add smooth scrolling for small screens
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          const customJobSection = document.querySelector(
                            ".w-full.lg\\:w-3\\/4"
                          );
                          if (customJobSection) {
                            customJobSection.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }, 100);
                      }

                      // Add animation if wallet is not connected
                      if (!isConnected) {
                        setShouldAnimate(true);
                        setTimeout(() => setShouldAnimate(false), 500);
                      }
                    }}
                    className={`relative bg-[#222222] text-[#000000] border ${!selectedJob ? "text-white opacity-80 cursor-not-allowed" : "border-[#222222] group"} px-2 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-300`}
                  >
                    <span
                      className={`absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out ${!selectedJob ? "" : "group-hover:translate-y-2"}`}
                    ></span>
                    <span
                      className={`${!selectedJob ? "bg-white opacity-50" : "bg-white group-hover:translate-y-0"} absolute inset-0 rounded-full scale-100 translate-y-0 transition-all duration-300`}
                    ></span>
                    <span
                      className={`bottom-[1px] font-actayRegular relative z-10 px-0 py-1 sm:py-3 sm:px-3 md:px-6 lg:px-0 xl:px-2 rounded-full translate-y-2 ${!selectedJob ? "" : "group-hover:translate-y-0"} transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base text-nowrap`}
                    >
                      Create Custom Job
                    </span>
                  </button>
                </div>
                <div className="space-y-2">
                  {templates.templates.map((template) => (
                    <div
                      className={`lg:p-6 md:p-6 p-4 rounded-lg transition-all duration-300 cursor-pointer ${selectedJob?.id === template.id
                        ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border-2 border-white shadow-lg "
                        : "bg-[#202020] border border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      onClick={() => handleJobSelect(template)}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <h4
                          className={`break-all	 text-xs md:text-base font-medium lg:w-[70%] ${selectedJob?.id === template.id ? "text-white" : ""
                            }`}
                        >
                          {template.title}
                        </h4>
                        <span
                          className={`text-xs md:text-sm px-4 py-2 rounded-full bg-[#FBF197] text-[#202020] traking-wider`}
                        >
                          Use
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full xl:w-3/4">
              {selectedJob ? (
                <div className="bg-[#141414] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  {renderSelectedTemplate()}
                </div>
              ) : (
                <form
                  ref={formRef}
                  onSubmit={(e) => handleFormSubmit(e, jobType)}
                  onKeyDown={handleKeyDown} // Add the keydown handler to the entire form
                  className="w-full max-w-[1600px]"
                >
                  {!isConnected ? (
                    <div className="bg-[#141414] backdrop-blur-xl rounded-2xl px-6 py-10 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8 z-50">
                      <label className="block text-sm sm:text-base font-medium text-gray-300 mb-6 text-nowrap">
                        Trigger Types
                      </label>
                      <div className="flex flex-wrap md:flex-nowrap gap-4 justify-between w-[95%] mx-auto">
                        {options.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => {
                              setShouldAnimate(true);
                              setTimeout(() => setShouldAnimate(false), 500);
                            }}
                            className="bg-white/5 border border-white/10 text-nowrap relative flex flex-wrap flex-col items-center justify-center w-full md:w-[33%] gap-2 px-4 pb-4 pt-8 rounded-lg transition-all duration-300 text-xs sm:text-sm opacity-50 cursor-not-allowed"
                          >
                            <div className="absolute top-2 left-2 rounded-full w-3 h-3 border"></div>
                            <img
                              src={option.icon}
                              alt={option.label}
                              className="w-auto h-8"
                            />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col items-center justify-center lg:h-[200px] h-[150px] text-[#A2A2A2]">
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg "
                          className="mb-3"
                          stroke=""
                          style={{
                            transform: shouldAnimate
                              ? "scale(1.1)"
                              : "scale(1)",
                            transition: "transform 0.3s ease-in-out",
                          }}
                        >
                          <path
                            d="M12 17C12.2833 17 12.521 16.904 12.713 16.712C12.905 16.52 13.0007 16.2827 13 16C12.9993 15.7173 12.9033 15.48 12.712 15.288C12.5207 15.096 12.2833 15 12 15C11.7167 15 11.4793 15.096 11.288 15.288C11.0967 15.48 11.0007 15.7173 11 16C10.9993 16.2827 11.0953 16.5203 11.288 16.713C11.4807 16.9057 11.718 17.0013 12 17ZM12 13C12.2833 13 12.521 12.904 12.713 12.712C12.905 12.52 13.0007 12.2827 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22Z"
                            fill={shouldAnimate ? "#FFFFFF" : "#A2A2A2"}
                          />
                        </svg>
                        <p
                          style={{
                            color: shouldAnimate ? "#FFFFFF" : "",
                            transform: shouldAnimate
                              ? "scale(1.1)"
                              : "scale(1)",
                            transition: "transform 0.3s ease-in-out",
                          }}
                          className="text-sm lg:text-lg md:text-lg mb-2"
                        >
                          Wallet Not Connected
                        </p>
                        <p
                          style={{
                            color: shouldAnimate ? "#FFFFFF" : "",
                            transform: shouldAnimate
                              ? "scale(1.1)"
                              : "scale(1)",
                            transition: "transform 0.4s ease-in-out",
                          }}
                          className="text-sm lg:text-md md:text-md text-center text-[#666666] mb-4 tracking-wide"
                        >
                          Please connect your wallet to interact with the
                          contract
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Job Type Selection */}
                      <div className="bg-[#141414] backdrop-blur-xl rounded-2xl px-6 py-10 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8">
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-6 text-nowrap">
                          Trigger Type
                        </label>
                        <div className="flex flex-wrap md:flex-nowrap gap-4 justify-between w-[95%] mx-auto">
                          {options.map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                if (!option.disabled) {
                                  handleJobTypeChange(e, option.value);
                                }
                              }}
                              className={`${Number(option.value) === jobType
                                ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white"
                                : "bg-white/5 border border-white/10 "
                                } text-nowrap relative flex flex-wrap flex-col items-center justify-center w-full md:w-[33%] gap-2 px-4 pb-4 pt-8 rounded-lg transition-all duration-300 text-xs sm:text-sm`}
                            >
                              <div
                                className={`${Number(option.value) === jobType
                                  ? "bg-white border border-white/10"
                                  : ""
                                  } absolute top-2 left-2 rounded-full w-3 h-3 border`}
                              ></div>
                              {Number(option.value) === jobType ? (
                                <img
                                  src={option.selectedIcon}
                                  alt={option.label}
                                  className="w-auto h-8"
                                />
                              ) : (
                                <img
                                  src={option.icon}
                                  alt={option.label}
                                  className="w-10 h-10"
                                />
                              )}
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {jobType ? (
                        <>
                          <div className="bg-[#141414] backdrop-blur-xl rounded-2xl px-6 py-10 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8 relative z-50">
                            {/* network */}

                            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                              <label className="block text-sm sm:text-base font-medium text-gray-300 text-nowrap">
                                Network
                              </label>
                              <div
                                ref={dropdownRef}
                                className="relative w-full md:w-[70%] xl:w-[80%] "
                              >
                                <li
                                  className="text-sm xs:text-sm sm:text-base w-full bg-[#1a1a1a] text-white py-3 px-4 rounded-lg cursor-pointer border border-white/10 flex items-center gap-5"
                                  onClick={() =>
                                    setIsNetworkOpen((prev) => !prev)
                                  }
                                >
                                  <p className="w-6 h-6 font-actayRegular text-xs xs:text-sm sm:text-base">
                                    {networkIcons[selectedNetwork]}
                                  </p>
                                  {selectedNetwork}
                                  <ChevronDown className="absolute top-3 right-4 text-white text-xs" />
                                </li>
                                {isNetworkOpen && (
                                  <p className="absolute top-14 w-full bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-lg">
                                    {supportedNetworks.map((network) => (
                                      <p
                                        key={network.id}
                                        className="py-3 px-4 hover:bg-[#333] cursor-pointer rounded-lg flex items-center gap-5 text-sm xs:text-sm sm:text-base"
                                        onClick={() => {
                                          setSelectedNetwork(network.name);
                                          setTriggerChainId(network.id);
                                          setIsNetworkOpen(false);
                                        }}
                                      >
                                        <p className="w-6 h-6 ">
                                          {networkIcons[network.name] || null}
                                        </p>
                                        {network.name}
                                      </p>
                                    ))}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-start justify-between gap-6">
                              <label className="text-sm sm:text-base font-medium text-gray-300 text-wrap overflow-hidden">
                                Job Title
                              </label>
                              <input
                                type="text"
                                id="jobtitle"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="Enter Job Title"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
                                required
                              />
                            </div>
                            <TimeframeInputs
                              timeframe={timeframe}
                              onTimeframeChange={handleTimeframeChange}
                              error={errorFrame}
                              ref={errorFrameRef}
                            />

                            {jobType === 1 && (
                              <TimeIntervalInputs
                                timeInterval={timeInterval}
                                onTimeIntervalChange={handleTimeIntervalChange}
                                error={errorInterval}
                                ref={errorIntervalRef}
                              />
                            )}

                            {(jobType === 2 || jobType === 3) && (
                              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <label className="block text-sm sm:text-base font-medium text-gray-300">
                                  Recurring
                                </label>
                                <div className="flex space-x-6 w-full md:w-[70%] xl:w-[80%]">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="recurring"
                                      value="yes"
                                      className="form-radio h-4 w-4 text-blue-500 accent-[#F8FF7C]"
                                      checked={recurring === true}
                                      onChange={() => setRecurring(true)}
                                    />
                                    <span className="ml-2 text-white">Yes</span>
                                  </label>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="recurring"
                                      value="no"
                                      className="form-radio h-4 w-4 text-blue-500 accent-[#F8FF7C]"
                                      checked={recurring === false}
                                      onChange={() => setRecurring(false)}
                                    />
                                    <span className="ml-2 text-white">No</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {jobType === 3 && (
                              <>
                                <div className="relative flex flex-col items-start justify-between gap-6">
                                  <label className="block text-sm sm:text-base font-medium text-gray-300 text-wrap overflow-hidden">
                                    Event Contract Address
                                  </label>
                                  <input
                                    type="text"
                                    id="contractAddress"
                                    value={
                                      eventContractInteraction.contractAddress
                                    }
                                    onChange={
                                      eventContractInteraction.handleContractAddressChange
                                    }
                                    placeholder="Your Contract address"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
                                    required
                                  />
                                </div>

                                {eventContractInteraction.contractAddress && (
                                  <>
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                      <h4 className="block text-sm sm:text-base font-medium text-gray-300 text-nowrap">
                                        Contract ABI
                                      </h4>
                                      <div className="w-[70%] xl:w-[80%] text-start ml-3">
                                        {eventContractInteraction.contractABI ? (
                                          <svg
                                            className="w-5 h-5 text-green-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        ) : (
                                          <div className="flex items-center ml-3">
                                            <h4 className="text-gray-400 pr-2 text-xs xs:text-sm sm:text-base">
                                              Not Available{" "}
                                            </h4>
                                            <h4 className="text-red-400 mt-[2px]">
                                              ✕
                                            </h4>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {!eventContractInteraction.contractABI && (
                                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <label
                                          htmlFor="manualEventABI"
                                          className="block text-sm sm:text-base font-medium text-gray-300 text-nowrap"
                                        >
                                          Manual ABI Input
                                        </label>
                                        <div className="w-full md:w-[70%] xl:w-[80%]">
                                          <textarea
                                            id="manualEventABI"
                                            value={
                                              eventContractInteraction.manualABI ||
                                              ""
                                            }
                                            onChange={(e) =>
                                              eventContractInteraction.handleManualABIChange(
                                                e
                                              )
                                            }
                                            placeholder={`Enter contract ABI manually (JSON format), e.g.
[
  {
    "inputs": [],
    "name": "eventName",
    "type": "event"
  }
]`}
                                            className="text-xs xs:text-sm sm:text-base w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none min-h-[260px]"
                                          />
                                          <p className="text-xs text-gray-400 mt-2">
                                            Enter the contract ABI in JSON
                                            format if automatic fetch fails
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {eventContractInteraction.contractABI && (
                                      <>
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                          <label
                                            htmlFor="targetEvent"
                                            className="block text-sm sm:text-base font-medium text-gray-300 text-nowrap"
                                          >
                                            Target event
                                          </label>

                                          <div className="relative w-full md:w-[70%] xl:w-[80%] z-50">
                                            <li
                                              className="break-all list-none w-full bg-[#1a1a1a] text-white py-3 px-4 rounded-lg cursor-pointer border border-white/10 flex items-center justify-between text-sm xs:text-sm sm:text-base"
                                              onClick={() =>
                                                setIsEventOpen(!isEventOpen)
                                              }
                                            >
                                              {eventContractInteraction.targetEvent ||
                                                "Select an event"}
                                              <ChevronDown className="text-white text-xs" />
                                            </li>
                                            {isEventOpen && (
                                              <div
                                                ref={eventdropdownRef}
                                                className="absolute top-14 w-full bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-lg"
                                              >
                                                {eventContractInteraction.events.map(
                                                  (func, index) => {
                                                    const signature = `${func.name
                                                      }(${func.inputs
                                                        .map((input) => input.type)
                                                        .join(",")})`;
                                                    return (
                                                      <li
                                                        key={index}
                                                        className="list-none break-all py-3 px-4 hover:bg-[#333] cursor-pointer rounded-lg text-sm xs:text-sm sm:text-base"
                                                        onClick={() => {
                                                          eventContractInteraction.handleEventChange(
                                                            {
                                                              target: {
                                                                value: signature,
                                                              },
                                                            }
                                                          );
                                                          setIsEventOpen(false);
                                                        }}
                                                      >
                                                        {signature}
                                                      </li>
                                                    );
                                                  }
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {eventContractInteraction.events.length === 0 && (
                                          <h4 className="w-full md:w-[67%] xl:w-[78%] ml-auto text-xs sm:text-sm text-yellow-400">
                                            No writable events found. Make sure
                                            the contract is verified on Blockscout
                                            / Etherscan.
                                          </h4>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            <ContractDetails
                              contractAddress={
                                contractDetails[jobType]?.["main"]
                                  ?.contractAddress || ""
                              }
                              setContractAddress={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "contractAddress",
                                  value
                                )
                              }
                              contractABI={
                                contractDetails[jobType]?.["main"]
                                  ?.contractABI || ""
                              }
                              setContractABI={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "contractABI",
                                  value
                                )
                              }
                              functions={
                                contractDetails[jobType]?.["main"]?.functions ||
                                []
                              }
                              setFunctions={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "functions",
                                  value
                                )
                              }
                              targetFunction={
                                contractDetails[jobType]?.["main"]
                                  ?.targetFunction || ""
                              }
                              setTargetFunction={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "targetFunction",
                                  value
                                )
                              }
                              argumentType={
                                contractDetails[jobType]?.["main"]
                                  ?.argumentType || "static"
                              }
                              setArgumentType={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "argumentType",
                                  value
                                )
                              }
                              argsArray={
                                contractDetails[jobType]?.["main"]?.argsArray ||
                                []
                              }
                              setArgArray={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "argsArray",
                                  value
                                )
                              }
                              ipfsCodeUrl={
                                contractDetails[jobType]?.["main"]
                                  ?.ipfsCodeUrl || ""
                              }
                              setIpfsCodeUrl={(value) =>
                                handleContractDetailChange(
                                  jobType,
                                  "main",
                                  "ipfsCodeUrl",
                                  value
                                )
                              }
                            />
                          </div>

                          {linkedJobs[jobType]?.length > 0 && (
                            <div className="space-y-8 relative z-40">
                              {linkedJobs[jobType].map((jobId) => {
                                const jobKey = jobId; // The linked job ID
                                return (
                                  <div
                                    key={jobId}
                                    className="relative bg-[#141414] backdrop-blur-xl rounded-2xl px-6 pt-12 pb-10 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8"
                                  >
                                    <div className="absolute top-0 left-0 bg-[#303030] border-b border-white/10 flex justify-center items-center gap-3 mt-0 w-[100%] rounded-2xl rounded-br-none rounded-bl-none">
                                      <p className="py-4 text-sm md:text-base">
                                        Linked Job {jobId}
                                      </p>
                                      <DeleteConfirmationButton
                                        jobType={jobType}
                                        jobId={jobId}
                                        handleDeleteLinkedJob={
                                          handleDeleteLinkedJob
                                        }
                                      />
                                    </div>

                                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                      <label className="block text-sm sm:text-base font-medium text-gray-300">
                                        Network
                                      </label>
                                      <div className="relative w-full md:w-[70%] xl:w-[80%]">
                                        <li className="text-sm xs:text-sm sm:text-base w-full bg-[#1a1a1a] text-white py-3 px-4 rounded-lg border border-white/10 flex items-center gap-5">
                                          <p className="w-6 h-6 ">
                                            {networkIcons[selectedNetwork]}
                                          </p>
                                          {selectedNetwork}
                                        </li>
                                      </div>
                                    </div>

                                    <ContractDetails
                                      contractAddress={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.contractAddress || ""
                                      }
                                      setContractAddress={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "contractAddress",
                                          value
                                        )
                                      }
                                      contractABI={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.contractABI || ""
                                      }
                                      setContractABI={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "contractABI",
                                          value
                                        )
                                      }
                                      functions={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.functions || []
                                      }
                                      setFunctions={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "functions",
                                          value
                                        )
                                      }
                                      targetFunction={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.targetFunction || ""
                                      }
                                      setTargetFunction={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "targetFunction",
                                          value
                                        )
                                      }
                                      argumentType={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.argumentType || "static"
                                      }
                                      setArgumentType={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "argumentType",
                                          value
                                        )
                                      }
                                      argsArray={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.argsArray || []
                                      }
                                      setArgArray={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "argsArray",
                                          value
                                        )
                                      }
                                      ipfsCodeUrl={
                                        contractDetails[jobType]?.[jobKey]
                                          ?.ipfsCodeUrl || ""
                                      }
                                      setIpfsCodeUrl={(value) =>
                                        handleContractDetailChange(
                                          jobType,
                                          jobKey,
                                          "ipfsCodeUrl",
                                          value
                                        )
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex gap-4 justify-center items-center relative z-30">
                            <button
                              type="submit"
                              className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform"
                              disabled={isLoading} // Disable while loading
                            >
                              <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                              <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                              {isLoading ? (
                                <span className="flex items-center gap-2 text-nowrap font-actayRegular relative z-10 rounded-full opacity-50 cursor-not-allowed text-xs sm:text-base overflow-hidden">
                                  Estimating Fees
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <ellipse
                                      className="spinner_rXNP"
                                      cx="9"
                                      cy="4"
                                      rx="3"
                                      ry="3"
                                    />
                                  </svg>
                                </span>
                              ) : (
                                <span className="bottom-[2px] font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base">
                                  Create Job
                                </span>
                              )}
                            </button>
                            {(linkedJobs[jobType]?.length ?? 0) < 3 && (
                              <button
                                onClick={() => handleLinkJob(jobType)}
                                className="relative bg-[#222222] text-black border border-black px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform"
                                disabled={isLoading}
                              >
                                <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                                <span className="absolute inset-0 bg-white rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>

                                <span
                                  className={`${isLoading
                                    ? "cursor-not-allowed opacity-50 "
                                    : ""
                                    } bottom-[2px] font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base`}
                                >
                                  Link Job
                                </span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8 flex items-center justify-center gap-2 text-sm lg:text-md  md:text-base tracking-wide">
                          <div className="mb-1">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 16 16"
                              fill=""
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z"
                                stroke="#A2A2A2"
                                stroke-miterlimit="10"
                              />
                              <path
                                d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z"
                                fill="#A2A2A2"
                              />
                            </svg>
                          </div>
                          Select trigger type to create a new job
                        </span>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
        {/* Estimated Fee Modal */}
        <EstimatedFeeModal
          isOpen={isLoading}
          showProcessing={showProcessModal}
          showFees={isModalOpen}
          steps={processSteps}
          onClose={() => {
            console.log("Closing fee modal");
            setIsModalOpen(false);
            setIsLoading(false);
            setProcessSteps(false);
            resetProcessSteps();
          }}
          estimatedFee={estimatedFee}
          onStake={() => {
            console.log("Initiating stake with params:", {
              stakeRegistryImplAddress,
              hasABI: !!stakeRegistryABI,
              jobDetails,
            });
            handleSubmit(stakeRegistryAddress, stakeRegistryABI, jobDetails);
          }}
          userBalance={userBalance}
          isSubmitting={isSubmitting}
          isJobCreated={isJobCreated}
          handleDashboardClick={handleDashboardClick}
        />
      </div>
    </div>
  );
}

export default CreateJobPage;
