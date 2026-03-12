import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Auth/Login/LoginPage";
import { RegistrationPage } from "./pages/Auth/Registration/RegistrationPage";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import { KanbanBoard } from "./features/components/KanbanBoard";
import { StatisticsPage } from "./pages/Dashboard/StatisticsPage";
import { AuthGuard } from "./routes/AuthGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />

        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<KanbanBoard />} />
            <Route path="statistics" element={<StatisticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}