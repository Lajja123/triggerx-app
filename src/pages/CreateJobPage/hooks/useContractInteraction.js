//useContractInteraction.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

export function useContractInteraction(jobType) {
  const [contractAddress, setContractAddress] = useState("");
  const [contractABI, setContractABI] = useState("");
  const [functions, setFunctions] = useState([]);
  const [targetFunction, setTargetFunction] = useState("");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionInputs, setFunctionInputs] = useState([]);
  const [argumentsInBytes, setArgumentsInBytes] = useState([]);
  const [argsArray, setArgArray] = useState([]);
  const [argumentType, setArgumentType] = useState("static");

  const [events, setEvents] = useState([]); // Added for events
  const [selectedEvent, setSelectedEvent] = useState(null); // Added for events
  const [targetEvent, setTargetEvent] = useState(""); // Added for event selection
  const [eventInputs, setEventInputs] = useState([]); // Added for event parameters
  const [manualABI, setManualABI] = useState("");
  const [showManualABIInput, setShowManualABIInput] = useState(false);

  function extractFunctions(abi) {
    try {
      let abiArray;
      if (typeof abi === "string") {
        try {
          abiArray = JSON.parse(abi);
        } catch (e) {
          throw new Error("Invalid ABI string format");
        }
      } else if (Array.isArray(abi)) {
        abiArray = abi;
      } else if (typeof abi === "object") {
        abiArray = [abi];
      } else {
        throw new Error("ABI must be an array, object, or valid JSON string");
      }

      if (!Array.isArray(abiArray)) {
        throw new Error("Processed ABI is not an array");
      }

      const functions = abiArray
        .filter((item) => item && item.type === "function")
        .map((func) => ({
          name: func.name || "unnamed",
          inputs: func.inputs || [],
          outputs: func.outputs || [],
          stateMutability: func.stateMutability || "nonpayable",
          payable: func.payable || false,
          constant: func.constant || false,
        }));

      console.log("Extracted functions:", functions);
      return functions;
    } catch (error) {
      console.error("Error processing ABI:", error);
      return [];
    }
  }

  // New function to extract events from ABI
  function extractEvents(abi) {
    try {
      let abiArray;
      if (typeof abi === "string") {
        try {
          abiArray = JSON.parse(abi);
        } catch (e) {
          throw new Error("Invalid ABI string format");
        }
      } else if (Array.isArray(abi)) {
        abiArray = abi;
      } else if (typeof abi === "object") {
        abiArray = [abi];
      } else {
        throw new Error("ABI must be an array, object, or valid JSON string");
      }

      if (!Array.isArray(abiArray)) {
        throw new Error("Processed ABI is not an array");
      }

      const events = abiArray
        .filter((item) => item && item.type === "event")
        .map((event) => ({
          name: event.name || "unnamed",
          inputs: event.inputs || [],
          anonymous: event.anonymous || false,
        }));

      console.log("Extracted events:", events);
      return events;
    } catch (error) {
      console.error("Error processing events from ABI:", error);
      return [];
    }
  }

  const handleContractAddressChange = async (e) => {
    const address = e.target.value;
    console.log("Contract address changed to:", address);
    setContractAddress(address);
    setContractABI(""); // Clear previous ABI
    setFunctions([]); // Clear previous functions
    setEvents([]); // Clear previous events
    setTargetFunction(""); // Clear previous target function
    setTargetEvent(""); // Clear previous target event
    setManualABI(""); // Clear manual ABI
    setShowManualABIInput(false); // Hide manual input initially

    if (ethers.isAddress(address)) {
      const url = `https://optimism-sepolia.blockscout.com/api?module=contract&action=getabi&address=${address}`;
      try {
        const response = await axios.get(url);
        const data = response.data;
        if (data.status === "1" && data.result && typeof data.result === 'string' && data.result.startsWith('[')) {
          const writableFunctions = extractFunctions(data.result).filter(
            (func) =>
              func.stateMutability === "nonpayable" ||
              func.stateMutability === "payable"
          );
          console.log("Setting writable functions:", writableFunctions);
          setFunctions(writableFunctions);

          // Extract and set events
          const contractEvents = extractEvents(data.result);
          console.log("Setting contract events:", contractEvents);
          setEvents(contractEvents);

          setContractABI(data.result);
          setShowManualABIInput(false); // Hide manual input on success
        } else {
          // Handle failure: show manual input
          console.warn("Failed to fetch ABI automatically. Showing manual input.", data.message);
          setShowManualABIInput(true);
          setContractABI("");
          setFunctions([]);
          setEvents([]);
          setTargetFunction("");
          setTargetEvent("");
        }
      } catch (error) {
        console.error("Error fetching ABI:", error.message);
        // Handle network errors or other exceptions by showing manual input
        setShowManualABIInput(true);
        setContractABI("");
        setFunctions([]);
        setEvents([]);
        setTargetFunction("");
        setTargetEvent("");
      }
    } else {
      console.log("Invalid address, clearing ABI and showing manual input option.");
      setContractABI("");
      setFunctions([]);
      setEvents([]);
      setTargetFunction("");
      setTargetEvent("");
      setManualABI("");
      setShowManualABIInput(true); // Show manual input for invalid address too
    }
  };

  const handleFunctionChange = (e) => {
    const selectedValue = e.target.value;
    console.log("Function selection changed to:", selectedValue);
    setTargetFunction(selectedValue);

    const func = functions.find(
      (f) =>
        `${f.name}(${f.inputs.map((input) => input.type).join(",")})` ===
        selectedValue
    );
    setSelectedFunction(func);

    // Reset argument type if function has no inputs
    if (!func?.inputs?.length) {
      setArgumentType("static");
    }

    if (func) {
      setFunctionInputs(func.inputs.map(() => ""));
      setArgArray(func.inputs.map(() => ""));
    } else {
      setFunctionInputs([]);
      setArgArray([]);
    }
  };

  // New handler for event selection
  const handleEventChange = (e) => {
    const selectedValue = e.target.value;
    console.log("Event selection changed to:", selectedValue);
    setTargetEvent(selectedValue);

    const event = events.find(
      (e) =>
        `${e.name}(${e.inputs.map((input) => input.type).join(",")})` ===
        selectedValue
    );
    setSelectedEvent(event);

    if (event) {
      setEventInputs(event.inputs.map(() => ""));
    } else {
      setEventInputs([]);
    }
  };

  const handleArgumentTypeChange = (e) => {
    const newType = e.target.value;
    console.log("Argument type changed to:", newType);
    setArgumentType(newType);

    // Clear inputs when switching to dynamic
    if (newType === "dynamic") {
      const emptyInputs = selectedFunction?.inputs?.map(() => "") || [];
      setFunctionInputs(emptyInputs);
      setArgArray(emptyInputs);
    }
  };

  const handleInputChange = (index, value) => {
    const newInputs = [...functionInputs];
    newInputs[index] = value;
    setFunctionInputs(newInputs);
    setArgArray(newInputs);

    if (newInputs.every((input) => input !== "")) {
      const bytesArray = newInputs.map((arg) => {
        const hexValue = ethers.toBeHex(arg);
        return hexValue.length % 2 === 0 ? hexValue : `0x0${hexValue.slice(2)}`;
      });
      setArgumentsInBytes(bytesArray);
    } else {
      console.log("Not all inputs filled, clearing bytes array");
      setArgumentsInBytes([]);
    }
  };

  // New handler for event input changes
  const handleEventInputChange = (index, value) => {
    const newInputs = [...eventInputs];
    newInputs[index] = value;
    setEventInputs(newInputs);
  };

  // New handler for manual ABI input
  const handleManualABIChange = (e) => {
    const abi = e.target.value;
    setManualABI(abi);
    try {
      const parsedAbi = JSON.parse(abi);
      const writableFunctions = extractFunctions(parsedAbi).filter(
        (func) =>
          func.stateMutability === "nonpayable" ||
          func.stateMutability === "payable"
      );
      setFunctions(writableFunctions);

      const contractEvents = extractEvents(parsedAbi);
      setEvents(contractEvents);

      setContractABI(abi);

      // Reset target function and event when ABI changes
      setTargetFunction("");
      setTargetEvent("");
    } catch (error) {
      console.error("Error processing manual ABI:", error);
      setFunctions([]);
      setEvents([]);
      setContractABI("");
      setTargetFunction("");
      setTargetEvent("");
    }
  };

  useEffect(() => {
    const bytesArray = functionInputs.map((arg) => {
      if (arg === "") return "0x";
      try {
        const hexValue = ethers.toBeHex(arg);
        const paddedHex =
          hexValue.length % 2 === 0 ? hexValue : `0x0${hexValue.slice(2)}`;
        return paddedHex;
      } catch (error) {
        console.error("Error converting input to hex:", error);
        return "0x";
      }
    });
    console.log("Setting arguments in bytes:", bytesArray);
    setArgumentsInBytes(bytesArray);
  }, [functionInputs]);

  return {
    contractAddress,
    setContractAddress,
    contractABI,
    setContractABI,
    functions,
    setFunctions,
    targetFunction,
    setTargetFunction,
    selectedFunction,
    setSelectedFunction,
    functionInputs,
    setFunctionInputs,
    argumentsInBytes,
    setArgumentsInBytes,
    argsArray,
    setArgArray,
    argumentType,
    setArgumentType,
    handleContractAddressChange,
    handleFunctionChange,
    handleArgumentTypeChange,
    handleInputChange,
    events, // Expose events
    selectedEvent, // Expose selectedEvent
    targetEvent, // Expose targetEvent
    eventInputs, // Expose eventInputs
    handleEventChange, // Expose event handler
    manualABI, // Expose manual ABI state
    handleManualABIChange, // Expose manual ABI handler
    showManualABIInput, // Expose showManualABIInput state
  };
}
