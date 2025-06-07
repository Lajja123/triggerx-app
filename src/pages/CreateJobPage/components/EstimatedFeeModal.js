import Modal from "react-modal";
import { FiInfo } from "react-icons/fi";
import React, { useEffect, useRef, useState } from "react";
import { Tooltip } from "antd";
import { useBalance, useAccount } from "wagmi";

if (typeof window !== "undefined") {
  Modal.setAppElement("#root");
}

export function EstimatedFeeModal({
  isOpen,
  showProcessing,
  showFees,
  setIsLoading,
  steps,
  onClose,
  estimatedFee,
  isSubmitting,
  userBalance,
  onStake,
  isJobCreated,
  handleDashboardClick,
}) {
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({
    address,
  });

  const hasEnoughBalance = userBalance >= estimatedFee;
  const requiredEth = (0.001 * estimatedFee).toFixed(6);
  const hasEnoughEthToStake =
    ethBalance && Number(ethBalance.formatted) >= Number(requiredEth);
  const [showRequiredTGTooltip, setShowRequiredTGTooltip] = useState(false);
  const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);
  const [showStakeTooltip, setShowStakeTooltip] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const canvasRef = useRef(null);
  const [character, setCharacter] = useState([{ x: 10, y: 10 }]); // Character instead of snake
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0); // Track animation frame

  const gridSize = 17;
  const tileSize = 28;

  const [foodEatenAnimation, setFoodEatenAnimation] = useState(null);

  const resetProcessing = () => {
    setCurrentStep(0);
    setGameStarted(false);
    setCharacter([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection("RIGHT");
    setGameOver(false);
    setScore(0);
    setShowRequiredTGTooltip(false);
    setShowBalanceTooltip(false);
    setShowStakeTooltip(false);
    setFoodEatenAnimation(null);
    setFrameIndex(0);

  };

  useEffect(() => {
    if (
      currentStep < steps.length &&
      steps[currentStep].status === "completed"
    ) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 10000);
    }
  }, [steps, currentStep]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
      };
      if (keyMap[e.key] && !gameOver) {
        setDirection(keyMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, gameStarted]);

  // Load character frames
  const characterFrames = [];
  for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `/character/frame${i}.svg`; // Update with actual path
    characterFrames.push(img);
  }

  // Load Ethereum token image
  const ethImage = new Image();
  ethImage.src = "/character/token.svg";
  // "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg";

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveCharacter = () => {
      if (!gameStarted || gameOver) return;
      setCharacter((prevCharacter) => {
        let newCharacter = [...prevCharacter];
        let head = { ...newCharacter[0] };

        switch (direction) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
          default:
            break;
        }

        // Check if character hits the boundary
        if (
          head.x < 0 ||
          head.x >= gridSize ||
          head.y < 0 ||
          head.y >= gridSize
        ) {
          setGameOver(true);
          return prevCharacter;
        }

        newCharacter.unshift(head);

        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => prev + 0.5);
          setFood({
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize),
          });
          // Trigger "+1" animation at the food's position
          setFoodEatenAnimation({ x: food.x, y: food.y });
          setTimeout(() => setFoodEatenAnimation(null), 500); // Duration of the animation (0.5 seconds)
        } else {
          newCharacter.pop();
        }

        return newCharacter;
      });
      // Update frame for animation
      setFrameIndex((prev) => (prev + 1) % 10);
    };

    const gameLoop = setInterval(moveCharacter, 200);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Character
    const currentFrame = characterFrames[frameIndex];
    character.forEach((segment) => {
      ctx.save();
      ctx.translate(
        segment.x * tileSize + tileSize / 2,
        segment.y * tileSize + tileSize / 2
      );

      if (direction === "LEFT") {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        currentFrame,
        direction === "LEFT" ? -tileSize / 2 : -tileSize / 2,
        -tileSize / 2,
        tileSize,
        tileSize
      );

      ctx.restore();
    });

    // Draw Ethereum token
    ctx.drawImage(
      ethImage,
      food.x * tileSize,
      food.y * tileSize,
      tileSize,
      tileSize
    );

    // Draw "+1" animation
    if (foodEatenAnimation) {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(
        "+1",
        foodEatenAnimation.x * tileSize + tileSize / 4,
        foodEatenAnimation.y * tileSize + tileSize / 1.5 // Adjust vertical position
      );
    }

    if (!gameStarted) {
      ctx.fillStyle = "yellow";
      ctx.font = "18px Arial";
      ctx.fillText(
        "Fee-ding time! Tap to start the token tango",
        canvas.width / 6 - 10,
        canvas.height / 3 + 30
      );
      ctx.fillText(
        "while we calculate your job fees.",
        canvas.width / 6 + 30,
        canvas.height / 3 + 60
      );
      ctx.fillText(
        "Use arrow keys to feast!🍀",
        canvas.width / 3 - 30,
        canvas.height / 3 + 100
      );
    }

    if (gameOver) {
      ctx.fillStyle = "yellow";
      ctx.font = "18px Arial";
      ctx.fillText(
        "Fee-ding frenzy finished!",
        canvas.width / 4 + 30,
        canvas.height / 3 + 30
      );
      ctx.fillText(
        "Still brewing up your job fees... almost there!🍀⌛",
        canvas.width / 10 - 5,
        canvas.height / 3 + 60
      );
      ctx.fillText(
        `Score: ${score}`,
        canvas.width / 3 + 50,
        canvas.height / 2 + 30
      );

    }

    if (gameOver) {
      ctx.fillStyle = "#82fbd0";
      ctx.font = "20px Arial";

      ctx.fillText(
        "Tap to Restart",
        canvas.width / 3 + 20,
        canvas.height / 2 + 60
      );
    }
  }, [character, food, isOpen, gameOver, gameStarted, score, frameIndex, characterFrames, ethImage, direction, foodEatenAnimation]);

  useEffect(() => {
    if (isOpen) {
      resetProcessing(); // Reset on modal open
      document.body.style.overflow = "hidden";
    } else {
      resetProcessing(); // Reset on modal close
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset"; // Cleanup on unmount
    };
  }, [isOpen]);

  const handleCanvasClick = () => {
    if (!gameStarted || gameOver) {
      setGameStarted(true);
      setCharacter([{ x: 10, y: 10 }]);
      setFood({ x: 15, y: 15 });
      setDirection("RIGHT");
      setGameOver(false);
      setScore(0);
    }
  };
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleClose = () => {
    resetProcessing();
    document.body.style.overflow = "unset"; // Enable scroll on close
    onClose();
  };

  const handleStake = () => {
    document.body.style.overflow = "unset"; // Enable scroll on stake
    onStake();
  };

  const isFeeInvalid = !estimatedFee || estimatedFee <= 0;

  const isDisabled = isSubmitting || isFeeInvalid;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Estimate Fee"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] p-4 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-[95%] sm:w-full max-w-md z-[10000]"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
    >
      {showProcessing && !showFees && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <h3 className="text-white text-lg sm:text-xl text-center">Creating Job</h3>
          <div className="w-full sm:w-auto">
            {currentStep < steps.length && (
              <div
                key={steps[currentStep].id}
                className="transition-all duration-700 ease-in-out animate-pulse"
              >
                <h4 className="text-sm sm:text-md">{steps[currentStep].text}</h4>
              </div>
            )}
            {currentStep >= steps.length && (
              <div
                key={steps[steps.length - 1].id}
                className="transition-all duration-700 ease-in-out animate-pulse"
              >
                <h4 className="text-sm sm:text-md">{steps[steps.length - 1].text}</h4>
              </div>
            )}
            <div className="h-1.5 bg-gray-500 opacity-50 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#F8FF7C] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-black rounded-xl flex flex-col gap-2 shadow-lg border border-gray-600 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={gridSize * tileSize}
          height={gridSize * tileSize}
          onClick={handleCanvasClick}
          className="w-full h-auto"
        />
      </div>
      <div className="text-white text-center py-2 text-sm sm:text-base">Score: {score}</div>
      {!isJobCreated ? (
        <>
          {showFees && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold my-4 sm:my-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white text-center">
                Estimated Fee
              </h2>
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="text-gray-300 flex flex-row  justify-between gap-1 sm:gap-0  items-center">
                  <div className="flex items-center">
                    <p className="text-sm sm:text-base">Required TG</p>
                    <div className="">
                      <FiInfo
                        className="text-gray-400 hover:text-white cursor-pointer ml-2"
                        size={15}
                        onMouseEnter={() => setShowRequiredTGTooltip(true)}
                        onMouseLeave={() => setShowRequiredTGTooltip(false)}
                      />
                      {showRequiredTGTooltip && (
                        <div className="absolute left-1/2 -translate-x-1/2 sm:right-0 sm:left-auto sm:translate-x-0 top-7 sm:top-auto sm:mt-2 mt-2 p-2 sm:p-3 md:p-4 bg-[#181818] rounded-xl border border-[#4B4A4A] shadow-lg z-50 w-[200px] xs:w-[240px] sm:w-[280px] md:w-[320px]">
                          {/* Arrow */}
                          <div className="hidden sm:block absolute -right-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#181818]"></div>
                          <div className="block sm:hidden absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-[#181818]"></div>
                          <div className="flex flex-col gap-1 sm:gap-2 text-[11px] xs:text-xs sm:text-sm text-gray-300">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span>
                                TriggerGas (TG) is the standard unit for calculating
                                computational and resource costs on the TriggerX
                                platform.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base">
                    {" "}
                    {estimatedFee && estimatedFee > 0
                      ? ` ${estimatedFee.toFixed(2)} TG`
                      : "Something went wrong"}
                  </p>
                </div>

                <div className="text-gray-300 flex flex-row justify-between gap-1 sm:gap-0">
                  <p className="text-sm sm:text-base">Your TG Balance</p>
                  <Tooltip title={userBalance || "0"} placement="top">
                    <p className="cursor-help text-sm sm:text-base">
                      {userBalance ? Number(userBalance).toFixed(2) : "0.0000"}{" "}
                    </p>
                  </Tooltip>
                </div>

                {!hasEnoughBalance && (
                  <div className="text-gray-300 flex flex-row justify-between gap-1 sm:gap-0 items-center">
                    <div className="flex items-center">
                      <p className="text-sm sm:text-base">Required ETH to TG</p>
                      <div className="">
                        <FiInfo
                          className="text-gray-400 hover:text-white cursor-pointer ml-2"
                          size={15}
                          onMouseEnter={() => setShowStakeTooltip(true)}
                          onMouseLeave={() => setShowStakeTooltip(false)}
                        />
                        {showStakeTooltip && (
                          <div className="absolute left-1/2 -translate-x-1/2 sm:right-0 sm:left-auto sm:translate-x-0 top-7 sm:top-auto sm:mt-2 mt-2 p-2 sm:p-3 md:p-4 bg-[#181818] rounded-xl border border-[#4B4A4A] shadow-lg z-50 w-[200px] xs:w-[240px] sm:w-[280px] md:w-[320px]">
                            {/* Arrow */}
                            <div className="hidden sm:block absolute -right-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#181818]"></div>
                            <div className="block sm:hidden absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-[#181818]"></div>
                            <div className="flex flex-col gap-1 sm:gap-2 text-[11px] xs:text-xs sm:text-sm text-gray-300">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span>
                                  Required ETH to Stake is based on the total
                                  TriggerXGas consumed and TriggerXGas Unit Price.
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm sm:text-base"> {(0.001 * estimatedFee).toFixed(2)} ETH </p>
                  </div>
                )}
              </div>
              <div className="flex flex-row sm:flex-row gap-3 sm:gap-4">
                {hasEnoughBalance ? (
                  <button
                    onClick={handleStake}
                    disabled={isDisabled}
                    className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${isDisabled
                      ? "bg-gray-400 text-gray-700 "
                      : "bg-white text-black"
                      }`}
                  >
                    {isSubmitting ? "Processing..." : "Next"}
                  </button>
                ) : (
                  <button
                    onClick={handleStake}
                    disabled={!hasEnoughEthToStake || isSubmitting}
                    className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${!hasEnoughEthToStake || isSubmitting
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-white text-black"
                      }`}
                  >
                    {isSubmitting ? "Staking..." : hasEnoughEthToStake ? "Top Up TG" : "Insufficient ETH"}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 rounded-full font-semibold hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:mt-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#A2A2A2] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-white text-lg sm:text-xl text-center">Job Created Successfully!</h3>
          <p className="text-gray-400 text-center text-sm sm:text-base">Your job has been created and is now active.</p>
          <button onClick={handleDashboardClick}
            className="relative bg-[#222222] text-[#000000] border border-[#222222] px-4 sm:px-6 py-2 sm:py-3 rounded-full group transition-transform w-full sm:w-auto">
            <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
            <span className="absolute inset-0 bg-[#FFFFFF] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
            <span className="font-actayRegular relative z-10 px-0 py-2 sm:py-3 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-sm">
              Go to Dashboard
            </span>
          </button>
        </div>
      )}
    </Modal>
  );
}