import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import Index from "./pages/Index"; // keep landing eager for fast LCP

const About = lazy(() => import("./pages/About"));
const Ideology = lazy(() => import("./pages/Ideology"));
const Programs = lazy(() => import("./pages/Programs"));
const Quiz = lazy(() => import("./pages/Quiz"));
const QuizTake = lazy(() => import("./pages/QuizTake"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const Accounts = lazy(() => import("./pages/Accounts"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminSignup = lazy(() => import("./pages/AdminSignup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const JudgeLogin = lazy(() => import("./pages/JudgeLogin"));
const JudgeDashboard = lazy(() => import("./pages/JudgeDashboard"));
const SpardhaList = lazy(() => import("./pages/SpardhaList"));
const SpardhaDetail = lazy(() => import("./pages/SpardhaDetail"));
const Register = lazy(() => import("./pages/Register"));
const Ahval = lazy(() => import("./pages/Ahval"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/ideology" element={<Ideology />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/take" element={<QuizTake />} />
                <Route path="/quiz/result" element={<QuizResult />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin-signup" element={<AdminSignup />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/judge-login" element={<JudgeLogin />} />
                <Route path="/judge" element={<JudgeDashboard />} />
                <Route path="/spardha" element={<SpardhaList />} />
                <Route path="/spardha/:id" element={<SpardhaDetail />} />
                <Route path="/register" element={<Register />} />
                <Route path="/ahval" element={<Ahval />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
