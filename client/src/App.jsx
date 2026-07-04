import React, { useState, useEffect } from 'react';

function App() {
    const [habits, setHabits] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    useEffect(() => {
        const loadHabits = async () => {
            try {
                const response = await fetch('http://localhost:8080/habits');
                const data = await response.json();
                setHabits(data);
            } catch (error) {
                console.error("Error fetching habits:", error);
            }
        };
        loadHabits();
    }, []);
    return (
        <div className="p-6 font-sans bg-white text-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold">Habitrack</h1>
            <p className="text-gray-500 mt-1">Manage your daily habits</p>

            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
                {isSidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>

            {isSidebarOpen && (
                <div className="my-4 p-4 border border-gray-200 rounded-lg w-56">
                    <strong className="text-gray-800">Menu</strong>
                    <p className="text-gray-500 text-sm mt-1">Today's Ledger</p>
                </div>
            )}

            <hr className="my-6 border-gray-200" />

            <h2 className="text-xl font-bold text-gray-800">Habits</h2>
            <ul className="mt-4">
                {habits.map((habit) => (
                    <li key={habit.id} className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-md flex justify-between items-center">
                        <span className="font-semibold text-gray-700">{habit.name}</span>
                        <span className={habit.completed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                            {habit.completed ? "Completed" : "Pending"}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;