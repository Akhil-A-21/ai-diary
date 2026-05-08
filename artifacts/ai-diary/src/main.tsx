import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Default to dark mode
document.documentElement.classList.add("dark");

// Inject user email header into all fetch requests
const USER_EMAIL = localStorage.getItem("userEmail") || "demo@aivideodiary.app";
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers((init as RequestInit).headers);
  headers.set("x-user-email", USER_EMAIL);
  return originalFetch(input, { ...init, headers });
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
