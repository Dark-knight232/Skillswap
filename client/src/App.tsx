import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardLayout } from "@/pages/dashboard/layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import DashboardHome from "@/pages/dashboard/home";
import Skills from "@/pages/dashboard/skills";
import Discover from "@/pages/dashboard/discover";
import Chat from "@/pages/dashboard/chat";
import Calendar from "@/pages/dashboard/calendar";
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import LearningPaths from "@/pages/dashboard/learning-paths";
import Groups from "@/pages/dashboard/groups";
import Projects from "@/pages/dashboard/projects";
import CourseBuilder from "@/pages/dashboard/course-builder";
import CourseMarketplace from "@/pages/dashboard/course-marketplace";
import InstructorDashboard from "@/pages/dashboard/instructor-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <DashboardHome />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/skills">
        {() => (
          <DashboardLayout>
            <Skills />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/discover">
        {() => (
          <DashboardLayout>
            <Discover />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/chat">
        {() => (
          <DashboardLayout>
            <Chat />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/calendar">
        {() => (
          <DashboardLayout>
            <Calendar />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/profile">
        {() => (
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/learning-paths">
        {() => (
          <DashboardLayout>
            <LearningPaths />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/groups">
        {() => (
          <DashboardLayout>
            <Groups />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/projects">
        {() => (
          <DashboardLayout>
            <Projects />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/course-builder">
        {() => (
          <DashboardLayout>
            <CourseBuilder />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/course-marketplace">
        {() => (
          <DashboardLayout>
            <CourseMarketplace />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/instructor-dashboard">
        {() => (
          <DashboardLayout>
            <InstructorDashboard />
          </DashboardLayout>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
