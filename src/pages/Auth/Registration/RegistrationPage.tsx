import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout/AuthLayout";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { Button } from "../../../components/ui/Button";
import "../Login/loginPage.css"; 
import "./registration.css";
import { supabase } from "../../../lib/supabaseClient";




type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};



export const RegistrationPage = () => {
const [formData, setFormData] = useState<RegisterFormData>({
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  terms: false,
});
const [isLoading, setIsLoading] = useState(false);
const [message, setMessage] = useState<string | null>(null);
const [error, setError] = useState(null);



const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value, type, checked} = e.target;

    setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
};



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setError(null);
  setMessage(null);
  setIsLoading(true);

  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email!,
      password: formData.password!,
    });

    if (signUpError) throw signUpError;

    setMessage("Account created. Please check your email to confirm, then login.");
    
  } catch (err: any) {
    setError(err?.message ?? "Registration failed.");
  } finally {
    setIsLoading(false);
  }
};




  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your account to access your dashboard."
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <Input label="First name" name="firstName" placeholder="Miloš" value={formData.firstName} autoComplete="given-name" onChange={handleChange} />
          <Input label="Last name" name="lastName" placeholder="Petrović" value={formData.lastName} autoComplete="family-name" onChange={handleChange} />
        </div>

        <Input label="Username" name="username" placeholder="luidji95" value={formData.username} autoComplete="username" onChange={handleChange} />

        <Input label="Email" name="email" placeholder="you@example.com" value={formData.email} autoComplete="email" onChange={handleChange} />

        <PasswordInput name="password" placeholder="••••••••" value={formData.password} autoComplete="new-password" onChange={handleChange} />

        {/* za sada reuse PasswordInput  */}
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          autoComplete="new-password"
          onChange={handleChange}
        />

        <label className="checkbox">
          <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>

        <div className="form-actions">
            
            {message ? <p style={{color: "green"}}>{message}</p>:null}

            <Button type="submit" isLoading={isLoading}>Create account</Button>

            <p className="form-footer">
                Already have an account? <Link to="/login">Login</Link>
             </p>
        </div>
      </form>
    </AuthLayout>
  );
};
