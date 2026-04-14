"use client";

type Props = {
  date: Date;
  setDate: (date: Date) => void;
  staffId: string | null;
  setStaffId: (id: string | null) => void;
};

export default function Filters({
  date,
  setDate,
  staffId,
  setStaffId,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">

      <h2 className="font-semibold text-lg">
        Filtros
      </h2>

      {/* Fecha */}
      <div>
        <p className="text-sm text-gray-500 mb-2">
          Fecha
        </p>
        <input
          type="date"
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
          value={date.toISOString().split("T")[0]}
          onChange={(e) => setDate(new Date(e.target.value))}
        />
      </div>

      {/* Staff */}
      <div>
        <p className="text-sm text-gray-500 mb-2">
          Profesional
        </p>
        <select
          className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black"
          value={staffId ?? ""}
          onChange={(e) =>
            setStaffId(e.target.value || null)
          }
        >
          <option value="">Cualquiera</option>
          <option value="f93f848b-69f5-485f-9d1d-45f556c29f7e">
            Juan
          </option>
          <option value="b7f9487a-4c6b-47ba-895b-faf863f22885">
            Pedro
          </option>
          <option value="bad79dc0-12d8-48b3-9860-4207ce8afd85">
            Lucía
          </option>
        </select>
      </div>

    </div>
  );
}