import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useChainId } from "wagmi";
import Modal from "react-modal";
import toast from "react-hot-toast";
import { Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { useWallet } from "../../contexts/WalletContext";

const ClaimModal = ({ isOpen, onClose, onConfirm, address, claimAmount }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const confettiCanvasRef = React.useRef(null);
  const chainId = useChainId();
  const { triggerBalanceRefresh } = useWallet();

  // Function to get network name based on chain ID
  const getNetworkName = () => {
    if (!chainId) return "Unknown Network";

    switch (chainId) {
      case 11155420:
        return "Optimism Sepolia";
      case 84532:
        return "Base Sepolia";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Reset states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setIsSuccess(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Function to play confetti inside modal
  const playModalConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, { resize: true });

    // Create a 3-second animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      // Release confetti from random positions
      myConfetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.6, x: Math.random() },
        colors: ["#FFD700", "#FFA500", "#F8FF7C"],
        shapes: ["circle"],
        scalar: 1.2,
      });
    }, 250);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsLoading(false);
      setIsSuccess(true);
      playModalConfetti();
      setTimeout(() => {
        console.log("Triggering balance refresh after successful claim");
        triggerBalanceRefresh();
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    console.log("..........", isSuccess);
  }, [isSuccess]);

  // Function to truncate address
  const truncateAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 7)}...${addr.substring(addr.length - 15)}`;
  };

  // Function to copy address and update icon
  const copyAddressToClipboard = () => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        toast.success("Address copied to clipboard!");
        setCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy address"));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={!isLoading ? onClose : undefined}
      contentLabel="Claim ETH"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] p-4 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-[95%] sm:w-full max-w-md z-[10000] overflow-hidden"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
    >
      {/* Confetti canvas overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {isSuccess ? (
        <div className="flex flex-col items-center justify-center text-center h-full py-4 sm:py-8 z-20 relative">
          <div className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">Woohoo!</div>
          <div className="text-lg sm:text-xl text-[#F8FF7C] font-bold mb-4 sm:mb-6">
            You claimed successfully!
          </div>
          <div className="text-base sm:text-lg mb-4 sm:mb-6">
            <span className="text-green-400 font-bold">{claimAmount} ETH</span>{" "}
            has been added to your wallet
          </div>
          <button
            onClick={() => {
              triggerBalanceRefresh();
              onClose();
            }}
            className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-white text-black font-semibold transition-all duration-300 hover:bg-gray-100 mt-4"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 z-20 relative">Claim ETH</h2>

          <div className="space-y-4 sm:space-y-6 z-20 relative">
            <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-lg">
              <div className="mb-3 sm:mb-4">
                <span className="text-sm sm:text-base text-gray-400">Network</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-white text-sm sm:text-base font-medium">
                    {getNetworkName()}
                  </span>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <span className="text-sm sm:text-base text-gray-400">Your Address</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-white text-sm sm:text-base font-medium">
                    {truncateAddress(address)}
                  </span>
                  <button
                    onClick={copyAddressToClipboard}
                    className="text-white bg-[#303030] hover:bg-[#404040] p-1 rounded-md"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2">
              <span className="text-sm sm:text-base text-gray-400">Claim Amount</span>
                <span className="mt-1 text-[#F8FF7C] font-bold text-sm sm:text-base">
                  {claimAmount} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-row sm:flex-row justify-between gap-3 sm:gap-5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 bg-white text-black ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Claiming...
                </span>
              ) : (
                "Claim"
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

const ClaimEth = () => {
  const { address } = useAccount();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimAmount] = useState("0.03");
  const { triggerBalanceRefresh } = useWallet();

  const handleClaim = () => {
    setShowClaimModal(true);
  };

  const confirmClaim = async () => {
    try {
      if (!address) {
        toast.error("Wallet not connected. Please connect your wallet first.");
        throw new Error("Wallet not connected");
      }

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      let networkName = "op_sepolia";
      if (chainId === "0x14a34") {
        networkName = "base_sepolia";
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/claim-fund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: address,
            network: networkName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to claim ETH");
      }

      const data = await response.json();
      console.log("Claim successful:", data);
      return true;
    } catch (error) {
      console.error("Claim error:", error);
      if (
        error.message?.includes("rejected") ||
        error.message?.includes("denied")
      ) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to claim ETH");
      }
      throw error;
    }
  };

  return (
    <>
      <button
        onClick={handleClaim}
        className="bg-[#F8FF7C] text-black px-4 sm:px-8 py-2 sm:py-3 my-3 sm:my-5 rounded-full transition-all text-base sm:text-lg flex items-center hover:bg-[#E1E85A] hover:shadow-md hover:shadow-[#F8FF7C]/20 hover:-translate-y-0.5 w-auto sm:w-auto justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Claim ETH
      </button>

      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          // Force a balance refresh when modal is closed
          triggerBalanceRefresh();
        }}
        onConfirm={confirmClaim}
        address={address}
        claimAmount={claimAmount}
      />
    </>
  );
};

export default ClaimEth;
