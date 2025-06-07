import React from 'react';

const HighlightedData = ({ data, type, onCopyAddress, copyStatus, onViewProfile }) => {
  if (!data) return null;

  const renderStats = () => {
    switch (type) {
      case 'keeper':
        return (
          <>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F]  md:w-full sm:w-auto">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Performed</div>
              <div className="text-white font-semibold text-sm sm:text-base">{data.performed}</div>
            </h4>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F]  md:w-full sm:w-auto">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Attested</div>
              <div className="text-white font-semibold text-sm sm:text-base">{data.attested}</div>
            </h4>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F]  md:w-full sm:w-auto">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Points</div>
              <div className="text-white font-bold text-sm sm:text-base">{Number(data.points).toFixed(2)}</div>
            </h4>
          </>
        );
      case 'developer':
        return (
          <>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F] ">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Total Jobs</div>
              <div className="text-white font-semibold text-sm sm:text-base">{data.totalJobs}</div>
            </h4>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F] ">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Tasks Executed</div>
              <div className="text-white font-semibold text-sm sm:text-base">{data.tasksExecuted}</div>
            </h4>
            <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F]  ">
              <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Points</div>
              <div className="text-white font-semibold text-sm sm:text-base">{Number(data.points).toFixed(2)}</div>
            </h4>
          </>
        );
      case 'contributor':
        return (
          <h4 className="bg-[#181818] rounded-lg px-3 sm:px-4 py-2 border border-[#5F5F5F]  md:w-full sm:w-auto">
            <div className="text-gray-400 text-sm sm:text-md mb-1 lg:text-lg">Points</div>
            <div className="text-white font-semibold text-sm sm:text-base">{Number(data.points).toFixed(2)}</div>
          </h4>
        );
      default:
        return null;
    }
  };

  const renderTitle = () => {
    switch (type) {
      case 'keeper':
        return (
          <div className="bg-[#181818] p-2 sm:p-3 flex items-center gap-1 rounded-lg w-full">
            <h4 className="text-base sm:text-xl font-medium text-[#A2A2A2] break-all">
              {data.operator} : {data.address}{' '}

            </h4>
          </div>
        );
      case 'developer':
        return (
          <div className="flex items-center mb-3 w-full justify-center lg:justify-start md:justify-start">
            <p className="text-gray-400 text-sm sm:text-base bg-[#181818] p-2 sm:p-3 rounded-lg flex items-center break-all ">
              <span className="truncate lg:hidden md:hidden ">
                {data.address
                  ? `${data.address.substring(0, 15)}...${data.address.substring(data.address.length - 4)}`
                  : ''}
              </span>
              <span className="truncate lg:block md:block hidden ">
                {data.address}

              </span>

            </p>
          </div>
        );
      case 'contributor':
        return (
          <div className="flex items-center bg-[#181818] p-2 sm:p-3 rounded-lg w-full">
            <h4 className="text-xl sm:text-2xl font-semibold text-white mb-0 sm:mb-2">{data.name}</h4>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#212020] rounded-lg">
      <div className="mb-4 sm:mb-8 p-4 sm:p-6 rounded-xl shadow-lg bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#FBF197]">
        <div className="flex lg:flex-row md:flex-col flex-col gap-4 items-center">
          <div className="w-full">{renderTitle()}</div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-full">
              {renderStats()}
            </div>
            {onViewProfile && (
              <h4 className="w-full sm:w-auto text-center sm:text-left">
                <button
                  onClick={() => onViewProfile(data.address)}
                  className="px-4 sm:px-5 py-2 text-sm sm:text-md text-white underline decoration-2 decoration-white underline-offset-4 w-full sm:w-auto"
                >
                  View Profile
                </button>
              </h4>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightedData; 