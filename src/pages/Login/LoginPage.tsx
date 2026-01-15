import React from 'react'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { AuthLayout } from '../../layouts/AuthLayout/AuthLayout';
import { PasswordInput } from '../../components/PasswordInput';
import "./loginPage.css";
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  return (

     <AuthLayout title="Login" subtitle="Enter your credentials to access your dashboard.">
      <form className="form">
        <Input label="Email" placeholder="you@example.com" />

        <PasswordInput placeholder="••••••••" />

        <div className='form-actions'>

            <Button type='submit'>Login</Button>

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



