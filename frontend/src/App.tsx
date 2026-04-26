import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { JobsProvider } from "@/contexts/JobsContext";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/Profile";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import PostJob from "./pages/employer/PostJob";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLookups from "./pages/admin/AdminLookups";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <JobsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/jobs" element={<AdminJobs />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/lookups" element={<AdminLookups />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </JobsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
