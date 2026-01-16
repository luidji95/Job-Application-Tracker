import React, { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { AuthLayout } from '../../../layouts/AuthLayout/AuthLayout';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import "./loginPage.css";
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

type LoginFormData = {
    email: string,
    password: string,
}

export const LoginPage = () => {

    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: ""
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const {name, value } = e.target;

        setFormData(prev => ({...prev, [name] : value }));


    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
            });

            if (error) throw error;

            const user = data.user;
            if (!user) throw new Error("No user returned.");

            const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
                {
                id: user.id,
                email: user.email,
                },
                { onConflict: "id" }
            );

            if (profileError) throw profileError;

            navigate("/dashboard");
        } catch (err: any) {
            setError(err?.message ?? "Login failed.");
        } finally {
            setIsLoading(false);
        }
};



  return (

     <AuthLayout title="Login" subtitle="Enter your credentials to access your dashboard.">
      <form className="form" onSubmit={handleSubmit}>
        <Input label="Email" placeholder="you@example.com" name='email' value={formData.email} onChange={handleChange}/>

        <PasswordInput placeholder="••••••••" name='password' value={formData.password} onChange={handleChange} />

        <div className='form-actions'>

            <Button type='submit' isLoading={isLoading}>Login</Button>

            <Button variant='ghost' type='button' className='guest-demo-btn'>
                <span className='guest-icon'>👁️</span>
                Try demo as guest
            </Button>
        </div>

        <p className="form-footer">
          Don't have an account? <Link to={"/register"}>Create one</Link>
        </p>

        
      </form>
    </AuthLayout>


    
    

    
  )
}



