
'use client'
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import styles from "./page.module.css"
import Branding from "./components/sections/Branding";
import AuthForm from "./components/sections/Form";

const SignIn = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Add auth-page class to body for background styling
    document.body.classList.add('auth-page')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('auth-page')
    }
  }, [])

  const switchTab = (tab) => {
    setIsSignUp(tab === 'signup')
  }

  const handleSocialLogin = async (provider, formData) => {
    setIsLoading(true)
    
    // Simulate authentication process for UI demonstration
    console.log(`Demo: ${isSignUp ? 'Signup' : 'Login'} with ${provider}:`, formData)
    
    // Simulate loading state
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to user dashboard after successful authentication
      router.push('/dashboard')
    }, 2000)
  }

  return(
    <div className={`${styles.authContainer} ${styles.fadeIn}`}>
      <Branding />
      <AuthForm 
        isSignUp={isSignUp}
        onSwitchTab={switchTab}
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
      />
    </div>
  )
}

export default SignIn;
