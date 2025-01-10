export function TimeframeInputs({ timeframe, onTimeframeChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Timeframe
      </label>
      <div className="grid grid-cols-3 gap-4">
        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none  transition-all duration-300">
          <label className="block text-sm pb-3 tracking-wider">Years</label>
          <input
            type="number"
            value={timeframe.years}
            onChange={(e) => onTimeframeChange("years", e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none"
            placeholder="Years"
            min="0"
          />
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400  transition-all duration-300">
          <label className="block text-sm pb-3 tracking-wider">Months</label>
          <input
            type="number"
            value={timeframe.months}
            onChange={(e) => onTimeframeChange("months", e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none"
            placeholder="Months"
            min="0"
            max="11"
          />
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-all duration-300">
          <label className="block text-sm pb-3 tracking-wider">Days</label>
          <input
            type="number"
            value={timeframe.days}
            onChange={(e) => onTimeframeChange("days", e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none"
            placeholder="Days"
            min="0"
            max="30"
          />
        </div>
      </div>
    </div>
  );
}
