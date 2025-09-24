import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useTransactions } from "../state/TransactionsContext";

// SVG Icons
const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export function TransactionsTable({ transactions }) {
  const { updateTransaction, deleteTransaction } = useTransactions();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(normalized) ||
        (t.merchant || "").toLowerCase().includes(normalized) ||
        (t.category || "").toLowerCase().includes(normalized)
    );
  }, [transactions, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === "date") {
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function onInlineEdit(id, field, value) {
    try {
      setIsSubmitting(true);
      setError(null);
      const updatedTransaction = { [field]: value };
      await updateTransaction(id, updatedTransaction);
    } catch (err) {
      setError("Failed to update transaction");
      console.error("Update failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        setError(null);
        await deleteTransaction(id);
      } catch (err) {
        setError("Failed to delete transaction");
        console.error("Delete failed:", err);
      }
    }
  }

  function handleEdit(id) {
    // Focus the description field for inline editing
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const descriptionInput = row.querySelector(
        'input[placeholder*="description"], input:first-of-type'
      );
      if (descriptionInput) {
        descriptionInput.focus();
        descriptionInput.select();
      }
    }
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <div className="p-3 flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search description, merchant, category"
          className="w-full md:w-80 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("date")}
              >
                Date
              </th>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Merchant</th>
              <th
                className="text-left px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("amount")}
              >
                Amount
              </th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t._id || t.id}
                className="border-t hover:bg-gray-50"
                data-id={t._id || t.id}
              >
                <td className="px-4 py-2 text-zinc-700">
                  {format(new Date(t.date), "yyyy-MM-dd")}
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-transparent px-2 py-1 hover:border-zinc-300 focus:border-sky-500 focus:outline-none"
                    value={t.description}
                    onChange={(e) =>
                      onInlineEdit(t._id || t.id, "description", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-transparent px-2 py-1 hover:border-zinc-300 focus:border-sky-500 focus:outline-none"
                    value={t.merchant}
                    onChange={(e) =>
                      onInlineEdit(t._id || t.id, "merchant", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </td>
                <td
                  className={`px-4 py-2 font-medium ${
                    t.amount < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {t.amount < 0 ? "-" : ""}${Math.abs(t.amount).toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-transparent px-2 py-1 hover:border-zinc-300 focus:border-sky-500 focus:outline-none"
                    value={t.category}
                    onChange={(e) =>
                      onInlineEdit(t._id || t.id, "category", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(t._id || t.id)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      disabled={isSubmitting}
                      title="Edit transaction"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id || t.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                      disabled={isSubmitting}
                      title="Delete transaction"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



