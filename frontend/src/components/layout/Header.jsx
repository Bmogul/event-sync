'use client'

import styles from './Header.module.css'
import {useEffect, useState} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Container from "./Container"
import Button from "../ui/Button"
import { useAuth } from '../../app/contexts/AuthContext'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const router = useRouter()
  const { user, userProfile, session, loading, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest(`.${styles.profileContainer}`)) {
        setIsProfileDropdownOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isProfileDropdownOpen])

  const handleSignIn = () => {
    setIsMobileMenuOpen(false)
    router.push('/signIn')
  }

  const handleCreateEvent = () => {
    setIsMobileMenuOpen(false)
    router.push('/create-event')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsProfileDropdownOpen(false)
      setIsMobileMenuOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
  }

  const handleDashboard = () => {
    setIsProfileDropdownOpen(false)
    setIsMobileMenuOpen(false)
    router.push('/dashboard')
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
            {user && session ? (
              <div className={styles.userProfile}>
                <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
                <div className={styles.profileContainer}>
                  <button 
                    className={styles.profileButton}
                    onClick={toggleProfileDropdown}
                    aria-label="User profile menu"
                  >
                    <div className={styles.profileAvatar}>
                      {userProfile?.settings?.avatar_url ? (
                        <img 
                          src={userProfile.settings.avatar_url} 
                          alt={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email}
                          className={styles.avatarImage}
                        />
                      ) : (
                        <img 
                          src="/avatar-placeholder.svg" 
                          alt="Default avatar"
                          className={styles.avatarImage}
                        />
                      )}
                    </div>
                    <span className={styles.profileName}>
                      {userProfile?.first_name || userProfile?.last_name 
                        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
                        : user.email}
                    </span>
                    <svg 
                      className={`${styles.chevron} ${isProfileDropdownOpen ? styles.chevronRotated : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none"
                    >
                      <path 
                        d="M4 6l4 4 4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className={styles.profileDropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.userInfo}>
                          <p className={styles.userName}>
                            {userProfile?.first_name || userProfile?.last_name 
                              ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
                              : 'User'}
                          </p>
                          <p className={styles.userEmail}>{user.email}</p>
                        </div>
                      </div>
                      <div className={styles.dropdownDivider}></div>
                      <button 
                        className={styles.dropdownItem}
                        onClick={handleDashboard}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path 
                            d="M2 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3zM9 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM2 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3zM9 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" 
                            fill="currentColor"
                          />
                        </svg>
                        Dashboard
                      </button>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          router.push('/account/settings')
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path 
                            d="M8 10a2 2 0 100-4 2 2 0 000 4z" 
                            fill="currentColor"
                          />
                          <path 
                            fillRule="evenodd" 
                            clipRule="evenodd" 
                            d="M8 0a1 1 0 01.993.883L9 1v1.068A6.001 6.001 0 0114.932 8H16a1 1 0 01.117 1.993L16 10h-1.068A6.001 6.001 0 018 15.932V15a1 1 0 01-1.993-.117L6 15v-1.068A6.001 6.001 0 011.068 8H0a1 1 0 01-.117-1.993L0 6h1.068A6.001 6.001 0 018 1.068V1a1 1 0 01.883-.993L8 0zm0 3a5 5 0 100 10 5 5 0 000-10z" 
                            fill="currentColor"
                          />
                        </svg>
                        Account Settings
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button 
                        className={`${styles.dropdownItem} ${styles.signOutItem}`}
                        onClick={handleSignOut}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path 
                            d="M6 2a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 100-2H6V4h1a1 1 0 100-2H6zM11.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 9H9a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 010-1.414z" 
                            fill="currentColor"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Button variant="secondary" onClick={handleSignIn}>Sign In</Button>
                <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
              </>
            )}
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
                {user && session ? (
                  <>
                    <div className={styles.mobileUserInfo}>
                      <div className={styles.mobileProfileAvatar}>
                        {userProfile?.settings?.avatar_url ? (
                          <img 
                            src={userProfile.settings.avatar_url} 
                            alt={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email}
                            className={styles.mobileAvatarImage}
                          />
                        ) : (
                          <img 
                            src="/avatar-placeholder.svg" 
                            alt="Default avatar"
                            className={styles.mobileAvatarImage}
                          />
                        )}
                      </div>
                      <div className={styles.mobileUserDetails}>
                        <p className={styles.mobileUserName}>
                          {userProfile?.first_name || userProfile?.last_name 
                            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
                            : 'User'}
                        </p>
                        <p className={styles.mobileUserEmail}>{user.email}</p>
                      </div>
                    </div>
                    <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
                    <Button variant="secondary" onClick={handleDashboard}>Dashboard</Button>
                    <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={handleSignIn}>Sign In</Button>
                    <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}

export default Header
