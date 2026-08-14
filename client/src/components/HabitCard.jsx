import React from "react";

function HabitCard({ habit, onToggle }) {
  return (
    <div className="p-6 bg-[#F6EFE5] text-[#2A1A0F] rounded-lg shadow-md shadow-black/10 border border-[#CDB494]/30 flex flex-col justify-between w-72 h-36">
      <span className="text-xl font-semibold tracking-wide italic">
        {habit.name}
      </span>

      <div className="border-t border-[#CDB494]/30 pt-3 flex justify-between items-center text-sm">
        <button
          onClick={() => onToggle(habit)}
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
  );
}

export default HabitCard;