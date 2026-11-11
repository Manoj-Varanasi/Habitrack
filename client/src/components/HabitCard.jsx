import React from "react";

function HabitCard({ habit, onToggle }) {
  const isDual = habit.is_dual;
  const isCompleted = habit.completed;
  const partnerCompleted = habit.partner_completed;
  const bothCompleted = isCompleted && partnerCompleted;

  // Determine status text & colors for dual vs solo habits
  let statusText = isCompleted ? "Completed" : "Pending";
  let statusColor = isCompleted ? "text-[#C98928]" : "text-[#AB5419]";

  if (isDual) {
    if (bothCompleted) {
      statusText = "Dual Complete!";
      statusColor = "text-emerald-700";
    } else if (isCompleted && !partnerCompleted) {
      statusText = `Waiting for ${habit.partner_username || "partner"}...`;
      statusColor = "text-[#C98928]";
    } else if (!isCompleted && partnerCompleted) {
      statusText = `${habit.partner_username || "Partner"} finished! Your turn!`;
      statusColor = "text-amber-700 font-extrabold";
    } else {
      statusText = "Both Pending";
      statusColor = "text-[#AB5419]";
    }
  }

  return (
    <div
      className={`p-5 bg-[#F6EFE5] text-[#2A1A0F] rounded-xl shadow-md shadow-black/10 border ${
        isDual ? "border-[#C98928]/60 ring-1 ring-[#C98928]/30" : "border-[#CDB494]/30"
      } flex flex-col justify-between w-80 min-h-[148px] transition-all hover:shadow-lg`}
    >
      <div>
        {/* Dual Habit Partner Pill */}
        {isDual && (
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#CDB494]/20">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C98928]/20 text-[#7F2F07] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>👥</span>
              <span>Dual Streak with {habit.partner_username || "Friend"}</span>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                partnerCompleted ? "bg-emerald-500" : "bg-zinc-300"
              }`}
              title={
                partnerCompleted
                  ? `${habit.partner_username} completed today!`
                  : `${habit.partner_username} hasn't completed yet`
              }
            />
          </div>
        )}

        <h3 className="text-lg font-bold tracking-wide italic text-[#7F2F07] line-clamp-1">
          {habit.name}
        </h3>
      </div>

      <div className="border-t border-[#CDB494]/30 pt-3 flex justify-between items-center text-xs">
        <button
          onClick={() => onToggle(habit)}
          className="focus:outline-none hover:opacity-80 transition-opacity text-left flex items-center gap-1.5"
        >
          <span className="italic text-[#6B5B47]">Status:</span>
          <span className={`font-bold ${statusColor}`}>
            {statusText}
          </span>
        </button>

        <div className="flex items-center gap-1.5 font-bold text-xs bg-[#E0B17D]/30 px-2.5 py-1 rounded-lg border border-[#CDB494]/40 text-[#7F2F07]">
          <span>{isDual ? "⚔️" : "🔥"}</span>
          <span>{habit.streak || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default HabitCard;
