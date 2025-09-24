import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTransactions } from "../state/TransactionsContext.jsx";

const ACCEPTED = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
];

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
  const description = t.description || t.narration || t.details || t.memo || "";
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

export function Upload() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { appendTransactions } = useTransactions();
  const navigate = useNavigate();

  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    const invalid = picked.filter(
      (f) => !ACCEPTED.includes(f.type) && !/\.(pdf|csv|txt)$/i.test(f.name)
    );
    if (invalid.length) {
      setError("Only PDF, CSV, or TXT files are allowed");
      return;
    }
    setError("");
    setFiles(picked);
  }

  async function onUpload() {
    try {
      setLoading(true);
      setResult(null);
      const form = new FormData();
      for (const f of files) form.append("files", f);
      const resp = await fetch("http://localhost:5000/api/parse", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      setResult(data);

      const raw = Array.isArray(data?.transactions) ? data.transactions : [];
      const normalized = raw
        .map(normalizeTx)
        .filter(
          (t) => typeof t.amount === "number" && !isNaN(t.amount) && t.date
        );

      const tx = normalized.map((t, i) => ({
        id: `u-${Date.now()}-${i}`,
        ...t,
      }));
      if (tx.length) appendTransactions(tx);
      navigate("/");
    } catch (e) {
      setError("Failed to upload/parse. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  const preview = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        sizeKb: Math.round(f.size / 1024),
        type: f.type || (f.name.split(".").pop() || "").toUpperCase(),
      })),
    [files]
  );

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload Statements
        </h1>
        <Link to="/" className="text-sm text-sky-600 hover:underline">
          Back to Dashboard
        </Link>
      </header>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-zinc-700">Drop files here or click to browse</p>
        <div className="mt-4">
          <label className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 cursor-pointer">
            <input
              type="file"
              className="hidden"
              multiple
              accept=",csv,.txt,.pdf"
              onChange={onPick}
            />
            Select Files
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {preview.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200">
          <div className="px-4 py-3 border-b text-sm font-medium text-zinc-700">
            Selected Files
          </div>
          <ul className="divide-y">
            {preview.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="text-left">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-zinc-500">
                    {f.type} · {f.sizeKb} KB
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          API: http://localhost:5000/api/parse
        </div>
        <button
          onClick={onUpload}
          className="rounded-md bg-sky-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          disabled={files.length === 0 || loading}
        >
          {loading ? "Uploading..." : "Upload & Parse"}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm font-medium text-zinc-700 mb-2">
            Parsed Transactions (preview)
          </div>
          <pre className="overflow-auto text-xs bg-zinc-50 p-3 rounded border border-zinc-200 max-h-80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
