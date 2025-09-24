import { Link } from "react-router-dom";

// SVG Vector Icon for empty state
const DocumentUploadIcon = ({ className = "w-24 h-24" }) => (
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
      strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14 2v4a2 2 0 002 2h4"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 17v-6m-3 3l3-3 3 3"
    />
  </svg>
);

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-8">
        <DocumentUploadIcon className="w-32 h-32 text-gray-300" />
      </div>

      <div className="max-w-md mx-auto">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          No Expenses to Manage Yet
        </h3>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Upload your bank statements or bills to start tracking your expenses
          automatically. Our smart system will categorize and organize your
          financial data for you.
        </p>

        <div className="space-y-4">
          <Link
            to="/upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload Bill or Statement
          </Link>

          <p className="text-sm text-gray-500">
            Supports PDF, CSV, and text files from most banks
          </p>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">
            Smart Categorization
          </h4>
          <p className="text-sm text-gray-600">
            Automatically categorize your expenses
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Visual Analytics</h4>
          <p className="text-sm text-gray-600">Beautiful charts and insights</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Secure & Private</h4>
          <p className="text-sm text-gray-600">
            Your data stays on your device
          </p>
        </div>
      </div>
    </div>
  );
}
