import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/layout/Sidebar";
import { ToastContainer } from "./components/common/Toast";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useGlobalKeyboardShortcuts } from "./hooks/useKeyboard";
import { Dashboard, Marketplace, Servers, Clients, Settings } from "./pages";
import "./App.css";

const queryClient = new QueryClient();

function AppContent() {
  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <ErrorBoundary fallback={
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load this page</p>
            <button 
              onClick={() => window.location.href = "/"}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
