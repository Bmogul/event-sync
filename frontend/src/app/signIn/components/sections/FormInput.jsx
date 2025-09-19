import { useState } from 'react'
import styles from '../../page.module.css'

const FormInput = ({ 
  type = 'text', 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  helpText,
  errorText,
  isPassword = false
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.formLabel}>
        {label}
      </label>
      <div className={isPassword ? styles.passwordInputContainer : ''}>
        <input
          type={inputType}
          id={name}
          name={name}
          className={styles.formInput}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
      {helpText && <div className={styles.formHelp}>{helpText}</div>}
      {errorText && <div className={styles.formError}>{errorText}</div>}
    </div>
  )
}

export default FormInput