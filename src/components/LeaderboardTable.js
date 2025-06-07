import React from 'react';
import { Tooltip } from 'antd';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

const LeaderboardTable = ({
  type,
  data,
  isLoading,
  isConnected,
  connectedAddress,
  copyStatus,
  onCopyAddress,
  onViewProfile,
  sortConfig,
  onSort,
}) => {
  const getColumns = () => {
    switch (type) {
      case 'keeper':
        return [
          { key: 'operator', label: 'Operator', sortable: false },
          { key: 'address', label: 'Address', sortable: false },
          { key: 'performed', label: 'Job Performed', sortable: true },
          { key: 'attested', label: 'Job Attested', sortable: false },
          { key: 'points', label: 'Points', sortable: true },
          { key: 'profile', label: 'Profile', sortable: false },
        ];
      case 'developer':
        return [
          { key: 'address', label: 'Address', sortable: false },
          { key: 'totalJobs', label: 'Total Jobs', sortable: true },
          { key: 'tasksExecuted', label: 'Task Performed', sortable: true },
          { key: 'points', label: 'Points', sortable: true },
        ];
      case 'contributor':
        return [
          { key: 'name', label: 'Name', sortable: false },
          { key: 'points', label: 'Points', sortable: true },
          { key: 'profile', label: 'Profile', sortable: false },
        ];
      default:
        return [];
    }
  };

  const renderSortIcon = (columnKey) => {
    if (!columnKey) return null;

    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? (
        <Tooltip title="Sort ascending">
          <FiChevronUp className="inline ml-1 text-[#C07AF6]" />
        </Tooltip>
      ) : (
        <Tooltip title="Sort descending">
          <FiChevronDown className="inline ml-1 text-[#C07AF6]" />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Sort descending">
        <FiChevronDown className="inline ml-1 text-[#A2A2A2]" />
      </Tooltip>
    );
  };

  const renderCell = (item, column) => {
    switch (column.key) {
      case 'operator':
        return item.operator;
      case 'address':
        if (!item.address) return 'null';
        return (
          <div className="flex items-center">
            <span className="truncate max-w-[180px] md:max-w-[220px] lg:max-w-[250px] lg:hidden md:hidden  ">
              {`${item.address.substring(0, 5)}...${item.address.substring(item.address.length - 4)}`}
            </span>
            <span className="truncate lg:block md:block hidden ">
              {`${item.address.substring(0, 15)}...${item.address.substring(item.address.length - 4)}`}
            </span>
            <button
              onClick={() => onCopyAddress(item.address)}
              className="ml-2 p-1 hover:bg-[#252525] rounded-md transition-all"
              title="Copy address"
            >
              {copyStatus[item.address] ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#82FBD0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#A2A2A2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        );
      case 'performed':
        return item.performed;
      case 'attested':
        return item.attested;
      case 'totalJobs':
        return item.totalJobs;
      case 'tasksExecuted':
        return item.tasksExecuted;
      case 'points':
        return (
          <span className="px-7 py-3 bg-[#F8FF7C] text-md border-none font-extrabold text-black md:text-[15px] xs:text-[12px] rounded-full w-[200px]">
            {Number(item.points).toFixed(2)}
          </span>
        );
      case 'profile':
        return (
          <Tooltip title="View Profile" color="#2A2A2A">
            <button
              onClick={() => onViewProfile(item.address)}
              className="px-5 py-2 text-sm text-white underline decoration-2 decoration-white underline-offset-4"
            >
              View
            </button>
          </Tooltip>
        );
      case 'name':
        return item.name;
      default:
        return null;
    }
  };

  const renderEmptyState = () => (
    <tr>
      <td colSpan={getColumns().length} className="text-center text-[#A2A2A2] py-5">
        <div className="flex flex-col items-center justify-center h-[200px] text-[#A2A2A2]">
          {type === 'contributor' ? (
            <>
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
              <p className="text-sm sm:text-base lg:text-lg mb-2">
                Contributor Leaderboard Coming Soon
              </p>
              <p className="text-sm text-[#A2A2A2]">
                Stay tuned for exciting updates!
              </p>
            </>
          ) : (
            <>
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
              <p className="text-sm sm:text-base lg:text-lg mb-2">
                No {type} data available
              </p>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderMobileCards = () => (
    <div className="flex flex-col gap-4 md:hidden items-center">
      {data.length > 0 ? (
        data.map((item, idx) => (
          <div
            key={idx}
            className={`bg-[#1A1A1A] rounded-xl p-4 shadow-md border border-[#2A2A2A] w-full `}
          >
            {getColumns().map((column) => (
              <div key={column.key} className="flex justify-between items-center py-2">
                <span className="text-sm text-white font-bold">{column.label}:</span>
                <span className=" text-[#A2A2A2] text-sm ">{renderCell(item, column)}</span>
              </div>
            ))}
          </div>
        ))
      ) : (
        renderEmptyState()
      )}
    </div>
  );

  return (
    <div className="bg-[#141414] p-3 sm:p-7 rounded-lg overflow-auto">
      {/* Desktop Table */}
      <table className="w-full border-separate border-spacing-y-4 max-h-[650px] h-auto hidden md:table">
        <thead className="sticky top-0 bg-[#303030] text-nowrap">
          <tr>
            {getColumns().map((column, index) => (
              <th
                key={column.key}
                className={`px-6 py-5 text-left text-[#FFFFFF] font-bold text-xs md:text-lg ${column.sortable ? 'cursor-pointer select-none' : ''
                  } ${index === 0 ? 'rounded-tl-lg rounded-bl-lg' : ''
                  } ${index === getColumns().length - 1 ? 'rounded-tr-lg rounded-br-lg' : ''
                  }`}
                onClick={() => column.sortable && onSort(column.key)}
              >
                {column.label}
                {column.sortable && renderSortIcon(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!isLoading && data.length > 0 ? (
            data.map((item, index) => (
              <tr
                key={index}
                className={
                  isConnected && item.address === connectedAddress
                    ? "bg-[#271039] border-2 border-[#C07AF6]"
                    : ""
                }
              >
                {getColumns().map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`bg-[#1A1A1A] px-6 py-5 text-[#A2A2A2] md:text-md lg:text-lg xs:text-[12px] border ${colIndex === 0 ? 'border-r-0 rounded-tl-lg rounded-bl-lg' : ''
                      } ${colIndex === getColumns().length - 1 ? 'border-l-0 rounded-tr-lg rounded-br-lg' : ''
                      } ${colIndex !== 0 && colIndex !== getColumns().length - 1 ? 'border-l-0 border-r-0' : ''
                      } border-[#2A2A2A]`}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            renderEmptyState()
          )}
        </tbody>
      </table>
      {/* Mobile Cards */}
      <div className="block md:hidden">
        {renderMobileCards()}
      </div>
    </div>
  );
};

export default LeaderboardTable; 