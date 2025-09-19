"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./Pricing.module.css";

const Pricing = () => {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState("event"); // event-based pricing

  const handleGetStarted = (plan) => {
    // In a real implementation, this would handle payment processing
    console.log(`Selected plan: ${plan}`);
    router.push('/create-event');
  };

  const handleContactSales = () => {
    // Could open a contact modal or navigate to contact page
    console.log("Contact sales clicked");
  };

  return (
    <>
      <Header />
      <main className={styles.pricingPage}>
        {/* Hero Section */}
        <section className={styles.pricingHero}>
          <Container>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Simple, transparent <span className={styles.highlight}>pricing</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Choose the perfect plan for your event needs. No hidden fees, no subscriptions.
              </p>
              <div className={styles.billingToggle}>
                <span className={styles.billingLabel}>Pay per event</span>
              </div>
            </div>
          </Container>
        </section>

        {/* Pricing Plans */}
        <section className={styles.pricingPlans}>
          <Container>
            <div className={styles.plansGrid}>
              
              {/* Basic Plan */}
              <div className={styles.pricingCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.planBadge}>
                    <span>Basic</span>
                  </div>
                  <h3 className={styles.planName}>Event Creator</h3>
                  <p className={styles.planDescription}>
                    Perfect for simple event planning without guest communication
                  </p>
                </div>

                <div className={styles.pricingSection}>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>21</span>
                    <span className={styles.period}>per event</span>
                  </div>
                </div>

                <div className={styles.featuresSection}>
                  <ul className={styles.featuresList}>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Create unlimited sub-events
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Guest list management
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Custom RSVP page design
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Basic analytics dashboard
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Export guest data (CSV)
                    </li>
                    <li className={styles.featureDisabled}>
                      <span className={styles.featureIcon}>✗</span>
                      Email invitations & reminders
                    </li>
                    <li className={styles.featureDisabled}>
                      <span className={styles.featureIcon}>✗</span>
                      Automated RSVP follow-ups
                    </li>
                    <li className={styles.featureDisabled}>
                      <span className={styles.featureIcon}>✗</span>
                      SMS notifications
                    </li>
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <Button 
                    variant="secondary" 
                    size="large"
                    onClick={() => handleGetStarted('basic')}
                    className={styles.planButton}
                  >
                    Get Started
                  </Button>
                  <p className={styles.cardFooterText}>One-time payment per event</p>
                </div>
              </div>

              {/* Premium Plan */}
              <div className={`${styles.pricingCard} ${styles.popular}`}>
                <div className={styles.popularBadge}>
                  <span>Most Popular</span>
                </div>
                
                <div className={styles.cardHeader}>
                  <div className={styles.planBadge}>
                    <span>Premium</span>
                  </div>
                  <h3 className={styles.planName}>Full Event Suite</h3>
                  <p className={styles.planDescription}>
                    Complete event management with guest communication & automation
                  </p>
                </div>

                <div className={styles.pricingSection}>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>110</span>
                    <span className={styles.period}>per event</span>
                  </div>
                  <p className={styles.savings}>Save $89 vs basic + add-ons</p>
                </div>

                <div className={styles.featuresSection}>
                  <ul className={styles.featuresList}>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Everything in Event Creator
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Unlimited email invitations
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Automated RSVP reminders
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Custom email templates
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      SMS notifications (50 included)
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Advanced analytics & reporting
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      Priority customer support
                    </li>
                    <li className={styles.feature}>
                      <span className={styles.featureIcon}>✓</span>
                      White-label RSVP pages
                    </li>
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={() => handleGetStarted('premium')}
                    className={styles.planButton}
                  >
                    Get Started
                  </Button>
                  <p className={styles.cardFooterText}>One-time payment per event</p>
                </div>
              </div>

            </div>
          </Container>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <Container>
            <div className={styles.faqHeader}>
              <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
              <p className={styles.faqSubtitle}>
                Everything you need to know about our pricing
              </p>
            </div>

            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How does per-event pricing work?</h3>
                <p className={styles.faqAnswer}>
                  You pay once per event you create. Each event includes all sub-events (like rehearsal dinner, ceremony, reception) under one price.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>What counts as one event?</h3>
                <p className={styles.faqAnswer}>
                  One event is a collection of related activities (e.g., a wedding weekend with multiple sub-events like rehearsal, ceremony, and reception).
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Are there any setup fees?</h3>
                <p className={styles.faqAnswer}>
                  No setup fees, no monthly subscriptions. Just pay the one-time fee when you create your event.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Can I upgrade from Basic to Premium?</h3>
                <p className={styles.faqAnswer}>
                  Yes! You can upgrade at any time by paying the difference ($89) to unlock all communication features.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Is there a limit on guests?</h3>
                <p className={styles.faqAnswer}>
                  No guest limits on either plan. Invite as many people as you need for your event.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>What payment methods do you accept?</h3>
                <p className={styles.faqAnswer}>
                  We accept all major credit cards, PayPal, and bank transfers for enterprise clients.
                </p>
              </div>
            </div>

            <div className={styles.contactSection}>
              <div className={styles.contactCard}>
                <h3 className={styles.contactTitle}>Need something custom?</h3>
                <p className={styles.contactDescription}>
                  Planning a large corporate event or need special features? Let's chat about a custom solution.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleContactSales}
                  className={styles.contactButton}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Pricing;