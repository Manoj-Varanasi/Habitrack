import React from "react";

function HabitCard({ habit, onToggle, onAcceptInvite, onDeclineInvite }) {
  const isDual = habit.is_dual;
  const isPendingMyAcceptance = habit.invite_status === "pending";
  const isPendingPartnerAcceptance = habit.partner_invite_status === "pending";
  const isCompleted = habit.completed;
  const partnerCompleted = habit.partner_completed;
  const bothCompleted = isCompleted && partnerCompleted;

  // Case 1: You received an invite and need to accept or decline it
  if (isPendingMyAcceptance) {
    return (
      <div className="p-5 bg-[#F6EFE5] text-[#2A1A0F] rounded-xl shadow-md border-2 border-[#C98928] flex flex-col justify-between w-80 min-h-[148px] animate-pulse-subtle">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7F2F07] uppercase tracking-wider mb-1">
            <span>📩</span>
            <span>Dual Habit Invitation</span>
          </div>
          <h3 className="text-lg font-bold italic text-[#7F2F07]">
            {habit.name}
          </h3>
          <p className="text-xs text-[#6B5B47] mt-1">
            Invited by <strong className="text-[#AB5419]">{habit.partner_username || "Friend"}</strong>
          </p>
        </div>

        <div className="border-t border-[#CDB494]/30 pt-3 flex gap-2">
          <button
            onClick={() => onAcceptInvite(habit.id)}
            className="flex-1 py-1.5 bg-[#AB5419] hover:bg-[#7F2F07] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => onDeclineInvite(habit.id)}
            className="px-3 py-1.5 bg-[#251712]/10 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors"
          >
            ✕ Decline
          </button>
        </div>
      </div>
    );
  }

  // Case 2: You created the dual habit, waiting for partner to accept
  if (isPendingPartnerAcceptance) {
    return (
      <div className="p-5 bg-[#F6EFE5] text-[#2A1A0F] rounded-xl shadow-md border border-[#CDB494]/60 opacity-80 flex flex-col justify-between w-80 min-h-[148px]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E0B17D]/40 text-[#7F2F07] px-2 py-0.5 rounded-full inline-block mb-1.5">
            👥 Invite Sent
          </span>
          <h3 className="text-lg font-bold italic text-[#7F2F07]">
            {habit.name}
          </h3>
        </div>

        <div className="border-t border-[#CDB494]/30 pt-3 flex items-center justify-between text-xs text-[#6B5B47] italic">
          <span>Waiting for {habit.partner_username || "partner"} to accept...</span>
          <span className="animate-spin text-sm">⏳</span>
        </div>
      </div>
    );
  }

  // Case 3: Active Habit (Solo or Accepted Dual)
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

export default React.memo(HabitCard);
