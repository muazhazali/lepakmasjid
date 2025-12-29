import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { usePocketBase } from "@/hooks/use-pocketbase";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import MosqueDetail from "./pages/MosqueDetail";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import ContentPolicy from "./pages/ContentPolicy";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Admin/Dashboard";
import Submissions from "./pages/Admin/Submissions";
import Mosques from "./pages/Admin/Mosques";
import Users from "./pages/Admin/Users";
import AuditLog from "./pages/Admin/AuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Initialize PocketBase
  usePocketBase();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/mosque/:id" element={<MosqueDetail />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/content-policy" element={<ContentPolicy />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/submissions" element={<Submissions />} />
              <Route path="/admin/mosques" element={<Mosques />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/audit" element={<AuditLog />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
