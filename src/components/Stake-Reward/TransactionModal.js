import React, { useState } from "react";
import Modal from "react-modal";
import { FiInfo } from "react-icons/fi";

const TransactionModal = ({
  isOpen,
  onClose,
  onConfirm,
  modalType,
  modalData,
}) => {
  const [showAmountTooltip, setShowAmountTooltip] = useState(false);
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Estimate Fee"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] p-4 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md z-[10000]"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
    >
      <h2 className="text-lg md:text-2xl font-bold mb-6">Transaction request</h2>

      <div className="space-y-6">
        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm sm:text-base md:text-lg">Interacting with</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm truncate max-w-[180px]">
                {modalData.contractAddress}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex text-sm sm:text-base md:text-lg items-center">
              {" "}
              Mintable Token Amount{" "}
              <div className=" ">
                <FiInfo
                  className="text-gray-400 hover:text-white cursor-pointer ml-2"
                  size={15}
                  onMouseEnter={() => setShowAmountTooltip(true)}
                  onMouseLeave={() => setShowAmountTooltip(false)}
                />
                {showAmountTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 top-7 sm:top-2 mt-2 p-2 sm:p-3 md:p-4 bg-[#181818] rounded-xl border border-[#4B4A4A] shadow-lg z-50 w-[200px] xs:w-[240px] sm:w-[280px] md:w-[320px]">
                    {/* Arrow */}
                    <div className="hidden sm:block absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-[#181818]"></div>
                    <div className="block sm:hidden absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-[#181818]"></div>
                    <div className="flex flex-col gap-1 sm:gap-2 text-[11px] xs:text-xs sm:text-sm text-gray-300">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span>
                          Amount of STK Token will be minted for experiment purpose. You can use it to stake/unstake in staking rewards contract.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-white font-medium text-sm sm:text-base md:text-lg">
              {modalData.amount} {modalData.token}
            </span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex text-sm sm:text-base md:text-lg"> Network Fee</div>
            <span className="text-gray-300 text-sm sm:text-base md:text-lg">{modalData.networkFee}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base md:text-lg">Speed</span>
            <div className="flex items-center">
              <div className="text-orange-400 mr-2 text-sm sm:text-base md:text-lg">
                <span className="mr-1">🦊</span>
                <span>Market</span>
              </div>
              <span className="text-sm sm:text-base md:text-lg">~{modalData.speed}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-4 rounded-lg">
          <div className="flex justify-between items-center flex-row">
            <span className="text-sm sm:text-base md:text-lg"> Method</span>
            <span className="text-gray-300 text-sm sm:text-base md:text-lg">{modalData.contractMethod}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-5">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 text-sm sm:text-base md:text-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-white text-black text-sm sm:text-base md:text-lg `}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
};

export default TransactionModal;
