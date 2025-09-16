"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./NotFound.module.css";

const NotFound = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    
    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  const quickLinks = [
    { label: "Create Event", path: "/create-event", icon: "🎉" },
    { label: "Pricing", path: "/pricing", icon: "💰" },
    { label: "Support", path: "/support", icon: "🆘" },
    { label: "Getting Started", path: "/support/getting-started", icon: "🚀" },
  ];

  return (
    <>
      <Header />
      <main className={styles.notFoundPage}>
        <Container>
          <div className={`${styles.content} ${isAnimating ? styles.animate : ''}`}>
            {/* 404 Hero Section */}
            <div className={styles.hero}>
              <div className={styles.errorCode}>
                <span className={styles.fourZeroFour}>404</span>
                <div className={styles.errorAnimation}>
                  <div className={styles.floatingElement}>🎪</div>
                  <div className={styles.floatingElement}>🎭</div>
                  <div className={styles.floatingElement}>🎨</div>
                  <div className={styles.floatingElement}>✨</div>
                </div>
              </div>
              
              <h1 className={styles.title}>
                Oops! This page does not exist<span className={styles.highlight}>coming soon</span>
              </h1>
              
              <p className={styles.subtitle}>
                let's get you back to planning amazing events!
              </p>

              <div className={styles.countdown}>
                <div className={styles.countdownTimer}>
                  <span className={styles.countdownNumber}>{countdown}</span>
                  <span className={styles.countdownText}>seconds until redirect</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <Button 
                variant="primary" 
                size="large" 
                onClick={handleGoHome}
                className={styles.primaryButton}
              >
                🏠 Go Home
              </Button>
              <Button 
                variant="secondary" 
                size="large" 
                onClick={handleGoBack}
              >
                ← Go Back
              </Button>
              <Button 
                variant="outline" 
                size="large" 
                onClick={handleCreateEvent}
              >
                ✨ Create Event
              </Button>
            </div>

            {/* Quick Links */}
            <div className={styles.quickLinks}>
              <h2 className={styles.quickLinksTitle}>Popular Pages</h2>
              <div className={styles.linksGrid}>
                {quickLinks.map((link, index) => (
                  <div 
                    key={index}
                    className={styles.linkCard}
                    onClick={() => router.push(link.path)}
                  >
                    <div className={styles.linkIcon}>{link.icon}</div>
                    <span className={styles.linkLabel}>{link.label}</span>
                    <div className={styles.linkArrow}>→</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className={styles.comingSoon}>
              <h2 className={styles.comingSoonTitle}>What's Coming Soon</h2>
              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📱</div>
                  <h3>Mobile App</h3>
                  <p>Manage events on the go with our native mobile app</p>
                  <div className={styles.comingSoonBadge}>Q2 2024</div>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🔗</div>
                  <h3>API Integration</h3>
                  <p>Connect Event-Sync with your favorite tools and services</p>
                  <div className={styles.comingSoonBadge}>Q3 2024</div>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>📊</div>
                  <h3>Advanced Analytics</h3>
                  <p>Deep insights and reporting for your events</p>
                  <div className={styles.comingSoonBadge}>Q2 2024</div>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>💬</div>
                  <h3>Guest Chat</h3>
                  <p>Real-time communication between guests and hosts</p>
                  <div className={styles.comingSoonBadge}>Q4 2024</div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className={styles.support}>
              <div className={styles.supportContent}>
                <h2 className={styles.supportTitle}>Need Help?</h2>
                <p className={styles.supportDescription}>
                  Our support team is here to help you with any questions or issues.
                </p>
                
                <div className={styles.supportOptions}>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/support')}
                  >
                    📚 Browse Help Center
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/support#contact')}
                  >
                    💬 Contact Support
                  </Button>
                </div>
              </div>
            </div>

            {/* Fun Facts */}
            <div className={styles.funFacts}>
              <h3 className={styles.funFactsTitle}>While You Wait...</h3>
              <div className={styles.factsList}>
                <div className={styles.fact}>
                  <span className={styles.factIcon}>🎉</span>
                  <span>Over 10,000 events created on Event-Sync</span>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factIcon}>💌</span>
                  <span>500,000+ invitations sent successfully</span>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factIcon}>⭐</span>
                  <span>99.9% customer satisfaction rate</span>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factIcon}>🌍</span>
                  <span>Used in over 50 countries worldwide</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default NotFound;
