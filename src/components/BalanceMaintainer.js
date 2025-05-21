import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import TriggerXTemplateFactory from '../artifacts/TriggerXTemplateFactory.json';
import BalanceMaintainer from '../artifacts/BalanceMaintainer.json';
import { useAccount, useBalance } from "wagmi";
import { Copy, Check } from 'lucide-react';
import ClaimEth from './common/ClaimEth';
import DeployButton from './common/DeployButton'; // Import the new component

import TransactionModal from './common/TransactionModal.js'; // Import the new component
import { useWallet } from "../contexts/WalletContext.js";

const BALANCEMAINTAINER_IMPLEMENTATION = "0xAc7d9b390B070ab35298e716a11933721480472D";
const FACTORY_ADDRESS = process.env.REACT_APP_TRIGGERXTEMPLATEFACTORY_ADDRESS;

const BalanceMaintainerExample = () => {
  const { address, isConnected } = useAccount();
  const { refreshBalance } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "deploy" or "addAddress"
  const [modalData, setModalData] = useState({
    amount: "0.00",
    networkFee: "$0.00",
    speed: "0 sec",
    contractAddress: "",
    contractMethod: ""
  });
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [userBalance, setUserBalance] = useState("0");

  const [chainId, setChainId] = useState(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractBalance, setContractBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isSettingInitialBalance, setIsSettingInitialBalance] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedAddresses, setCopiedAddresses] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  const {
    data: balanceData,
    refetch: refetchBalance,
    isLoading: balanceLoading,
  } = useBalance({
    address,
    enabled: !!address,
  });

  // 👉 Refetch balance when triggered via context
  useEffect(() => {
    if (address) {
      refetchBalance();
    }
  }, [refreshBalance]);

  // Update userBalance and hasSufficientBalance whenever balanceData changes
  useEffect(() => {
    if (balanceData) {
      const balance = balanceData.value;
      const requiredBalance = ethers.parseEther('0.02');
      const formattedBalance = Number(ethers.formatEther(balance)).toFixed(4);

      setUserBalance(formattedBalance);
      setHasSufficientBalance(balance >= requiredBalance);
      console.log("Balance updated from wagmi:", formattedBalance);
    }
  }, [balanceData]);

  // Initialize provider and signer
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          // Only initialize if user is already connected
          if (isConnected && address) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Get network with error handling
            let network;
            try {
              network = await provider.getNetwork();
            } catch (error) {
              console.warn("Error getting network:", error);
              // Default to Optimism Sepolia if network fetch fails
              network = { chainId: 11155420 };
            }

            setProvider(provider);
            setSigner(signer);
            setChainId(network.chainId);
            setIsInitialized(true);

            // Check for existing contract when provider is initialized
            checkExistingContract(provider, address);
          } else {
            setIsInitialized(true);
            setIsPageLoading(false);
          }

          // Listen for chain changes
          window.ethereum.on('chainChanged', async (chainId) => {
            try {
              // Convert chainId from hex to decimal
              const newChainId = parseInt(chainId, 16);
              setChainId(newChainId);

              // Wait a bit for the network to stabilize
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Check for existing contract when chain changes
              if (address) {
                checkExistingContract(provider, address);
              }
            } catch (error) {
              console.error("Error handling chain change:", error);
            }
          });
        } catch (error) {
          console.error("Error initializing provider:", error);
          // Reset states if initialization fails
          setProvider(null);
          setSigner(null);
          setChainId(null);
          setIsInitialized(false);
          setIsPageLoading(false);
        }
      } else {
        console.error("MetaMask not found");
        setIsInitialized(false);
        setIsPageLoading(false);
      }
    };

    initProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [isConnected, address]);

  // Check for existing contract
  const checkExistingContract = async (provider, userAddress) => {
    if (!provider || !userAddress) return;

    try {
      // Create factory contract instance
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        TriggerXTemplateFactory.abi,
        provider
      );

      // Get proxy address for the user and implementation
      const proxyAddress = await factoryContract.getProxyAddress(
        userAddress,
        BALANCEMAINTAINER_IMPLEMENTATION
      );

      // Check if proxy exists and is not zero address
      if (proxyAddress && proxyAddress !== ethers.ZeroAddress) {
        // Verify the proxy contract exists
        const proxyCode = await provider.getCode(proxyAddress);
        if (proxyCode !== '0x') {
          setContractAddress(proxyAddress);
          setIsDeployed(true);
          await fetchContractData(provider, proxyAddress);
          return;
        }
      }

      // If we get here, no valid proxy exists
      setIsDeployed(false);
      setContractAddress("");
    } catch (error) {
      console.error("Error checking existing contract:", error);
      setIsDeployed(false);
      setContractAddress("");
    }
  };

  // Fetch contract data
  const fetchContractData = async (provider, contractAddr) => {
    if (!provider || !contractAddr) return;

    try {
      const contract = new ethers.Contract(
        contractAddr,
        BalanceMaintainer.abi,
        provider
      );

      // Get contract balance
      const balance = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(balance)).toFixed(4));

      // Get tracked addresses and their minimum balances
      const [addrs, minBalances] = await contract.getAllTrackedAddressesWithBalances();

      // Fetch actual balances for each address
      const balancesPromises = addrs.map(addr => provider.getBalance(addr));
      const actualBalances = await Promise.all(balancesPromises);

      setAddresses(addrs.map((addr, index) => ({
        key: index.toString(),
        address: addr,
        currentBalance: Number(ethers.formatEther(actualBalances[index])).toFixed(4),
        minimumBalance: Number(ethers.formatEther(minBalances[index])).toFixed(4)
      })));
    } catch (error) {
      console.error("Error fetching contract data:", error);
    }
  };

  // Add periodic balance refresh
  useEffect(() => {
    if (!provider || !contractAddress) return;

    const interval = setInterval(() => {
      fetchContractData(provider, contractAddress);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [provider, contractAddress]);

  // Set initial balance for owner
  const setInitialBalance = async (contractAddr) => {
    setModalType("Intial Balance")
    if (!signer || !address || !contractAddr) return;

    setIsSettingInitialBalance(false);
    try {
      const contract = new ethers.Contract(
        contractAddr,
        BalanceMaintainer.abi,
        signer
      );
      console.log("balance of contract", await contract.getContractBalance());
      const tx = await contract.setMultipleAddressesWithBalance(
        [address],
        [ethers.parseEther('0.01')]
      );

      await tx.wait();
      await fetchContractData(provider, contractAddr);
    } catch (error) {
      console.error("Error setting initial balance:", error);
    } finally {
      setIsSettingInitialBalance(false);
    }
  };

  const showDeployModal = () => {
    setModalType("deploy");
    setModalData({
      amount: "0.02",
      networkFee: "$0.01",
      speed: "2 sec",
      contractAddress: FACTORY_ADDRESS.substring(0, 7) + "..." + FACTORY_ADDRESS.substring(FACTORY_ADDRESS.length - 5),
      contractMethod: "createProxy()"
    });
    setShowModal(true);
  };

  const showAddAddressModal = () => {
    if (!newAddress || !newBalance) return;

    setModalType("addAddress");
    setModalData({
      amount: newBalance,
      networkFee: "$0.01",
      speed: "2 sec",
      contractAddress: contractAddress.substring(0, 7) + "..." + contractAddress.substring(contractAddress.length - 5),
      contractMethod: "setMultipleAddressesWithBalance()"
    });
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);

    if (modalType === "deploy") {
      handleDeploy();
    } else if (modalType === "addAddress") {
      handleAddAddress();
    } else if (modalType === "initialBalance") {
      // user confirmed the second step: seed owner balance
      await setInitialBalance(contractAddress);
      setShowModal(false);
    }
  };


  const handleDeploy = async () => {
    if (!signer || !address) return;
    setIsLoading(true);

    try {
      // Get current network from provider
      const network = await signer.provider.getNetwork();
      const currentChainId = network.chainId;

      if (!currentChainId) {
        throw new Error("Unable to determine current network. Please ensure your wallet is connected.");
      }

      // Create factory contract instance
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        TriggerXTemplateFactory.abi,
        signer
      );

      // Verify contract is deployed and accessible
      try {
        const code = await signer.provider.getCode(FACTORY_ADDRESS);
        if (code === '0x') {
          throw new Error(`Factory contract not deployed at ${FACTORY_ADDRESS} on current network`);
        }
      } catch (err) {
        throw new Error(`Failed to verify factory contract: ${err.message}`);
      }

      // Get current balance to ensure sufficient funds
      const balance = await signer.provider.getBalance(address);
      const requiredBalance = ethers.parseEther('0.02');
      if (balance < requiredBalance) {
        throw new Error(`Insufficient balance. Required: ${ethers.formatEther(requiredBalance)} ETH, Current: ${ethers.formatEther(balance)} ETH`);
      }

      // Deploy proxy through factory
      const tx = await factoryContract.createProxy(BALANCEMAINTAINER_IMPLEMENTATION, {
        value: ethers.parseEther('0.02')
      });

      const receipt = await tx.wait();

      // Get the deployed proxy address from the event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'ProxyDeployed';
        } catch (e) {
          return false;
        }
      });

      if (event) {
        const parsedLog = factoryContract.interface.parseLog(event);
        const proxyAddress = parsedLog.args.proxy;
        setContractAddress(proxyAddress);
        setIsDeployed(true);

        // Fetch contract data immediately
        await fetchContractData(provider, proxyAddress);

        // Set initial balance for owner
        // await setInitialBalance(proxyAddress);
        toast.success("Contract deployed successfully!");

      } else {
        throw new Error("No deployment event found in transaction receipt");
      }
    } catch (err) {
      console.error("Deployment error:", err);
      // Check for user rejection
      if (err.code === 'ACTION_REJECTED' ||
        err.code === 4001 ||
        err.message?.includes("rejected") ||
        err.message?.includes("denied") ||
        err.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error("Deployment failed: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!signer || !newAddress || !newBalance) return;

    setIsLoading(true);

    try {
      const contract = new ethers.Contract(
        contractAddress,
        BalanceMaintainer.abi,
        signer
      );
      console.log("tryying to add address...");
      console.log("contract", contract);


      const tx = await contract.setMultipleAddressesWithBalance(
        [newAddress],
        [ethers.parseEther(newBalance)]
      );

      await tx.wait();
      await fetchContractData(provider, contractAddress);
      setNewAddress("");
      setNewBalance("");
      toast.success("Address added successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Error adding address:", error);

      // Check for user rejection
      if (error.code === 'ACTION_REJECTED' ||
        error.code === 4001 ||
        error.message?.includes("rejected") ||
        error.message?.includes("denied") ||
        error.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error("Failed to add address ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing contract when component mounts or when initialized
  useEffect(() => {
    const performInitialChecks = async () => {
      if (isInitialized && provider && address) {
        setIsPageLoading(true);
        await checkExistingContract(provider, address);
        setIsPageLoading(false);
      } else if (!isConnected && isInitialized) {
        setIsPageLoading(false);
      } else if (!isInitialized && !isConnected) {
        setIsPageLoading(false);
      } else if (isConnected && !isInitialized) {
        setIsPageLoading(true);
      } else {
        setIsPageLoading(false);
      }
    };

    performInitialChecks();
  }, [isInitialized, provider, address, isConnected]);

  // Function to copy address
  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddresses(prev => ({ ...prev, [address]: true }));
      setTimeout(() => {
        setCopiedAddresses(prev => ({ ...prev, [address]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className=" ">

      <div className="max-w-[1600px] mx-auto  px-3 sm:px-5 py-6 ">
        {/* Template Info Section */}
        <div className="">
          <h2 className="text-xl text-white mb-4">BalanceMaintainer Template</h2>
          <p className="text-[#A2A2A2] mb-4">
            This template automatically monitors and refills ETH for selected addresses when their balance drops below a set threshold.
          </p>

          <div className="space-y-2">
            <h3 className="text-white text-lg mb-2">Setup Steps</h3>
            <ul className="list-disc list-inside text-[#A2A2A2] space-y-2 ml-2">
              <li>On contract deployment, extra ETH will be held to cover future top-ups when balances dip.</li>
              <li>Add the address you want to monitor</li>
              <li>Set the minimum balance to maintain (for testnet, keep it below 0.02 ETH)</li>
              <li>Confirm the transaction to save your settings</li>
              <li>Click on Create Job.
              </li>
            </ul>
            <p className="text-[#A2A2A2] mt-4 italic">
              Once set, top-ups happen automatically—no manual checks required.
            </p>
          </div>
        </div>

        {/* Contract Info Section */}
        <div className=" rounded-lg">
          <div className="text-[#A2A2A2] ">
            {isPageLoading ? (
              <div className="bg-white/5 border border-white/10 p-5 rounded-lg mt-6">
                <span className="text-white text-center">Loading contract details...</span>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-[#A2A2A2]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg " className="mb-3" stroke="">
                  <path d="M12 17C12.2833 17 12.521 16.904 12.713 16.712C12.905 16.52 13.0007 16.2827 13 16C12.9993 15.7173 12.9033 15.48 12.712 15.288C12.5207 15.096 12.2833 15 12 15C11.7167 15 11.4793 15.096 11.288 15.288C11.0967 15.48 11.0007 15.7173 11 16C10.9993 16.2827 11.0953 16.5203 11.288 16.713C11.4807 16.9057 11.718 17.0013 12 17ZM12 13C12.2833 13 12.521 12.904 12.713 12.712C12.905 12.52 13.0007 12.2827 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22Z" fill="#A2A2A2" />
                </svg>
                <p className="text-lg mb-2">Wallet Not Connected</p>
                <p className="text-md text-[#666666] mb-4 tracking-wide">
                  Please connect your wallet to interact with the contract
                </p>

              </div>
            ) : !isDeployed ? (
              <>

                <div className="flex flex-wrap gap-4">
                  {hasSufficientBalance ? (
                    <DeployButton
                      onClick={showDeployModal}
                      isLoading={isLoading && modalType === "deploy"}
                    />

                  ) : (
                    <ClaimEth />
                  )}


                </div>
                {hasSufficientBalance && (

                  <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-md tracking-wide">
                    <div className="mb-1">
                      <svg width="22" height="22" viewBox="0 0 16 16" fill="" xmlns="http://www.w3.org/2000/svg" >
                        <path d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z" stroke="#A2A2A2" stroke-miterlimit="10" />
                        <path d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z" fill="#A2A2A2" />
                      </svg>
                    </div>
                    You need to deploy contract before create the job.

                  </span>
                )}
                {!hasSufficientBalance && (

                  <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-6 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-md tracking-wide">
                    <div className="mb-1">
                      <svg width="22" height="22" viewBox="0 0 16 16" fill="" xmlns="http://www.w3.org/2000/svg" >
                        <path d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z" stroke="#A2A2A2" stroke-miterlimit="10" />
                        <path d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z" fill="#A2A2A2" />
                      </svg>
                    </div>
                    You need to claim ETH before create the job.

                  </span>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl text-white my-6">Contract Information</h2>

                <div className="bg-white/5 border border-white/10  p-5 rounded-lg ">

                  <p className="text-white py-2">Status : <span className="text-[#A2A2A2] font-semibold pl-2"> {isInitialized ? 'Deployed Successfully' : 'Deploying...'}</span></p>
                  <p className="text-white py-2">Owner : <span className="text-[#A2A2A2] font-semibold pl-2">{address}</span></p>
                  <p className="text-white py-2">Balance : <span className="text-[#A2A2A2] font-semibold pl-2">{contractBalance}  ETH</span> </p>
                  <p className="text-white py-2">
                    Contract Address :{' '}
                    <a
                      href={`${chainId === 11155420n
                        ? 'https://sepolia-optimism.etherscan.io/address/'
                        : 'https://sepolia.basescan.org/address/'}${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#77E8A3] underline pl-2"
                    >
                      {contractAddress}
                    </a>
                  </p>

                  {/* {isSettingInitialBalance && <p className="text-yellow-500">Adding initial Address in the balance maintain list...</p>} */}
                </div>
              </>
            )}
          </div>
        </div>
        <TransactionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
          modalType={modalType}
          modalData={modalData}
        />

        {/* Add Addresses - Only visible after deployment */}
        {isPageLoading ? null : isDeployed && (
          <div className="bg-white/5 border border-white/10 p-5 rounded-lg my-6">
            <h2 className="text-xl text-white mb-3">Add Addresses</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter wallet address where you maintain your funds"
                className="bg-white/5 border border-white/10 rounded-lg text-white px-4 py-4 rounded-lg flex-1 placeholder-gray-400 focus:outline-none"
                disabled={isLoading}
              />
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Min balance"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-4 rounded-lg w-48"
                step="0.1"
                min="0"
                disabled={isLoading}
              />
              <button
                onClick={showAddAddressModal}
                disabled={isLoading || !newAddress || !newBalance}
                className={`bg-[#FFFFFF] text-black px-6 py-2 rounded-lg transition-colors whitespace-nowrap ${(isLoading || !newAddress || !newBalance) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading && modalType === "addAddress" ? 'Adding...' : 'Add Address'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Addresses Table */}
        {isPageLoading ? null : isDeployed && addresses.length > 0 && (
          <div className="p-4 rounded-lg mb-6 min-h-[40vh]">
            <h2 className="text-xl text-white mb-3">Configured Addresses</h2>
            <div className="overflow-x-auto w-full">
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full min-w-full border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-2 sm:px-4 md:px-6 py-5 text-left text-white w-3/5">Address</th>
                      <th className="px-2 sm:px-4 md:px-6 py-5 text-left text-white w-1/5">Current Balance</th>
                      <th className="px-2 sm:px-4 md:px-6 py-5 text-left text-white w-1/5">Min Balance (ETH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((item) => (
                      <tr key={item.key} className="bg-[#1A1A1A]">
                        <td className="px-2 sm:px-4 md:px-6 py-5 text-[#A2A2A2] w-3/5 truncate">
                          <div className="flex items-center gap-2">
                            <span className="block truncate">
                              <span className="s">{`${item.address.slice(0, 4)}...${item.address.slice(-15)}`}</span>
                            </span>
                            <button
                              onClick={() => copyAddress(item.address)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Copy address"
                            >
                              {copiedAddresses[item.address] ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 w-1/5">
                          <span className="px-2 sm:px-4 py-2 bg-[#4CAF50] text-white rounded whitespace-nowrap text-sm">
                            {item.currentBalance} ETH
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 w-1/5">
                          <span className="px-2 sm:px-4 py-2 bg-[#C07AF6] text-white rounded whitespace-nowrap text-sm">
                            {item.minimumBalance} ETH
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Button */}
        <div className="flex justify-center">
          {isPageLoading ? null : isDeployed && (
            <button onClick={() => {
              setSelectedJob(null);
              const jobState = {
                jobType: 1, // Time-based trigger
                contractAddress: contractAddress,
                abi: JSON.stringify([{
                  "inputs": [],
                  "name": "maintainBalances",
                  "outputs": [],
                  "stateMutability": "nonpayable",
                  "type": "function"
                }]),
                timeframe: { days: 1, hours: 0, minutes: 0 },
                timeInterval: { hours: 1, minutes: 0, seconds: 0 }
              };
              // Update location state directly
              window.history.pushState(jobState, '', window.location.pathname);
              // Trigger state update by dispatching a popstate event
              window.dispatchEvent(new PopStateEvent('popstate', { state: jobState }));
            }} className="relative bg-[#F8FF7C] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform ">
              <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
              <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
              <span className="font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs lg:text-sm xl:text-base">
                Create Job
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceMaintainerExample;