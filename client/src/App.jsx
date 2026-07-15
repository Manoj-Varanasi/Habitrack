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
        <div className={`grid ${isSidebarOpen ? "grid-cols-[220px_1fr]" : "grid-cols-[70px_1fr]"} min-h-screen bg-[#E0B17D] text-[#2A1A0F] transition-all duration-300 font-sans`}>
            
            <aside className={`bg-[#7F2F07] border-r border-[#CDB494]/30 flex flex-col justify-between overflow-hidden transition-all duration-300 ${isSidebarOpen ? "p-5" : "p-4"}`}>
                <div className="flex flex-col gap-6">
                    
                    <div className="flex items-center gap-3 border-b border-[#CDB494]/20 pb-4 h-12">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="focus:outline-none hover:opacity-80 transition-opacity"
                        >
                            <img src="/key.png" alt="toggle key" className="w-8 h-8 rounded-lg" />
                        </button>
                        {isSidebarOpen && (
                            <span className="font-bold text-lg tracking-wider text-[#F6EFE5] italic">
                                HabitTracker
                            </span>
                        )}
                    </div>

                </div>
            </aside>

            <main className="p-8">
                <span>Main Content Placeholder</span>
            </main>

        </div>
    );
}

export default App;