type Slot = {
  start: string;
  end: string;
  availableStaff: { id: string; name: string }[];
  bestStaffId: string | null;
};

export default function SlotCard({
  slot,
  selected,
  onClick,
}: {
  slot: Slot;
  selected: boolean;
  onClick: () => void;
}) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  const bestStaff = slot.availableStaff.find(
    (s) => s.id === slot.bestStaffId
  );

  return (
    <button
      onClick={onClick}
      className={`
        border rounded-xl p-4 text-left transition
        hover:shadow-md hover:border-black
        ${selected ? "border-black shadow-md" : "border-gray-200"}
      `}
    >
      {/* TIME */}
      <div className="text-sm font-medium">
        {start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        -{" "}
        {end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      {/* STAFF COUNT */}
      <div className="text-xs text-gray-500 mt-1">
        {slot.availableStaff.length} staff available
      </div>

      {/* BEST STAFF HIGHLIGHT */}
      {bestStaff && (
        <div className="mt-2 text-xs text-blue-600 font-medium">
          Best: {bestStaff.name}
        </div>
      )}
    </button>
  );
}