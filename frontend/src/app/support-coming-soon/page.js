"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./SupportComingSoon.module.css";

const SupportComingSoon = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);
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

  return (
    <>
      <Header />
      <main className={styles.supportComingSoonPage}>
        <Container>
          <div className={`${styles.content} ${isAnimating ? styles.animate : ''}`}>
            {/* Coming Soon Hero Section */}
            <div className={styles.hero}>
              <div className={styles.supportIcon}>
                <div className={styles.iconAnimation}>
                  <div className={styles.floatingElement}>🆘</div>
                  <div className={styles.floatingElement}>📚</div>
                  <div className={styles.floatingElement}>💬</div>
                  <div className={styles.floatingElement}>⭐</div>
                </div>
                <span className={styles.mainIcon}>🔧</span>
              </div>
              
              <h1 className={styles.title}>
                Support Center <span className={styles.highlight}>Coming Soon</span>
              </h1>
              
              <p className={styles.subtitle}>
                We're building an amazing support experience with comprehensive guides, 
                live chat, and detailed documentation to help you succeed with Event-Sync.
              </p>

              <div className={styles.countdown}>
                <div className={styles.countdownTimer}>
                  <span className={styles.countdownNumber}>{countdown}</span>
                  <span className={styles.countdownText}>seconds until redirect</span>
                </div>
              </div>
            </div>

            {/* What's Coming */}
            <div className={styles.featuresPreview}>
              <h2 className={styles.previewTitle}>What's Coming in Our Support Center</h2>
              <div className={styles.previewGrid}>
                <div className={styles.previewCard}>
                  <div className={styles.previewIcon}>📚</div>
                  <h3>Comprehensive FAQ</h3>
                  <p>Detailed answers to all your Event-Sync questions</p>
                </div>
                
                <div className={styles.previewCard}>
                  <div className={styles.previewIcon}>💬</div>
                  <h3>Live Chat Support</h3>
                  <p>Real-time help from our support experts</p>
                </div>
                
                <div className={styles.previewCard}>
                  <div className={styles.previewIcon}>🎥</div>
                  <h3>Video Tutorials</h3>
                  <p>Step-by-step guides for all features</p>
                </div>
                
                <div className={styles.previewCard}>
                  <div className={styles.previewIcon}>📖</div>
                  <h3>Documentation</h3>
                  <p>Complete guides and best practices</p>
                </div>
              </div>
            </div>

            {/* Temporary Support */}
            <div className={styles.tempSupport}>
              <h2 className={styles.tempSupportTitle}>Need Help Right Now?</h2>
              <p className={styles.tempSupportDescription}>
                While we're perfecting our support center, here are some quick resources:
              </p>
              
              <div className={styles.tempOptions}>
                <div className={styles.tempOption}>
                  <div className={styles.tempIcon}>🚀</div>
                  <h3>Getting Started</h3>
                  <p>Learn the basics of creating your first event</p>
                  <Button 
                    variant="primary" 
                    size="small"
                    onClick={() => router.push('/support/getting-started')}
                  >
                    View Guide
                  </Button>
                </div>
                
                <div className={styles.tempOption}>
                  <div className={styles.tempIcon}>📧</div>
                  <h3>Email Best Practices</h3>
                  <p>Tips for effective event communications</p>
                  <Button 
                    variant="primary" 
                    size="small"
                    onClick={() => router.push('/support/email-best-tips')}
                  >
                    Read Tips
                  </Button>
                </div>
                
                <div className={styles.tempOption}>
                  <div className={styles.tempIcon}>💰</div>
                  <h3>Pricing Information</h3>
                  <p>Compare our plans and features</p>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => router.push('/pricing')}
                  >
                    View Pricing
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Button 
                variant="primary" 
                size="large" 
                onClick={() => router.push('/')}
                className={styles.primaryButton}
              >
                🏠 Go Home
              </Button>
              <Button 
                variant="secondary" 
                size="large" 
                onClick={() => router.back()}
              >
                ← Go Back
              </Button>
              <Button 
                variant="outline" 
                size="large" 
                onClick={() => router.push('/create-event')}
              >
                ✨ Create Event
              </Button>
            </div>

            {/* Development Timeline */}
            <div className={styles.timeline}>
              <h3 className={styles.timelineTitle}>Development Timeline</h3>
              <div className={styles.timelineItems}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>✅</div>
                  <div className={styles.timelineContent}>
                    <h4>Phase 1 - Getting Started Guide</h4>
                    <p>Completed • Comprehensive onboarding documentation</p>
                  </div>
                </div>
                
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>✅</div>
                  <div className={styles.timelineContent}>
                    <h4>Phase 2 - Email Best Practices</h4>
                    <p>Completed • Tips and templates for effective communication</p>
                  </div>
                </div>
                
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>🔄</div>
                  <div className={styles.timelineContent}>
                    <h4>Phase 3 - Complete Support Center</h4>
                    <p>In Development • FAQ, live chat, and full documentation</p>
                  </div>
                </div>
                
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>⏳</div>
                  <div className={styles.timelineContent}>
                    <h4>Phase 4 - Advanced Features</h4>
                    <p>Coming Soon • Video tutorials and interactive guides</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className={styles.emergencyContact}>
              <h3 className={styles.emergencyTitle}>Need Urgent Support?</h3>
              <p className={styles.emergencyDescription}>
                For urgent issues, please contact us directly:
              </p>
              <div className={styles.contactOptions}>
                <div className={styles.contactOption}>
                  <span className={styles.contactIcon}>📧</span>
                  <span>support@eventsync.com</span>
                </div>
                <div className={styles.contactOption}>
                  <span className={styles.contactIcon}>📱</span>
                  <span>Response within 24 hours</span>
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

export default SupportComingSoon;