import React, { useState, useEffect } from "react";

function App() {
  const [habits, setHabits] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingHabitName, setDeletingHabitName] = useState("");
  const loadHabits = async () => {
    try {
      const response = await fetch("http://localhost:1111/habits");
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };
  useEffect(() => {
    loadHabits();
  }, []);
  const handleToggleComplete = async (habit) => {
    const today = new Date().toISOString().split("T")[0];
    await fetch("http://localhost:1111/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: habit.id, date: today }),
    });
    loadHabits();
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await fetch("http://localhost:1111/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newHabitName.trim() }),
    });

    setNewHabitName("");
    loadHabits();
  };
  const handleDeleteHabit = async (name) => {
    if (window.confirm(`Are you sure you want to delete '${name}'?`)) {
      await fetch(
        `http://localhost:1111/api/delete/${encodeURIComponent(name)}`,
        {
          method: "DELETE",
        },
      );
      loadHabits();
    }
  };
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
        </header>

        <div className="flex flex-wrap gap-6 justify-center md:justify-start">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="p-6 bg-[#F6EFE5] text-[#2A1A0F] rounded-lg shadow-md shadow-black/10 border border-[#CDB494]/30 flex flex-col justify-between w-72 h-36"
            >
              <span className="text-xl font-semibold tracking-wide italic">
                {habit.name}
              </span>

              <div className="border-t border-[#CDB494]/30 pt-3 flex justify-between items-center text-sm">
                <button
                  onClick={() => handleToggleComplete(habit)}
                  className="focus:outline-none hover:opacity-80 transition-opacity text-left"
                >
                  <span className="italic text-[#6B5B47]">Status : </span>
                  <span
                    className={
                      habit.completed
                        ? "text-[#C98928] font-bold"
                        : "text-[#AB5419] font-bold"
                    }
                  >
                    {habit.completed ? "Completed" : "Pending"}
                  </span>
                </button>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#AB5419]">
                  <span>🔥</span>
                  <span>{habit.streak || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
