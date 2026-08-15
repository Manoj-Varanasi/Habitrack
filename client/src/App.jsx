import {
  fetchHabits,
  addHabit,
  deleteHabit,
  toggleCompleteHabit,
  fetchAnalytics,
} from "./api";
import HabitCard from "./components/HabitCard";
import AnalyticsChart from "./components/AnalyticsChart";
import React, { useState, useEffect } from "react";

function App() {
  const [habits, setHabits] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingHabitName, setDeletingHabitName] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const loadHabits = async () => {
    try {
      const data = await fetchHabits(selectedDate);
      setHabits(data);
      const analytics = await fetchAnalytics();
      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleToggleComplete = async (habit) => {
    const today = new Date().toISOString().split("T")[0];
    await toggleCompleteHabit(habit.id, selectedDate);
    loadHabits();
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    await addHabit(newHabitName);
    setNewHabitName("");
    loadHabits();
  };

  const handleDeleteHabit = async (name) => {
    if (!name) return;
    if (window.confirm(`Are you sure you want to delete '${name}'?`)) {
      await deleteHabit(name);
      setDeletingHabitName("");
      loadHabits();
    }
  };

  useEffect(() => {
    loadHabits();
  }, [selectedDate]);
  return (
    <div
      className={`grid ${isSidebarOpen ? "grid-cols-[220px_1fr]" : "grid-cols-[70px_1fr]"} min-h-screen bg-[#E0B17D] text-[#2A1A0F] transition-all duration-300 font-sans`}
    >
      <aside
        className={`bg-[#7F2F07] border-r border-[#CDB494]/30 flex flex-col justify-between overflow-hidden transition-all duration-300 ${isSidebarOpen ? "p-5" : "p-4"}`}
      >
        <div className="flex flex-col gap-6">
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

          {isSidebarOpen &&
            (!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="p-2 bg-[#AB5419] hover:bg-[#AA7C4D] text-white text-xs font-bold rounded"
              >
                + Add Habit
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  handleAddHabit(e);
                  setIsAdding(false);
                }}
                className="flex flex-col gap-2"
              >
                <input
                  type="text"
                  autoFocus
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="New habit name..."
                  className="px-3 py-2 bg-[#251712] border border-[#CDB494]/30 rounded text-xs text-[#F6EFE5] placeholder-[#928464] focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 p-1.5 bg-[#AB5419] text-white text-xs font-bold rounded"
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
          {isSidebarOpen &&
            (!isDeleting ? (
              <button
                onClick={() => {
                  setIsDeleting(true);
                  if (habits.length > 0) setDeletingHabitName(habits[0].name);
                }}
                className="p-2 bg-[#AB5419]/20 hover:bg-[#AB5419]/40 text-[#F6EFE5] text-xs font-bold rounded border border-[#AB5419]/30"
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
        </div>
      </aside>

      <main className="p-8 flex flex-col gap-6">
        <header className="flex justify-between items-center border-b border-[#7F2F07]/20 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#7F2F07]">
              My Habits
            </h1>
            <p className="text-[#6B5B47] text-sm italic mt-1">
              Record of daily pursuits
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-[#F6EFE5] border border-[#CDB494]/60 rounded-lg text-sm text-[#2A1A0F] font-semibold focus:outline-none focus:border-[#AB5419] shadow-sm cursor-pointer"
          />
        </header>
        <div className="flex flex-wrap gap-6 justify-center md:justify-start">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={handleToggleComplete}
            />
          ))}
        </div>
        <AnalyticsChart data={analyticsData} />
      </main>
    </div>
  );
}

export default App;
