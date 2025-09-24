export function SummaryCards({ income, expenses, net }) {
  const cards = [
    {
      label: "Total Income",
      value: income,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Expenses",
      value: expenses,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Net Balance",
      value: net,
      color: net >= 0 ? "text-sky-700" : "text-rose-700",
      bg: "bg-sky-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg ${c.bg} p-4 border border-zinc-200`}
        >
          <div className="text-sm text-zinc-500">{c.label}</div>
          <div className={`mt-2 text-2xl font-semibold ${c.color}`}>
            ${c.value.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}






