import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../layouts/AuthLayout/AuthLayout";
import { Input } from "../../components/Input";
import { PasswordInput } from "../../components/PasswordInput";
import { Button } from "../../components/Button";
import "../Login/loginPage.css"; 
import "./registration.css";
import { supabase } from "../../lib/supabaseClient";



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
const [error, setError] = useState<string | null>(null);


const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value, type, checked} = e.target;

    setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
};

const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    console.log('REGISTER DATA : ', formData);

    // minimalna validacije pre zoda
    if(!formData.email || !formData.password){
        setError("Email and password are required.");
        return;
    }

    if(!formData.terms){
        setError('You must accept the terms to continue.');
        return;
    }

    setIsLoading(true);

    // auth signUp
    try  {
        const {data, error: singUpError} = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if(singUpError) throw singUpError;

        const user = data.user;
        if(!user) {
            throw new Error("Account created, user is not available yet.")
        }


        // insert iz forme za registraciju u tabelu profiles u supabase
        const {error: profileError} = await supabase.from("profiles").insert({
            id: user.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            email: formData.email,
        });

        if(profileError) throw new profileError;

        console.log("REGISTER SUCCESS", user.id);
        alert(`REGISTER SUCCES - USER ID : ${user.id}`);
        
    } catch(err: any) {
        setError(err?.message ?? "Registration failed");
    } finally {
        setIsLoading(false);
        
    }
}





  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your account to access your dashboard."
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <Input label="First name" name="firstName" placeholder="Miloš" autoComplete="given-name" onChange={handleChange} />
          <Input label="Last name" name="lastName" placeholder="Petrović" autoComplete="family-name" onChange={handleChange} />
        </div>

        <Input label="Username" name="username" placeholder="luidji95" autoComplete="username" onChange={handleChange} />

        <Input label="Email" name="email" placeholder="you@example.com" autoComplete="email" onChange={handleChange} />

        <PasswordInput name="password" placeholder="••••••••" autoComplete="new-password" onChange={handleChange} />

        {/* za sada reuse PasswordInput  */}
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={handleChange}
        />

        <label className="checkbox">
          <input type="checkbox" name="terms" />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>

        <div className="form-actions">
            {error ? <p style={{ color: "crimson", marginTop: 8 }}>{error}</p> : null}

            <Button type="submit" isLoading={isLoading}>Create account</Button>

            <p className="form-footer">
                Already have an account? <Link to="/login">Login</Link>
             </p>
        </div>
      </form>
    </AuthLayout>
  );
};
