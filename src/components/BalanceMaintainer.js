import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from 'ethers';
import Modal from "react-modal";
import toast from 'react-hot-toast';
import { FiInfo } from "react-icons/fi";
import { getChainId } from 'wagmi/actions';
import { useNetwork, useChainId } from 'wagmi';
import confetti from 'canvas-confetti';
import TriggerXTemplateFactory from '../artifacts/TriggerXTemplateFactory.json';
import { Tooltip } from "antd";
import BalanceMaintainer from '../artifacts/BalanceMaintainer.json';
import { useAccount, useBalance } from "wagmi";
import { Copy, Check } from 'lucide-react';
import ClaimETH from './ClaimETH';

const BALANCEMAINTAINER_IMPLEMENTATION = "0xAc7d9b390B070ab35298e716a11933721480472D";
const FACTORY_ADDRESS = process.env.REACT_APP_TRIGGERXTEMPLATEFACTORY_ADDRESS;


// transaction modal

const TransactionModal = ({ isOpen, onClose, onConfirm, modalType, modalData }) => {
  const [showAmountTooltip, setShowAmountTooltip] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleConfirmClick = async () => {
    setIsDeploying(true);
    await onConfirm();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Estimate Fee"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md z-[10000]"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
    >
      <h2 className="text-2xl font-bold mb-6">Transaction request</h2>

      <div className="space-y-6">
        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span>Interacting with</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm truncate max-w-[180px]">{modalData.contractAddress}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex">
              {" "}
              Required ETH  <div className="relative top-[4px]">
                <FiInfo
                  className="text-gray-400 hover:text-white cursor-pointer ml-2"
                  size={15}
                  onMouseEnter={() => setShowAmountTooltip(true)}
                  onMouseLeave={() => setShowAmountTooltip(false)}
                />
                {showAmountTooltip && (
                  <div className="absolute left-8 top-2 mt-2 p-4 bg-[#181818] rounded-xl border border-[#4B4A4A] shadow-lg z-50 w-[280px]">
                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>
                          Extra ETH held in the contract, will be used automatically to top up the address if its balance falls below the set minimum.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-white font-medium">{modalData.amount} ETH</span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex">
              {" "}
              Network Fee
            </div>
            <span className="text-gray-300">{modalData.networkFee}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Speed</span>
            <div className="flex items-center">
              <div className="text-orange-400 mr-2">
                <span className="mr-1">🦊</span>
                <span>Market</span>
              </div>
              <span>~{modalData.speed}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span> Method</span>
            <span className="text-gray-300">{modalData.contractMethod}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-5">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmClick}
          // always enabled for addAddress, disable only for other types while deploying
          disabled={modalType !== 'addAddress' && isDeploying}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-white text-black ${(modalType !== 'addAddress' && isDeploying) ? 'opacity-75' : ''}`}
        >
          {modalType === "deploy" && isDeploying ? (
            <span className="flex items-center justify-center">
              Deploying Contract...
            </span>
          ) : modalType === "addAddress" && isDeploying ? (
            <span className="flex items-center justify-center">
              Confirm
            </span>
          ) : modalType === "Intial Balance" && isDeploying ? (
            <span className="flex items-center justify-center">
              Adding Initial Balance...
            </span>
          ) : (
            'Confirm'
          )}
        </button>
      </div>
    </Modal>
  );
};

const BalanceMaintainerExample = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    watch: true,
    enabled: !!address,
  });
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
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimAmount, setClaimAmount] = useState("0.03");

  const [chainId, setChainId] = useState(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contractBalance, setContractBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isSettingInitialBalance, setIsSettingInitialBalance] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedAddresses, setCopiedAddresses] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

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
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });

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
        }
      } else {
        console.error("MetaMask not found");
        setIsInitialized(false);
      }
    };

    initProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

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
    setShowModal(true);

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
      setShowModal(false);
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
    if (isInitialized && provider && address) {
      checkExistingContract(provider, address);
    }
  }, [isInitialized, provider, address]);

  // Create a function to trigger confetti
  const triggerConfetti = () => {
    // Create coin-like confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Gold coins
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#F8FF7C'],
        shapes: ['circle'],
        scalar: randomInRange(0.8, 1.2)
      }));
    }, 250);
  };

  // Get network name for display
  const getNetworkName = () => {
    if (chainId === 11155420n) {
      return "Optimism Sepolia";
    } else if (chainId === 84532n) {
      return "Base Sepolia";
    } else {
      return "Test Network";
    }
  };

  // Function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-5)}`;
  };

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
        <div className=" mb-6">
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
        <div className=" rounded-lg mb-6">
          <h2 className="text-xl text-white mb-3">Contract Information</h2>
          <div className="text-[#A2A2A2] space-y-2">
            {!isConnected ? (
              <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
                <p className="text-white text-center">Please connect your wallet to interact with the contract</p>
              </div>
            ) : !isDeployed ? (
              <>
                <p className="pb-2">Status: Not Deployed</p>

                <div className="flex flex-wrap gap-4">
                  {hasSufficientBalance ? (
                    <button
                      onClick={showDeployModal}
                      className="bg-[#C07AF6] text-white px-8 py-3 rounded-lg transition-colors text-lg hover:bg-[#B15AE6]"
                    >
                      {isLoading && modalType === "deploy" ? 'Deploying...' : '🛠️ Deploy Contract'}
                    </button>
                  ) : (
                    <ClaimETH onBalanceUpdate={refetchBalance} />
                  )}
                </div>
              </>
            ) : (
              <>
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
        {isDeployed && (
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
        {isDeployed && addresses.length > 0 && (
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
          {isDeployed && (
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
                timeframe: { years: 0, months: 0, days: 1 },
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