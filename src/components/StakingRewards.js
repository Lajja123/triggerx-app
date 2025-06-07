import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import ERC20ABI from "../artifacts/ERC20.json";
import { useAccount, useBalance } from "wagmi";
import TransactionModal from "./Stake-Reward/TransactionModal";
import StakingRewardsABI from "../artifacts/StakingReword.json";
import { Copy, Check } from "lucide-react";
import ClaimEth from "./common/ClaimEth";
import { useWallet } from "../contexts/WalletContext";

// Contract addresses and Static Data
const TOKEN_ADDRESS = process.env.REACT_APP_STAKER_TOKEN_ADDRESS;
const STAKE_REWARD_CONTRACT_ADDRESS =
  process.env.REACT_APP_STAKING_REWARD_CONTRACT_ADDRESS;
const ETHClaimAmount = "0.03";
const THRESHOLD = "10";
const jobConfig = {
  jobType: "Event Based (2)",
  argType: "static",
  targetContractAddress: "0xfF97e83B212fC5d536B0bB26d7d8a266C93FF861",
  targetFunction: "distributeNFTRewards",
  triggerContractAddress: "0xfF97e83B212fC5d536B0bB26d7d8a266C93FF861",
  triggerEvent: "ThresholdReached(uint256,uint256)",
  abi: {
    inputs: [],
    name: "distributeNFTRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
};

const StakingReward = () => {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    enabled: !!address,
  });
  const { data: tokenBalanceData, refetch: refetchTokenBalance } = useBalance({
    address,
    token: TOKEN_ADDRESS,
    watch: true,
    enabled: !!address,
  });

  // Add useWallet hook
  const { triggerBalanceRefresh } = useWallet();

  const [showModal, setShowModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showTokenClaimModal, setShowTokenClaimModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState({
    amount: "0.00",
    networkFee: "$0.00",
    speed: "0 sec",
    token: "",
    contractAddress: "",
    contractMethod: "",
  });
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [hasSufficientTokenBalance, setHasSufficientTokenBalance] =
    useState(false);

  const [userBalance, setUserBalance] = useState("0");

  const [tokenBalance, setTokenBalance] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [totalStaked, setTotalStaked] = useState("0");
  const [nextThreshold, setNextThreshold] = useState("0");

  const [isClaimingToken, setIsClaimingToken] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  const [hasNFT, setHasNFT] = useState(false);

  const [hasClaimedToken, setHasClaimedToken] = useState(false);

  const [isAbiExpanded, setIsAbiExpanded] = useState(false);

  // Add effect to refetch balances when refreshBalance changes
  useEffect(() => {
    console.log("Refetching balances...");
    const refetchBalances = async () => {
      await Promise.all([
        refetchBalance(),
        refetchTokenBalance()
      ]);
    };
    refetchBalances();
  }, [triggerBalanceRefresh, refetchBalance, refetchTokenBalance]);

  // Update the useEffect for balance updates
  useEffect(() => {
    console.log("Balance update effect triggered with:", {
      balanceData,
      tokenBalanceData
    });

    if (balanceData && tokenBalanceData) {
      const balance = balanceData.value;
      const tokenBalance = tokenBalanceData.value;

      const requiredBalance = ethers.parseEther("0.02");
      const requiredTokenBalance = ethers.parseEther("1");

      const formattedBalance = Number(ethers.formatEther(balance)).toFixed(4);
      const formattedTokenBalance = Number(
        ethers.formatEther(tokenBalance)
      ).toFixed(2);

      console.log("Calculated balances:", {
        formattedBalance,
        formattedTokenBalance,
        hasSufficientBalance: balance >= requiredBalance,
        hasSufficientTokenBalance: tokenBalance >= requiredTokenBalance
      });

      setUserBalance(formattedBalance);
      setTokenBalance(formattedTokenBalance);

      setHasSufficientBalance(balance >= requiredBalance);
      setHasSufficientTokenBalance(tokenBalance >= requiredTokenBalance);
    }
  }, [balanceData, tokenBalanceData]);

  // Add a new useEffect to monitor state changes
  useEffect(() => {
    console.log("State updated:", {
      hasSufficientBalance,
      hasSufficientTokenBalance,
      userBalance,
      tokenBalance
    });
  }, [hasSufficientBalance, hasSufficientTokenBalance, userBalance, tokenBalance]);

  // Initialize contracts of Staker Token and Staking Rewards
  useEffect(() => {
    if (signer && address) {
      try {
        const stakingContract = new ethers.Contract(
          STAKE_REWARD_CONTRACT_ADDRESS,
          StakingRewardsABI.abi,
          signer
        );

        const tokenContract = new ethers.Contract(
          TOKEN_ADDRESS,
          ERC20ABI.abi,
          signer
        );

        setStakingContract(stakingContract);
        setTokenContract(tokenContract);

        // Fetch initial staking data
        fetchStakingData(stakingContract, address);
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    }
  }, [signer, address]);

  // To periodically refresh staking data
  useEffect(() => {
    if (!stakingContract || !address) return;

    const interval = setInterval(() => {
      fetchStakingData(stakingContract, address);
    }, 30000);

    return () => clearInterval(interval);
  }, [stakingContract, address]);

  // To handle the provider, signer and wallet connection
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
            setIsPageLoading(false);

            // Check for existing contract when provider is initialized
          } else {
            setIsInitialized(true);
            setIsPageLoading(false);
          }

          // Listen for chain changes
          window.ethereum.on("chainChanged", async (chainId) => {
            try {
              // Convert chainId from hex to decimal
              const newChainId = parseInt(chainId, 16);
              setChainId(newChainId);

              // Wait a bit for the network to stabilize
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Check for existing contract when chain changes
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
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [isConnected, address]);

  // Fetch total staked amount and user staked amount with NFT reward
  const fetchStakingData = async (contract, userAddress) => {
    if (!contract || !userAddress) return;

    try {
      // Get user staked amount
      const userStaked = await contract.getStakedAmount(userAddress);
      setStakedAmount(ethers.formatEther(userStaked));

      // Get total staked amount
      const total = await contract.getTotalStaked();
      setTotalStaked(ethers.formatEther(total));

      // Check if user has NFT reward
      const hasReceivedNFT = await contract.hasReceivedNFT(userAddress);
      setHasNFT(hasReceivedNFT);

      const modulusThreshold = ethers.formatEther(total) % THRESHOLD;
      const nextThreshold = THRESHOLD - modulusThreshold;
      setNextThreshold(nextThreshold);
    } catch (error) {
      console.error("Error fetching staking data:", error);
    }
  };

  // Manually refresh staking data while staking or unstaking
  const refreshStakingData = async () => {
    if (stakingContract && address) {
      await fetchStakingData(stakingContract, address);
    }
  };

  // Function to claim stake token
  const handleTokenClaim = async () => {
    // Check if signer and address are available with chainID
    if (!signer || !address || chainId !== 11155420n) {
      toast.error("Please connect to Optimism Sepolia network");
      return;
    }

    setIsClaimingToken(true);

    try {
      const tx = await tokenContract.mint(address, ethers.parseEther("1.0"));

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh token balance
      await refetchTokenBalance();
      setHasClaimedToken(true);

      toast.success("Token claimed successfully!");
    } catch (error) {
      console.error("Token claim error:", error);

      if (
        error.message?.includes("rejected") ||
        error.message?.includes("denied")
      ) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to claim token");
      }
    } finally {
      setShowTokenClaimModal(false);
      setIsClaimingToken(false);
    }
  };

  // Show Modal to mint Token
  const showStakeTokenClaimModal = () => {
    setModalType("claimToken");
    setModalData({
      amount: "1.0",
      networkFee: "~0.005 $",
      speed: "2 sec",
      token: "STK",
      contractAddress:
        TOKEN_ADDRESS.substring(0, 7) +
        "..." +
        TOKEN_ADDRESS.substring(TOKEN_ADDRESS.length - 5),
      contractMethod: "mint()",
    });
    setShowTokenClaimModal(true);
  };

  // Handle Confirm for Mint Token in Modal
  const handleConfirm = async () => {
    setShowTokenClaimModal(false);
    if (modalType === "claimToken") {
      handleTokenClaim();
    }
  };

  const approveTokens = async (amount) => {
    if (!signer || !address) return false;

    try {
      setIsApproving(true);
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        ERC20ABI.abi,
        signer
      );

      const approvalAmount = ethers.parseEther(amount);
      // Check current allowance
      const allowance = await tokenContract.allowance(
        address,
        STAKE_REWARD_CONTRACT_ADDRESS
      );

      if (allowance < approvalAmount) {
        // Approve for a large amount to avoid frequent approvals
        const tx = await tokenContract.approve(
          STAKE_REWARD_CONTRACT_ADDRESS,
          ethers.parseEther("1000000")
        );
        await tx.wait();
        toast.success("Token approval successful!");
        return true;
      }
      return true;
    } catch (error) {
      console.error("Token approval error:", error);
      if (
        error.message?.includes("rejected") ||
        error.message?.includes("denied")
      ) {
        toast.error("Approval rejected by user");
      } else {
        toast.error("Failed to approve tokens: " + error.message);
      }
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  // Handle staking tokens
  const handleStake = async () => {
    if (!signer || !address) {
      toast.error("Wallet not connected");
      setIsStaking(false);
      return;
    }

    if (!stakeAmount || isNaN(stakeAmount) || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid amount to stake");
      setIsStaking(false);
      return;
    }

    if (parseFloat(stakeAmount) > parseFloat(tokenBalance)) {
      toast.error(`You can only stake up to ${tokenBalance} tokens`);
      setIsStaking(false);
      return;
    }

    if (chainId !== 11155420n) {
      toast.error("Please switch to Optimism Sepolia network");
      setIsStaking(false);
      return;
    }

    setIsStaking(true);
    try {
      const stakingContract = new ethers.Contract(
        STAKE_REWARD_CONTRACT_ADDRESS,
        StakingRewardsABI.abi,
        signer
      );

      // First approve token transfer
      const approved = await approveTokens(stakeAmount);
      if (!approved) {
        setIsStaking(false);
        return;
      }

      // Execute stake transaction
      const amount = ethers.parseEther(stakeAmount);

      const tx = await stakingContract.stake(amount);
      await tx.wait();

      // Update UI
      setStakeAmount("");

      // Refresh data
      await refetchTokenBalance();
      await refreshStakingData();
    } catch (error) {
      let errorMessage = "Failed to stake tokens";
      if (error.reason) {
        errorMessage = `Failed to stake: ${error.reason}`;
      } else if (
        error.message.includes("rejected") ||
        error.message.includes("denied")
      ) {
        errorMessage = "Transaction rejected by user";
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient gas funds";
      }
      toast.error(errorMessage);
    } finally {
      setIsStaking(false);
    }
  };

  // Handle unstaking tokens
  const handleUnstake = async () => {
    if (!signer || !address) {
      toast.error("Wallet not connected");
      setIsUnstaking(false);
      return;
    }

    if (
      !unstakeAmount ||
      isNaN(unstakeAmount) ||
      parseFloat(unstakeAmount) <= 0
    ) {
      toast.error("Please enter a valid amount to unstake");
      setIsUnstaking(false);
      return;
    }

    if (parseFloat(unstakeAmount) > parseFloat(stakedAmount)) {
      toast.error(`You can only unstake up to ${stakedAmount} tokens`);
      setIsUnstaking(false);
      return;
    }

    if (chainId !== 11155420n) {
      toast.error("Please switch to Optimism Sepolia network");
      setIsUnstaking(false);
      return;
    }

    setIsUnstaking(true);
    try {
      const stakingContract = new ethers.Contract(
        STAKE_REWARD_CONTRACT_ADDRESS,
        StakingRewardsABI.abi,
        signer
      );

      const amount = ethers.parseEther(unstakeAmount);

      const tx = await stakingContract.unstake(amount);
      await tx.wait();

      setUnstakeAmount("");
      await refetchTokenBalance();
      await refreshStakingData();
    } catch (error) {
      let errorMessage = "Failed to unstake tokens";
      if (error.reason) {
        errorMessage = `Failed to unstake: ${error.reason}`;
      } else if (
        error.message.includes("rejected") ||
        error.message.includes("denied")
      ) {
        errorMessage = "Transaction rejected by user";
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient gas funds";
      }
      toast.error(errorMessage);
    } finally {
      setIsUnstaking(false);
    }
  };

  // Toggle ABI expansion
  const toggleAbiExpansion = () => {
    setIsAbiExpanded(!isAbiExpanded);
  };

  // Function to check if user is on Optimism Sepolia network
  const isOptimismSepoliaNetwork = () => {
    return chainId === 11155420n || chainId === 11155420;
  };

  return (
    <div className=" ">
      <div className="max-w-[1600px] mx-auto ">
        {/* Static Content */}
        <div className="">
          <h2 className="text-lg sm:text-xl text-white mb-3 sm:mb-4">StakingReward Template</h2>
          <p className="text-sm sm:text-base text-[#A2A2A2] mb-3 sm:mb-4">
            Stake ERC20 tokens and earn rewards based on your participation.
            Once the staking threshold is reached, you'll automatically receive
            Reward NFTs and points. No manual setup required—the job will be
            auto-created for you.
          </p>

          <div className="space-y-2">
            <h3 className="text-white text-base sm:text-lg mb-2">Setup Steps</h3>
            <ul className="list-disc list-inside text-sm sm:text-base text-[#A2A2A2] space-y-1 sm:space-y-2 ml-2">
              <li>Claim Tokens - Click to receive ERC20 tokens.</li>
              <li>Choose Action - Select "Stake" or "Unstake."</li>
              <li>Stake - Enter amount to lock tokens.</li>
              <li>Unstake - Only if you've staked before.</li>
              <li>
                Job Auto-Created - TriggerX creates the job based on your stake
                status.
              </li>
              <li>
                Earn Rewards - Receive NFTs + points once the threshold is met.
              </li>
            </ul>
          </div>
        </div>

        {/* Network Warning */}
        {isConnected && !isOptimismSepoliaNetwork() && (
          <div className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 p-3 sm:p-5 rounded-xl mt-4 sm:mt-6">
            <div className="flex items-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm sm:text-base text-yellow-400">
                Please switch to Optimism Sepolia network to claim tokens.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-[#A2A2A2] ml-6 sm:ml-7">
              Make sure you're connected to the correct network in your wallet.
            </p>
          </div>
        )}

        {/* Conditional Content - Only show if not connected or on the correct network */}
        {(!isConnected || isOptimismSepoliaNetwork()) && (
          <>
            <div className="rounded-xl ">
              <div className="text-[#A2A2A2]">
                {!isConnected ? (
                  <div className="flex flex-col items-center justify-center h-[150px] sm:h-[200px] text-[#A2A2A2] my-3">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                      <path d="M12 17C12.2833 17 12.521 16.904 12.713 16.712C12.905 16.52 13.0007 16.2827 13 16C12.9993 15.7173 12.9033 15.48 12.712 15.288C12.5207 15.096 12.2833 15 12 15C11.7167 15 11.4793 15.096 11.288 15.288C11.0967 15.48 11.0007 15.7173 11 16C10.9993 16.2827 11.0953 16.5203 11.288 16.713C11.4807 16.9057 11.718 17.0013 12 17ZM12 13C12.2833 13 12.521 12.904 12.713 12.712C12.905 12.52 13.0007 12.2827 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22Z" fill="#A2A2A2" />
                    </svg>
                    <p className="text-sm sm:text-lg mb-2">Wallet Not Connected</p>
                    <p className="text-sm sm:text-base text-center text-[#666666] mb-4 tracking-wide">
                      Please connect your wallet to interact with the contract
                    </p>
                  </div>
                ) : (
                  <div className="">
                    <div className="flex flex-wrap gap-4">
                      {hasSufficientBalance ? (
                        !hasSufficientTokenBalance && (
                          <button
                            onClick={showStakeTokenClaimModal}
                            className="bg-[#C07AF6] text-white lg:px-8 lg:py-3 px-4 py-2 my-5 rounded-full transition-all text-md lg:text-lg flex items-center hover:bg-[#B15AE6] hover:shadow-md hover:shadow-[#C07AF6]/20 hover:-translate-y-0.5"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {isClaimingToken ? "Claiming..." : "Claim Token"}
                          </button>
                        )
                      ) : (
                        <>
                          <ClaimEth />
                        </>
                      )}
                    </div>
                    {!hasSufficientBalance && (

                      <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-sm sm:text-base tracking-wide">
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
                        You need to claim ETH before Stake/Unstake Tokens.
                      </span>
                    )}
                    {hasSufficientBalance && !hasSufficientTokenBalance && (

                      <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-sm sm:text-base tracking-wide">
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
                        You need to claim tokens before staking them.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isConnected && (
              <>
                <TransactionModal
                  isOpen={showModal || showTokenClaimModal}
                  onClose={() => {
                    setShowModal(false);
                    setShowTokenClaimModal(false);
                  }}
                  onConfirm={handleConfirm}
                  modalType={modalType}
                  modalData={modalData}
                />

                {stakingContract && (
                  <>
                    <h2 className="text-md md:text-lg lg:text-xl text-white  flex items-center my-6">
                      Staking Reward Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg">
                        <h3 className="text-white text-md sm:text-lg mb-2">
                          Your Staked Amount
                        </h3>
                        <p className="text-[#F8FF7C] text-sm sm:text-2xl font-semibold">
                          {parseFloat(stakedAmount).toFixed(2)} Tokens
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg">
                        <h3 className="text-white text-base sm:text-lg mb-2">
                          Total Staked
                        </h3>
                        <p className="text-[#77E8A3] text-sm sm:text-2xl font-semibold">
                          {parseFloat(totalStaked).toFixed(2)} Tokens
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg">
                        <h3 className="text-white text-base sm:text-lg mb-2">NFT Reward</h3>
                        <p className="text-sm sm:text-2xl font-semibold">
                          {hasNFT ? (
                            <span className="text-[#77E8A3]">Received ✓</span>
                          ) : (
                            <span className="text-[#A2A2A2]">Not Yet</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg">
                        <h3 className="text-white text-base sm:text-lg mb-2">
                          Threshold for NFT Reward
                        </h3>
                        <p className="text-[#77E8A3]  text-sm sm:text-2xl font-semibold">
                          {THRESHOLD} STK
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg">
                        <h3 className="text-white text-base sm:text-lg mb-2">
                          Next Threshold for Reward Distribution
                        </h3>
                        <p className="text-[#77E8A3] text-sm sm:text-2xl font-semibold">
                          {parseFloat(nextThreshold).toFixed(2)} Tokens
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 sm:p-5 rounded-lg my-4 sm:my-6">
                      <h2 className="text-md sm:text-xl text-white mb-4 sm:mb-6">
                        Stake/Unstake Tokens
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-black/40 to-white/5 p-3 sm:p-5 rounded-xl border border-white/10">
                          <h3 className="text-base sm:text-lg text-white font-medium">
                            Stake Tokens
                          </h3>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="Amount to stake"
                                className="bg-white/5 border border-white/10 rounded-lg px-2 sm:px-4 py-3 sm:py-4 w-full pr-20 sm:pr-24 focus:outline-none focus:ring-2 focus:ring-[#F8FF7C]/30 transition-all"
                                step="0.1"
                                min="0"
                                disabled={
                                  !isInitialized ||
                                  isStaking ||
                                  !hasSufficientTokenBalance ||
                                  !hasSufficientBalance
                                }
                              />
                              <button
                                onClick={() => {
                                  if (tokenBalance)
                                    setStakeAmount(tokenBalance);
                                }}
                                disabled={
                                  !isInitialized ||
                                  !hasSufficientTokenBalance ||
                                  !hasSufficientBalance
                                }
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-xs text-white px-2 sm:px-3 py-1 rounded transition-colors"
                              >
                                MAX
                              </button>
                            </div>
                            <button
                              onClick={handleStake}
                              disabled={
                                !isInitialized ||
                                isStaking ||
                                !stakeAmount ||
                                !hasSufficientTokenBalance ||
                                !hasSufficientBalance
                              }
                              className={`bg-[#F8FF7C] text-black px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all whitespace-nowrap ${!isInitialized ||
                                isStaking ||
                                !stakeAmount ||
                                !hasSufficientTokenBalance ||
                                !hasSufficientBalance
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-[#E1E85A] hover:shadow-md hover:shadow-[#F8FF7C]/20 hover:-translate-y-0.5"
                                }`}
                            >
                              {isApproving
                                ? "Approving..."
                                : isStaking
                                  ? "Staking..."
                                  : "Stake"}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-[#A2A2A2]">
                            Available:{" "}
                            <span className="text-[#F8FF7C]">
                              {tokenBalance} STK
                            </span>
                          </p>
                        </div>

                        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-black/40 to-white/5 p-3 sm:p-5 rounded-xl border border-white/10">
                          <h3 className="text-base sm:text-lg text-white font-medium">
                            Unstake Tokens
                          </h3>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={unstakeAmount}
                                onChange={(e) =>
                                  setUnstakeAmount(e.target.value)
                                }
                                placeholder="Amount to unstake"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-3 sm:py-4 w-full pr-20 sm:pr-24 focus:outline-none focus:ring-2 focus:ring-[#F8FF7C]/30 transition-all"
                                step="0.1"
                                min="0"
                                max={stakedAmount}
                                disabled={
                                  !isInitialized ||
                                  !hasSufficientBalance ||
                                  isUnstaking ||
                                  parseFloat(stakedAmount) <= 0
                                }
                              />
                              <button
                                onClick={() => {
                                  if (parseFloat(stakedAmount) > 0)
                                    setUnstakeAmount(stakedAmount);
                                }}
                                disabled={
                                  !isInitialized ||
                                  parseFloat(stakedAmount) <= 0
                                }
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-xs text-white px-2 sm:px-3 py-1 rounded transition-colors"
                              >
                                MAX
                              </button>
                            </div>
                            <button
                              onClick={handleUnstake}
                              disabled={
                                !isInitialized ||
                                isUnstaking ||
                                !hasSufficientBalance ||
                                !unstakeAmount ||
                                parseFloat(stakedAmount) <= 0 ||
                                parseFloat(unstakeAmount) >
                                parseFloat(stakedAmount)
                              }
                              className={`bg-white text-black px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all whitespace-nowrap ${!isInitialized ||
                                isUnstaking ||
                                !unstakeAmount ||
                                parseFloat(stakedAmount) <= 0 ||
                                parseFloat(unstakeAmount) >
                                parseFloat(stakedAmount)
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-[#E1E1E1] hover:shadow-md hover:shadow-white/20 hover:-translate-y-0.5"
                                }`}
                            >
                              {isUnstaking ? "Unstaking..." : "Unstake"}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-[#A2A2A2]">
                            Staked:{" "}
                            <span className="text-[#F8FF7C]">
                              {stakedAmount} STK
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Job Configuration Form Layout */}
                    <div className=" rounded-lg mb-10">
                      <h2 className="text-md lg:text-lg md:text-md text-white my-6 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-[#F8FF7C]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Job Configuration
                      </h2>

                      {isConnected ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 text-base sm:text-lg ">
                          {[
                            {
                              key: "jobType",
                              parameter: "Job Type",
                              value: jobConfig.jobType,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-[#77E8A3]"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                            {
                              key: "argType",
                              parameter: "Arg Type",
                              value: jobConfig.argType,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-[#77E8A3]"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
                                  <path
                                    fillRule="evenodd"
                                    d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                            {
                              key: "targetContractAddress",
                              parameter: "Target Contract Address",
                              value: jobConfig.targetContractAddress,
                              isAddress: true,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-[#F8FF7C]"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                            {
                              key: "targetFunction",
                              parameter: "Target Function",
                              value: jobConfig.targetFunction,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-[#F8FF7C]"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                            {
                              key: "triggerContractAddress",
                              parameter: "Trigger Contract Address",
                              value: jobConfig.triggerContractAddress,
                              isAddress: true,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-purple-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                            {
                              key: "triggerEvent",
                              parameter: "Trigger Event",
                              value: jobConfig.triggerEvent,
                              icon: (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-purple-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path
                                    fillRule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ),
                            },
                          ].map((item) => (
                            <div
                              key={item.key}
                              className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 p-3 sm:p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/5 hover:-translate-y-1"
                            >
                              <div className="flex items-center mb-2 sm:mb-3">
                                {item.icon}
                                <h3 className="text-white text-base sm:text-lg font-medium ml-2">
                                  {item.parameter}
                                </h3>
                              </div>

                              {item.isAddress ? (
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center justify-between bg-black/30 rounded-lg p-2 border border-white/10 overflow-hidden">
                                    <p className="break-all text-[#A2A2A2] font-mono text-xs sm:text-sm overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                      {item.value.substring(0, 10)}...
                                      {item.value.substring(
                                        item.value.length - 4
                                      )}
                                    </p>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          item.value
                                        );
                                        toast.success(
                                          `${item.parameter} copied to clipboard!`
                                        );
                                      }}
                                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-all hover:scale-105"
                                    >
                                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[#A2A2A2] text-sm sm:text-lg break-all">
                                  {item.value}
                                </p>
                              )}
                            </div>
                          ))}

                          <div className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 p-3 sm:p-5 rounded-xl md:col-span-2">
                            <div className="flex gap-3 md:items-center justify-start mb-4 flex-col md:flex-row md:justify-between">
                              <div className="flex items-center ">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-blue-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <h3 className="text-white text-base sm:text-lg font-medium ml-2">
                                  Contract ABI
                                </h3>
                              </div>
                              <button
                                onClick={toggleAbiExpansion}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all hover:scale-105 justify-between"
                              >
                                <span className="text-white text-sm">
                                  {!isAbiExpanded ? "View ABI" : "Hide ABI"}
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 text-white transition-transform duration-300 ${isAbiExpanded ? "rotate-180" : ""}`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="flex items-center mb-3">
                              <p className="text-[#A2A2A2] text-sm md:text:lg">
                                The interface for the contract's
                                distributeNFTRewards function
                              </p>
                            </div>


                            {isAbiExpanded && (
                              <div className="mt-4">
                                <div className="bg-black/30 border border-white/10 p-4 rounded-lg overflow-x-auto transition-all animate-fadeIn">
                                  <pre className="text-[#A2A2A2] text-sm font-mono">
                                    {JSON.stringify(jobConfig.abi, null, 2)}
                                  </pre>
                                </div>
                                <div className="flex justify-end mt-3">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        JSON.stringify(jobConfig.abi, null, 2)
                                      );
                                      toast.success("ABI copied to clipboard!");
                                    }}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all hover:scale-105"
                                  >
                                    <Copy className="h-4 w-4 text-gray-400" />
                                    <span className="text-white text-sm">
                                      Copy ABI
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 p-10 rounded-xl text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto text-[#A2A2A2] mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <p className="text-[#A2A2A2] text-lg">
                            Please connect your wallet to view job configuration
                          </p>
                          <p className="text-white/50 text-sm mt-3">
                            Job configuration will display the automated process
                            details
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StakingReward;
