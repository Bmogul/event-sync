import Link from 'next/link'
import Container from './Container'
import styles from './Footer.module.css'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Examples', href: '/examples' }
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Getting Started', href: '/getting-started' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Feature Requests', href: '/feature-requests' }
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Blog', href: '/blog' }
  ]
}

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <h3>Event-Sync</h3>
            <p>
              Making multi-day event management simple and stress-free. From RSVPs to guest lists, 
              we help you create memorable experiences for you and your guests.
            </p>
            <div className={styles.socialLinks}>
              {/* Add social media links if needed */}
            </div>
          </div>
          
          <div className={styles.footerColumn}>
            <h4>Product</h4>
            <nav>
              {footerLinks.product.map((link, index) => (
                <Link key={index} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className={styles.footerColumn}>
            <h4>Support</h4>
            <nav>
              {footerLinks.support.map((link, index) => (
                <Link key={index} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <nav>
              {footerLinks.company.map((link, index) => (
                <Link key={index} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>
            &copy; {currentYear} Event-Sync. All rights reserved. Built for event hosts who care about their guests.
          </p>
        </div>
      </Container>
    </footer>
  )
}
export default Footer
