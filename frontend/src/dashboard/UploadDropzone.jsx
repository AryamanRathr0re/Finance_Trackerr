import { useState } from "react";
import { uploadAPI, transactionAPI } from "../services/api";
import { useTransactions } from "../state/TransactionsContext";

export function UploadDropzone() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const { appendTransactions, setTransactions } = useTransactions();

  function normalizeDate(input) {
    if (!input) return "";
    const d = new Date(input);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function parseAmount(raw) {
    if (raw == null) return NaN;
    if (typeof raw === "number") return raw;
    const s = String(raw)
      .replace(/[^0-9.,-]/g, "")
      .replace(",", "");
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
  }

  function normalizeTx(t) {
    const dateRaw =
      t.date || t.transaction_date || t.post_date || t.time || t.posted_at;
    const description =
      t.description || t.narration || t.details || t.memo || "";
    const merchant = t.merchant || t.merchant_name || t.payee || "";

    let amount = parseAmount(t.amount);
    if (isNaN(amount)) {
      const credit = parseAmount(t.credit);
      const debit = parseAmount(t.debit);
      if (!isNaN(credit)) amount = Math.abs(credit);
      if (!isNaN(debit)) amount = -Math.abs(debit);
    }

    const category = t.category || t.type || "Other";

    return {
      date: normalizeDate(dateRaw) || "",
      description,
      merchant,
      amount,
      category,
    };
  }

  async function handleChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadAPI.parseFiles(files);
      const raw = Array.isArray(response?.data?.transactions)
        ? response.data.transactions
        : [];

      // Normalize for immediate UI display
      const normalized = raw
        .map(normalizeTx)
        .filter(
          (t) => typeof t.amount === "number" && !isNaN(t.amount) && t.date
        );

      if (normalized.length) {
        const optimistic = normalized.map((t, i) => ({
          id: `u-${Date.now()}-${i}`,
          ...t,
        }));
        // Optimistically update UI
        setTransactions((prev) => [...optimistic, ...prev]);

        // Sync to backend in background; replace optimistic with server-saved
        try {
          const resp = await transactionAPI.createBatch(normalized);
          const saved = Array.isArray(resp?.data) ? resp.data : [];
          const optimisticIds = new Set(optimistic.map((o) => o.id));
          setTransactions((prev) => {
            const withoutOptimistic = prev.filter(
              (t) => !(t.id && optimisticIds.has(t.id))
            );
            return [...saved, ...withoutOptimistic];
          });
        } catch (syncErr) {
          // Already optimistically updated; just log
          console.error("Background sync failed:", syncErr);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label
        className={`inline-flex items-center gap-2 rounded-md border border-zinc-300 ${
          isUploading ? "bg-zinc-100" : "bg-white"
        } px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 cursor-pointer ${
          isUploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <input
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.csv,.txt"
          onChange={handleChange}
          disabled={isUploading}
        />
        {isUploading ? "Uploading..." : "Upload Statements"}
      </label>
      {uploadError && (
        <p className="text-red-500 text-xs mt-1">{uploadError}</p>
      )}
    </div>
  );
}



