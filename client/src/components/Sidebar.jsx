import React from "react";

function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  onOpenProfile,
  friends,
  habits,
  isAdding,
  setIsAdding,
  newHabitName,
  setNewHabitName,
  isDualHabit,
  setIsDualHabit,
  selectedPartnerId,
  setSelectedPartnerId,
  onAddHabit,
  isDeleting,
  setIsDeleting,
  deletingHabitName,
  setDeletingHabitName,
  onDeleteHabit,
  currentUsername,
  onLogout,
}) {
  return (
    <aside
      className={`bg-[#7F2F07] border-r border-[#CDB494]/30 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        isSidebarOpen ? "p-5" : "p-4"
      }`}
    >
      <div className="flex flex-col gap-5">
        {/* Top Brand & Key Toggle */}
        <div className="flex items-center gap-3 border-b border-[#CDB494]/20 pb-4 h-12">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="focus:outline-none hover:opacity-80 transition-opacity"
          >
            <img
              src="/key.png"
              alt="toggle key"
              className="w-8 h-8 rounded-lg"
            />
          </button>
          {isSidebarOpen && (
            <span className="font-bold text-lg tracking-wider text-[#F6EFE5] italic">
              HabitTracker
            </span>
          )}
        </div>

        {/* User Profile & Friends Button */}
        {isSidebarOpen && (
          <button
            onClick={onOpenProfile}
            className="w-full py-2 px-3 bg-[#E0B17D]/20 hover:bg-[#E0B17D]/30 border border-[#CDB494]/30 text-[#F6EFE5] text-xs font-bold rounded-lg flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span>👤</span>
              <span>Profile & Friends</span>
            </span>
            {friends.length > 0 && (
              <span className="bg-[#AB5419] text-[#F6EFE5] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </button>
        )}

        {/* Add Habit Section */}
        {isSidebarOpen &&
          (!isAdding ? (
            <button
              onClick={() => {
                setIsAdding(true);
                setIsDeleting(false);
              }}
              className="p-2 bg-[#AB5419] hover:bg-[#AA7C4D] text-white text-xs font-bold rounded transition-colors shadow-sm"
            >
              + Add Habit
            </button>
          ) : (
            <form
              onSubmit={onAddHabit}
              className="flex flex-col gap-2 bg-[#251712]/40 p-2.5 rounded-lg border border-[#CDB494]/20"
            >
              <input
                type="text"
                autoFocus
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Habit name..."
                className="px-3 py-1.5 bg-[#251712] border border-[#CDB494]/30 rounded text-xs text-[#F6EFE5] placeholder-[#928464] focus:outline-none"
              />

              {/* Habit Type Selector (Solo vs Dual) */}
              {friends.length > 0 ? (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-[#F6EFE5]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="habitType"
                        checked={!isDualHabit}
                        onChange={() => setIsDualHabit(false)}
                        className="accent-[#AB5419]"
                      />
                      <span>Solo</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="habitType"
                        checked={isDualHabit}
                        onChange={() => setIsDualHabit(true)}
                        className="accent-[#AB5419]"
                      />
                      <span>👥 Dual</span>
                    </label>
                  </div>

                  {isDualHabit && (
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      className="px-2 py-1 bg-[#251712] text-[#F6EFE5] text-[11px] rounded border border-[#CDB494]/30 focus:outline-none"
                    >
                      {friends.map((f) => (
                        <option key={f.id} value={f.id}>
                          Partner: {f.username}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-[#CDB494]/80 italic">
                  💡 Connect a friend in Profile to create Dual Habits!
                </span>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 p-1.5 bg-[#AB5419] hover:bg-[#AA7C4D] text-white text-xs font-bold rounded transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 text-xs text-[#F6EFE5]"
                >
                  ✕
                </button>
              </div>
            </form>
          ))}

        {/* Delete Habit Section */}
        {isSidebarOpen &&
          habits.length > 0 &&
          (!isDeleting ? (
            <button
              onClick={() => {
                setIsDeleting(true);
                setIsAdding(false);
                if (habits.length > 0) setDeletingHabitName(habits[0].name);
              }}
              className="p-2 bg-[#AB5419]/20 hover:bg-[#AB5419]/40 text-[#F6EFE5] text-xs font-bold rounded border border-[#AB5419]/30 transition-colors"
            >
              - Delete Habit
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <select
                value={deletingHabitName}
                onChange={(e) => setDeletingHabitName(e.target.value)}
                className="px-2 py-1.5 bg-[#1a0f0b] text-[#F6EFE5] text-xs rounded border border-[#CDB494]/30 focus:outline-none"
              >
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.name}>
                    {habit.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDeleteHabit(deletingHabitName);
                    setIsDeleting(false);
                  }}
                  className="flex-1 p-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-2 text-xs text-[#F6EFE5]"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

        {/* Sidebar Footer */}
        {isSidebarOpen && (
          <div className="mt-auto pt-4 border-t border-[#CDB494]/20 flex flex-col gap-2">
            <div className="text-xs text-[#F6EFE5] italic">
              Logged in as:{" "}
              <span className="font-bold text-[#C98928]">
                {currentUsername}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 bg-[#251712] hover:bg-[#AB5419] text-[#F6EFE5] text-xs font-bold rounded transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
