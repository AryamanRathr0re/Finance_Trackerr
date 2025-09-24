import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function Navbar() {
  const { user } = useAuth();
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`;

  // No logout functionality needed

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="font-bold text-xl text-gray-900 hover:text-gray-700"
            >
              Finance Tracker
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <NavLink to="/" className={linkClass} end>
                Dashboard
              </NavLink>
              <NavLink to="/upload" className={linkClass}>
                Upload
              </NavLink>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Hello, {user?.name || "User"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}



