import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Inventaris from "./pages/Inventaris";
import POSReport from "./pages/POSReport";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <header className="h-14 border-b bg-background flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <Inventaris />
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/inventaris" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <header className="h-14 border-b bg-background flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <Inventaris />
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/pos-report" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <header className="h-14 border-b bg-background flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <POSReport />
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requireAdmin>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <header className="h-14 border-b bg-background flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <Analytics />
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
