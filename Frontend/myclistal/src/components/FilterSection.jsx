// ------------------ FILTER SECTION ------------------
export const FilterSection = ({
  search,
  setSearch,
  selectedTypes,
  toggleType,
  selectedStatuses,
  toggleStatus,
  sortDate,
  setSortDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => (
  <div className="bg-white shadow-md rounded-2xl p-5 mb-6 border border-gray-100">
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-1/3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-800 hover:shadow-sm">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by name or client email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-base font-medium text-gray-900">Type:</span>
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border ${
              selectedTypes.includes(t)
                ? " border-blue-800 text-white bg-blue-800"
                : "border-none shadow-sm text-gray-800 hover:border-2 hover:border-blue-800 bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-base font-medium text-gray-700">Status:</span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border ${
              selectedStatuses.includes(s)
                ? " border-blue-800 text-white bg-blue-800"
                : "border-none shadow-sm text-gray-800 hover:border-2 hover:border-blue-800 bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-base font-medium text-gray-900">Sort:</label>
        <select
          value={sortDate}
          onChange={(e) => setSortDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer bg-white hover:border-blue-800 focus:ring-2 focus:ring-blue-900 transition-all"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl hover:border-blue-800 transition-all">
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition-all"
        />
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition-all"
        />
      </div>
    </div>
  </div>
);