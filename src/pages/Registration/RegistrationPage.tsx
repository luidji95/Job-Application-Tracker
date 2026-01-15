import React from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../layouts/AuthLayout/AuthLayout";
import { Input } from "../../components/Input";
import { PasswordInput } from "../../components/PasswordInput";
import { Button } from "../../components/Button";
import "../Login/loginPage.css"; 
import "./registration.css";

export const RegistrationPage = () => {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your account to access your dashboard."
    >
      <form className="form">
        <div className="form-row">
          <Input label="First name" name="firstName" placeholder="Miloš" autoComplete="given-name" />
          <Input label="Last name" name="lastName" placeholder="Petrović" autoComplete="family-name" />
        </div>

        <Input label="Username" name="username" placeholder="luidji95" autoComplete="username" />

        <Input label="Email" name="email" placeholder="you@example.com" autoComplete="email" />

        <PasswordInput name="password" placeholder="••••••••" autoComplete="new-password" />

        {/* za sada ćemo reuse-ovati PasswordInput i kao confirm, bez toggle je isto ok */}
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <label className="checkbox">
          <input type="checkbox" name="terms" />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>

        <div className="form-actions">
          <Button type="submit">Create account</Button>

          <p className="form-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
