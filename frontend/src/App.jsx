import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Dashboard } from "./dashboard/Dashboard";
import { Upload } from "./upload/Upload";
import { TransactionsProvider } from "./state/TransactionsContext";
import { AuthProvider } from "./state/AuthContext";
import { Navbar } from "./components/Navbar";

// No protected route needed anymore

function App() {
  return (
    <Router>
      <AuthProvider>
        <TransactionsProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </TransactionsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
