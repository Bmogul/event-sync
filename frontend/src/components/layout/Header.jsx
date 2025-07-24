'use client'

import styles from './Header.module.css'
import {useEffect, useState} from 'react'
import Link from 'next/link'
import Container from "./Container"
import Button from "../ui/Button"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  return(
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <Container>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Event-Sync
          </Link>

          <ul className={styles.navMenu}>
            <li><Link href="">Features</Link></li>
            <li><Link href="">How It Works</Link></li>
            <li><Link href="">Pricing</Link></li>
            <li><Link href="">Support</Link></li>
          </ul>

          <div className={styles.navButtons}>
            <Button variant="secondary">Sign In</Button>
            <Button variant="primary">Create Event</Button>
          </div>
        </nav>
      </Container>
    </header>
  )
}

export default Header
