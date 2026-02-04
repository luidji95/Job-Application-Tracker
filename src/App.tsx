
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Auth/Login/LoginPage";
import { RegistrationPage } from "./pages/Auth/Registration/RegistrationPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import { AuthGuard } from "./routes/AuthGuard";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage></RegistrationPage>} />
        

        {/*PROTECTED*/}
        <Route element={<AuthGuard/>}>
          <Route path="/dashboard" element={<Dashboard/>} />
        </Route>
        

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
