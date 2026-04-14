import SlotCard from "../components/SlotCard";

type Slot = {
  start: string;
  end: string;
  availableStaff: { id: string; name: string }[];
  bestStaffId: string | null;
};

export default function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: Slot[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {slots.map((slot) => {
        const id = slot.start;

        return (
          <SlotCard
            key={id}
            slot={slot}
            selected={selectedSlot === id}
            onClick={() => onSelect(id)}
          />
        );
      })}
    </div>
  );
}