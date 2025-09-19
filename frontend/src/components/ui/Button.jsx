import styles from './Button.module.css'

const Button = ({ children, variant = 'primary', size = 'medium', className = '', ...props }) => {
  const classes = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button;
