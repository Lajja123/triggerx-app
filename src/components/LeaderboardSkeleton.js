import React from "react";

const LeaderboardSkeleton = ({ activeTab }) => {
  const skeletonRows = Array(5).fill(null);

  const renderKeeperSkeleton = () => (
    <table className="w-full border-separate border-spacing-y-4">
      <thead className="sticky top-0 bg-[#2A2A2A]">
        <tr>
          <th className="px-5 py-5 text-left rounded-tl-lg rounded-bl-lg">
            <div className="h-6 bg-gray-700 rounded w-24"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-24"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-24"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-20"></div>
          </th>
          <th className="px-6 py-5 text-left rounded-tr-lg rounded-br-lg">
            <div className="h-6 bg-gray-700 rounded w-20"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {skeletonRows.map((_, index) => (
          <tr key={index}>
            <td className="px-5 py-5 border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg bg-[#1A1A1A]">
              <div className="h-6 bg-gray-700 rounded w-32"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-r-0 border-[#2A2A2A]">
              <div className="h-6 bg-gray-700 rounded w-40"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-r-0 border-[#2A2A2A]">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-r-0 border-[#2A2A2A]">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-[#2A2A2A] border-r-0">
              <div className="px-7 py-3 bg-gray-700 rounded-lg w-24"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
              <div className="h-8 bg-gray-700 rounded w-16"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDeveloperSkeleton = () => (
    <table className="w-full border-separate border-spacing-y-4">
      <thead className="sticky top-0 bg-[#2A2A2A]">
        <tr>
          <th className="px-6 py-5 text-left rounded-tl-lg rounded-bl-lg">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-24"></div>
          </th>
          <th className="px-6 py-5 text-left">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </th>
          <th className="px-6 py-5 text-left rounded-tr-lg rounded-br-lg">
            <div className="h-6 bg-gray-700 rounded w-20"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {skeletonRows.map((_, index) => (
          <tr key={index}>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg">
              <div className="h-6 bg-gray-700 rounded w-40"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-r-0 border-[#2A2A2A]">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-r-0 border-[#2A2A2A]">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
              <div className="px-7 py-3 bg-gray-700 rounded-lg w-24"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderContributorSkeleton = () => (
    <table className="w-full border-separate border-spacing-y-4">
      <thead className="sticky top-0 bg-[#2A2A2A]">
        <tr>
          <th className="px-6 py-5 text-center rounded-tl-lg rounded-bl-lg">
            <div className="h-6 bg-gray-700 rounded w-24 mx-auto"></div>
          </th>
          <th className="px-6 py-5 text-center">
            <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
          </th>
          <th className="px-6 py-5 text-center rounded-tr-lg rounded-br-lg">
            <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {skeletonRows.map((_, index) => (
          <tr key={index}>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-r-0 border-[#2A2A2A] rounded-tl-lg rounded-bl-lg">
              <div className="h-6 bg-gray-700 rounded w-32 mx-auto"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-[#2A2A2A] border-r-0">
              <div className="px-7 py-3 bg-gray-700 rounded-lg w-24 mx-auto"></div>
            </td>
            <td className="bg-[#1A1A1A] px-6 py-5 border border-l-0 border-[#2A2A2A] rounded-tr-lg rounded-br-lg">
              <div className="h-8 bg-gray-700 rounded-full w-20 mx-auto"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderKeeperMobileSkeleton = () => (
    <div className="flex flex-col gap-4 md:hidden">
      {skeletonRows.map((_, idx) => (
        <div key={idx} className="bg-[#1A1A1A] rounded-xl p-4 shadow-md border border-[#2A2A2A] w-full">
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDeveloperMobileSkeleton = () => (
    <div className="flex flex-col gap-4 md:hidden">
      {skeletonRows.map((_, idx) => (
        <div key={idx} className="bg-[#1A1A1A] rounded-xl p-4 shadow-md border border-[#2A2A2A] w-full">
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContributorMobileSkeleton = () => (
    <div className="flex flex-col gap-4 md:hidden">
      {skeletonRows.map((_, idx) => (
        <div key={idx} className="bg-[#1A1A1A] rounded-xl p-4 shadow-md border border-[#2A2A2A] w-full">
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="h-4 w-20 bg-gray-700 rounded"></span>
            <span className="h-4 w-24 bg-gray-700 rounded"></span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-pulse">
      <div className="overflow-y-auto max-w-[1600px] mx-auto w-full bg-[#141414] px-5 rounded-lg">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block">
          {activeTab === "keeper" && renderKeeperSkeleton()}
          {activeTab === "developer" && renderDeveloperSkeleton()}
          {activeTab === "contributor" && renderContributorSkeleton()}
        </div>
        {/* Mobile Card Skeleton */}
        <div className="block md:hidden">
          {activeTab === "keeper" && renderKeeperMobileSkeleton()}
          {activeTab === "developer" && renderDeveloperMobileSkeleton()}
          {activeTab === "contributor" && renderContributorMobileSkeleton()}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardSkeleton;