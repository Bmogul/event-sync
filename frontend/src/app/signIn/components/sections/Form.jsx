import { useState } from 'react'
import styles from '../../page.module.css'
import SocialLogin from './SocialLogin'

const AuthForm = ({ isSignUp, onSwitchTab, onSocialLogin, isLoading }) => {
  const [formData, setFormData] = useState({
    terms: false,
    marketing: false
  })

  const handleInputChange = (e) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSocialLogin = (provider) => {
    if (isSignUp && !formData.terms) {
      alert('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    onSocialLogin(provider, formData)
  }

  return (
    <div className={styles.authFormContainer}>
      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>Welcome</h1>
        <p className={styles.authSubtitle}>
          {isSignUp 
            ? 'Join thousands creating unforgettable events' 
            : 'Welcome back to EventSync'
          }
        </p>
        
        <div className={styles.authToggle}>
          <button 
            className={`${styles.authToggleBtn} ${!isSignUp ? styles.active : ''}`} 
            onClick={() => onSwitchTab('login')}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={`${styles.authToggleBtn} ${isSignUp ? styles.active : ''}`} 
            onClick={() => onSwitchTab('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className={styles.authForm}>
        <SocialLogin onSocialLogin={handleSocialLogin} />

        <div className={styles.socialOnlyMessage}>
          <p className={styles.messageText}>
            {isSignUp 
              ? 'Create your account securely using your Google or Apple account. No passwords required!'
              : 'Sign in securely using your Google or Apple account.'
            }
          </p>
        </div>

        {isSignUp && (
          <div className={styles.signupOptions}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className={styles.checkboxInput}
                checked={formData.terms}
                onChange={handleInputChange}
                required
              />
              <label htmlFor="terms" className={styles.checkboxLabel}>
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="marketing"
                name="marketing"
                className={styles.checkboxInput}
                checked={formData.marketing}
                onChange={handleInputChange}
              />
              <label htmlFor="marketing" className={styles.checkboxLabel}>
                Send me updates about new features and event planning tips
              </label>
            </div>
          </div>
        )}

        <div className={styles.authFooter}>
          <p>
            {isSignUp 
              ? <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchTab('login'); }}>Sign in here</a></> 
              : <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchTab('signup'); }}>Create one here</a></>
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm