type Slot = {
  start: string;
  bestStaffId: string | null;
};

export default function SlotButton({ slot }: { slot: Slot }) {
  const date = new Date(slot.start);

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      className="
        group
        w-full
        bg-white
        border
        rounded-2xl
        p-4
        text-left
        transition
        hover:bg-black
        hover:text-white
        hover:shadow-lg
      "
    >
      <div className="text-sm text-gray-500 group-hover:text-gray-300">
        Disponible
      </div>

      <div className="text-lg font-semibold">
        {time}
      </div>

      {slot.bestStaffId && (
        <div className="text-xs text-green-500 mt-2 group-hover:text-green-300">
          Recomendado
        </div>
      )}
    </button>
  );
}