import Container from '../layout/Container'
import Button from '../ui/Button'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import styles from './CTA.module.css'

const CTA = () => {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation()
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollAnimation()
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation()

  return (
    <section className={styles.cta}>
      <Container>
        <div className={styles.ctaContent}>
          <div 
            className={`${styles.ctaHeader} ${contentVisible ? styles.visible : ''}`}
            ref={contentRef}
          >
            <h2>Ready to organize your event?</h2>
            <p>
              Join the early adopters who helped shape Event-Sync during our beta phase. 
              Start creating your event today with our simple, pay-once pricing.
            </p>
          </div>
          
          <div 
            className={`${styles.ctaActions} ${actionsVisible ? styles.visible : ''}`}
            ref={actionsRef}
          >
            <Button variant="white" size="large">
              Create Your First Event
            </Button>
            <Button variant="outline" size="large">
              View Pricing
            </Button>
          </div>

          <div 
            className={`${styles.finalStats} ${statsVisible ? styles.visible : ''}`}
            ref={statsRef}
          >
            <div className={styles.finalStat}>
              <span className={styles.finalStatNumber}>Beta</span>
              <span className={styles.finalStatLabel}>Tested & Loved</span>
            </div>
            <div className={styles.finalStat}>
              <span className={styles.finalStatNumber}>Fresh</span>
              <span className={styles.finalStatLabel}>New Platform</span>
            </div>
            <div className={styles.finalStat}>
              <span className={styles.finalStatNumber}>24hr</span>
              <span className={styles.finalStatLabel}>Email Support</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default CTA
