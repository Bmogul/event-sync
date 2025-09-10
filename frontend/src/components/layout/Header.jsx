'use client'

import styles from './Header.module.css'
import {useEffect, useState} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Container from "./Container"
import Button from "../ui/Button"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignIn = () => {
    setIsMobileMenuOpen(false)
    router.push('/signIn')
  }

  const handleCreateEvent = () => {
    // For now, always direct to create event page
    // In a full implementation, you'd check authentication status here
    setIsMobileMenuOpen(false)
    router.push('/create-event')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return(
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <Container>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Event-Sync
          </Link>

          {/* Desktop Navigation */}
          <ul className={styles.navMenu}>
            <li><Link href="/#features">Features</Link></li>
            <li className='comingSoon'><Link href="">How It Works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/support">Support</Link></li>
          </ul>

          <div className={styles.navButtons}>
            <Button variant="secondary" onClick={handleSignIn}>Sign In</Button>
            <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className={styles.hamburger}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.open : ''}`}></span>
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuOverlay} onClick={closeMobileMenu}>
            <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileMenuHeader}>
                <Link href="/" className={styles.mobileLogo} onClick={closeMobileMenu}>
                  Event-Sync
                </Link>
                <button 
                  className={styles.closeButton}
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  ✕
                </button>
              </div>

              <ul className={styles.mobileNavMenu}>
                <li><Link href="#features" onClick={closeMobileMenu}>Features</Link></li>
                <li className='comingSoon'><Link href="" onClick={closeMobileMenu}>How It Works</Link></li>
                <li><Link href="/pricing" onClick={closeMobileMenu}>Pricing</Link></li>
                <li><Link href="/support" onClick={closeMobileMenu}>Support</Link></li>
              </ul>

              <div className={styles.mobileNavButtons}>
                <Button variant="secondary" onClick={handleSignIn}>Sign In</Button>
                <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}

export default Header
