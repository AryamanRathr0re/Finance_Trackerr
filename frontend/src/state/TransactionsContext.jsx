import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { transactionAPI } from "../services/api";

const TransactionsContext = createContext(null);

// No fallback data - start with empty state

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Start with empty state - no data persistence between sessions
  useEffect(() => {
    setLoading(false);
    setTransactions([]);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      error,
      setTransactions,
      // Create a new transaction
      createTransaction: async (transaction) => {
        try {
          const response = await transactionAPI.create(transaction);
          setTransactions((prev) => [response.data, ...prev]);
          return response.data;
        } catch (err) {
          console.error("Failed to create transaction:", err);
          throw err;
        }
      },
      // Update an existing transaction
      updateTransaction: async (id, transaction) => {
        try {
          const response = await transactionAPI.update(id, transaction);
          setTransactions((prev) =>
            prev.map((t) => (t._id === id ? response.data : t))
          );
          return response.data;
        } catch (err) {
          console.error(`Failed to update transaction ${id}:`, err);
          throw err;
        }
      },
      // Delete a transaction
      deleteTransaction: async (id) => {
        try {
          await transactionAPI.delete(id);
          setTransactions((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
          console.error(`Failed to delete transaction ${id}:`, err);
          throw err;
        }
      },
      // Replace all transactions with new data (from file upload)
      replaceTransactions: async (items) => {
        try {
          const response = await transactionAPI.createBatch(items);
          setTransactions(response.data); // Replace instead of append
          return response.data;
        } catch (err) {
          console.error("Failed to replace transactions:", err);
          // Fallback to local state if API fails
          const withIds = items.map((t, i) => ({
            id: t.id || `u-${Date.now()}-${i}`,
            ...t,
          }));
          setTransactions(withIds); // Replace instead of append
          throw err;
        }
      },
      // Keep the old function name for backward compatibility but make it replace
      appendTransactions: async (items) => {
        try {
          const response = await transactionAPI.createBatch(items);
          setTransactions(response.data); // Replace instead of append
          return response.data;
        } catch (err) {
          console.error("Failed to add transactions:", err);
          // Fallback to local state if API fails
          const withIds = items.map((t, i) => ({
            id: t.id || `u-${Date.now()}-${i}`,
            ...t,
          }));
          setTransactions(withIds); // Replace instead of append
          throw err;
        }
      },
      // Clear all transactions
      clearTransactions: () => {
        setTransactions([]);
      },
    }),
    [transactions, loading, error]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx)
    throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}


