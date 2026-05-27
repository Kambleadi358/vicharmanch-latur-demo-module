import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Ideology from "./pages/Ideology";
import Programs from "./pages/Programs";
import Quiz from "./pages/Quiz";
import QuizTake from "./pages/QuizTake";
import QuizResult from "./pages/QuizResult";
import Accounts from "./pages/Accounts";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeDashboard from "./pages/JudgeDashboard";
import SpardhaList from "./pages/SpardhaList";
import SpardhaDetail from "./pages/SpardhaDetail";
import Register from "./pages/Register";
import Ahval from "./pages/Ahval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
