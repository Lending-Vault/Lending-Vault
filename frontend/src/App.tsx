// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import Dashboard from "./pages/Dashboard";
import Savings from "./pages/Savings";
import Landing from "./pages/Landing";
import { config } from "./config/wagmi";
import About from "./pages/About";

// Import debug helpers for development (only in dev mode)
if (import.meta.env.DEV) {
  import("./utils/depositDebug");
}

// Create a query client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
