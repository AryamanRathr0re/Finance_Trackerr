import { useMemo, useState } from "react";
import { SummaryCards } from "./SummaryCards";
import { TransactionsTable } from "./TransactionsTable";
import { CategoryChart } from "./CategoryChart";
import { UploadDropzone } from "./UploadDropzone";
import { BillPDFButton } from "./BillPDFButton";
import { EmptyState } from "../components/EmptyState";
import { useTransactions } from "../state/TransactionsContext.jsx";

export function Dashboard() {
  const { transactions, setTransactions, loading, error, clearTransactions } =
    useTransactions();

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = income - expenses;
    return { income, expenses, net };
  }, [transactions]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Finance Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <UploadDropzone />
          {transactions.length > 0 && (
            <>
              <button
                onClick={clearTransactions}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition-colors duration-200"
                title="Clear all transactions"
              >
                Clear All
              </button>
              <BillPDFButton transactions={transactions} summary={summary} />
            </>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-blue-400 rounded-full"></div>
            <p className="mt-2 text-gray-500">Loading transactions...</p>
          </div>
        </div>
      ) : error ? (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200">
          <EmptyState />
        </div>
      ) : (
        <>
          <SummaryCards
            income={summary.income}
            expenses={summary.expenses}
            net={summary.net}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionsTable
                transactions={transactions}
                onUpdate={setTransactions}
              />
            </div>
            <div>
              <CategoryChart transactions={transactions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
