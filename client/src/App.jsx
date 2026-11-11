import {
  fetchHabits,
  addHabit,
  addDualHabit,
  deleteHabit,
  toggleCompleteHabit,
  fetchAnalytics,
  fetchFriends,
} from "./api";
import HabitCard from "./components/HabitCard";
import AnalyticsChart from "./components/AnalyticsChart";
import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import UserProfileModal from "./components/UserProfileModal";

function App() {
  const [habits, setHabits] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");
  const [isDualHabit, setIsDualHabit] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingHabitName, setDeletingHabitName] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem("username") || "",
  );

  const loadHabits = async () => {
    try {
      const data = await fetchHabits(selectedDate);
      setHabits(data);
      const analytics = await fetchAnalytics();
      setAnalyticsData(analytics);
      const friendsList = await fetchFriends();
      setFriends(friendsList);
      if (friendsList.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(friendsList[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleToggleComplete = async (habit) => {
    await toggleCompleteHabit(habit.id, selectedDate);
    loadHabits();
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      if (isDualHabit && selectedPartnerId) {
        await addDualHabit(newHabitName, selectedPartnerId);
      } else {
        await addHabit(newHabitName);
      }
      setNewHabitName("");
      setIsAdding(false);
      setIsDualHabit(false);
      loadHabits();
    } catch (error) {
      console.error("Error adding habit:", error);
      alert(error.message || "Failed to add habit");
    }
  };

  const handleDeleteHabit = async (name) => {
    const targetName =
      name || deletingHabitName || (habits[0] && habits[0].name);
    if (!targetName) return;
    if (window.confirm(`Are you sure you want to delete '${targetName}'?`)) {
      await deleteHabit(targetName);
      setDeletingHabitName("");
      setIsDeleting(false);
      loadHabits();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setHabits([]);
    setFriends([]);
    setAnalyticsData([]);
    setToken(null);
    setCurrentUsername("");
  };

  useEffect(() => {
    if (token) {
      loadHabits();
    }
  }, [selectedDate, token]);

  if (!token) {
    return (
      <AuthScreen
        onLoginSuccess={() => {
          setToken(localStorage.getItem("token"));
          setCurrentUsername(localStorage.getItem("username") || "");
        }}
      />
    );
  }

  return (
    <div
      className={`grid ${
        isSidebarOpen ? "grid-cols-[240px_1fr]" : "grid-cols-[70px_1fr]"
      } min-h-screen bg-[#E0B17D] text-[#2A1A0F] transition-all duration-300 font-sans`}
    >
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
              onClick={() => setIsProfileOpen(true)}
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
                onSubmit={handleAddHabit}
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
                      handleDeleteHabit(deletingHabitName);
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
                onClick={handleLogout}
                className="p-2 bg-[#251712] hover:bg-[#AB5419] text-[#F6EFE5] text-xs font-bold rounded transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="p-8 flex flex-col gap-6">
        <header className="flex justify-between items-center border-b border-[#7F2F07]/20 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#7F2F07]">
              My Habits
            </h1>
            <p className="text-[#6B5B47] text-sm italic mt-1">
              Record of daily pursuits & dual streaks
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ colorScheme: "light" }}
            className="px-3 py-1.5 bg-[#F6EFE5] border border-[#CDB494]/60 rounded-lg text-sm text-[#2A1A0F] font-semibold focus:outline-none focus:border-[#AB5419] shadow-sm cursor-pointer"
          />
        </header>

        {habits.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#7F2F07]/30 rounded-2xl bg-[#F6EFE5]/40 p-8 flex flex-col items-center gap-3">
            <span className="text-3xl">📜</span>
            <h3 className="text-lg font-bold text-[#7F2F07]">No Habits Recorded Yet</h3>
            <p className="text-xs text-[#6B5B47] max-w-sm">
              Use the sidebar to add a solo habit or link with a friend via Profile to start a Dual Streak!
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggleComplete}
              />
            ))}
          </div>
        )}

        <AnalyticsChart data={analyticsData} />
      </main>

      {/* User Profile & Friends Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          loadHabits();
        }}
      />
    </div>
  );
}

export default App;
