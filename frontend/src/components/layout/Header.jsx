'use client'

import styles from './Header.module.css'
import {useEffect, useState} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Container from "./Container"
import Button from "../ui/Button"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  const handleSignIn = () => {router.push('/signIn')}
  const handleCreateEvent = () => {
    if(authenticated){
      // direct to create event page
    }else{
      router.push('/signIn')
    }
  }

  return(
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <Container>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Event-Sync
          </Link>

          <ul className={styles.navMenu}>
            <li><Link href="#features">Features</Link></li>
            <li className='comingSoon'><Link href="">How It Works</Link></li>
            <li className='comingSoon'><Link href="">Pricing</Link></li>
            <li className='comingSoon'><Link href="">Support</Link></li>
          </ul>

          <div className={styles.navButtons}>
            <Button variant="secondary" onClick={handleSignIn}>Sign In</Button>
            <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
          </div>
        </nav>
      </Container>
    </header>
  )
}

export default Header
