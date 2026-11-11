import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  fetchHabits,
  addHabit,
  addDualHabit,
  acceptHabitInvite,
  declineHabitInvite,
  deleteHabit,
  toggleCompleteHabit,
  fetchAnalytics,
  fetchFriends,
} from "./api";
import HabitCard from "./components/HabitCard";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";

// Lazy-load heavier components to keep initial bundle ultra-fast
const AnalyticsChart = React.lazy(() => import("./components/AnalyticsChart"));
const UserProfileModal = React.lazy(() => import("./components/UserProfileModal"));

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

  const loadHabits = useCallback(async () => {
    try {
      const [data, analytics, friendsList] = await Promise.all([
        fetchHabits(selectedDate),
        fetchAnalytics(),
        fetchFriends(),
      ]);
      setHabits(data);
      setAnalyticsData(analytics);
      setFriends(friendsList);
      if (friendsList.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(friendsList[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedDate, selectedPartnerId]);

  const handleToggleComplete = useCallback(async (habit) => {
    await toggleCompleteHabit(habit.id, selectedDate);
    loadHabits();
  }, [selectedDate, loadHabits]);

  const handleAcceptInvite = useCallback(async (habitId) => {
    try {
      await acceptHabitInvite(habitId);
      loadHabits();
    } catch (err) {
      alert(err.message || "Failed to accept invite");
    }
  }, [loadHabits]);

  const handleDeclineInvite = useCallback(async (habitId) => {
    try {
      await declineHabitInvite(habitId);
      loadHabits();
    } catch (err) {
      alert(err.message || "Failed to decline invite");
    }
  }, [loadHabits]);

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
  }, [token, loadHabits]);

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
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onOpenProfile={() => setIsProfileOpen(true)}
        friends={friends}
        habits={habits}
        isAdding={isAdding}
        setIsAdding={setIsAdding}
        newHabitName={newHabitName}
        setNewHabitName={setNewHabitName}
        isDualHabit={isDualHabit}
        setIsDualHabit={setIsDualHabit}
        selectedPartnerId={selectedPartnerId}
        setSelectedPartnerId={setSelectedPartnerId}
        onAddHabit={handleAddHabit}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        deletingHabitName={deletingHabitName}
        setDeletingHabitName={setDeletingHabitName}
        onDeleteHabit={handleDeleteHabit}
        currentUsername={currentUsername}
        onLogout={handleLogout}
      />

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
          <p className="text-sm italic text-[#6B5B47] py-6">
            no habits till now
          </p>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggleComplete}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
              />
            ))}
          </div>
        )}

        <Suspense fallback={<div className="h-48 bg-[#F6EFE5]/40 rounded-lg animate-pulse" />}>
          <AnalyticsChart data={analyticsData} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {isProfileOpen && (
          <UserProfileModal
            isOpen={isProfileOpen}
            onClose={() => {
              setIsProfileOpen(false);
              loadHabits();
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
