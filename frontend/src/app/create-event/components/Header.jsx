import Link from 'next/link'
import styles from './Header.module.css'

const Header = ({ onSaveDraft, isLoading }) => {

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Event-Sync
          </Link>
          <div className={styles.navActions}>
            <Link href="/" className={`${styles.btn} ${styles.btnGhost}`}>
              ← Back to Home
            </Link>
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onSaveDraft}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
