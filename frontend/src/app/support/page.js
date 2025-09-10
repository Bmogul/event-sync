"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./Support.module.css";

const Support = () => {
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

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send the form data
    console.log("Contact form submitted:", contactForm);
    alert("Thank you for contacting us! We'll get back to you within 24 hours.");
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
      priority: "medium"
    });
  };

  const handleInputChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const faqData = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create my first event?",
          a: "Click 'Create Event' from the homepage or dashboard. Follow our step-by-step wizard to set up your event details, add sub-events, and customize your RSVP page. For detailed instructions, check out our Getting Started Guide."
        },
        {
          q: "What's the difference between an event and a sub-event?",
          a: "An event is your main occasion (like a wedding), while sub-events are individual activities within it (like rehearsal dinner, ceremony, reception)."
        },
        {
          q: "Can I test the platform before paying?",
          a: "Yes! You can create and preview your event for free. Payment is only required when you're ready to publish and start collecting RSVPs."
        }
      ]
    },
    {
      category: "RSVP Management",
      questions: [
        {
          q: "How do guests RSVP to my event?",
          a: "Guests receive a custom link to your RSVP page where they can respond to each sub-event, specify party size, and add dietary restrictions or notes."
        },
        {
          q: "Can guests change their RSVP after submitting?",
          a: "Yes, guests can return to the RSVP page using their original link and update their responses at any time before your deadline."
        },
        {
          q: "How do I track RSVPs in real-time?",
          a: "Your event portal shows live RSVP counts, guest responses, and detailed analytics. You can also export data to CSV for external tracking."
        }
      ]
    },
    {
      category: "Communication",
      questions: [
        {
          q: "How do email invitations work?",
          a: "With the Premium plan, you can send personalized email invitations directly through our platform. Customize templates and track delivery status."
        },
        {
          q: "Can I send reminder emails?",
          a: "Yes! Premium users can send automated reminders to guests who haven't responded, or manually send custom reminder messages."
        },
        {
          q: "Are SMS notifications included?",
          a: "Premium plan includes 50 SMS notifications for urgent updates. Additional SMS messages can be purchased as needed."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "What browsers are supported?",
          a: "Event-Sync works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest browser version for best performance."
        },
        {
          q: "Is my data secure?",
          a: "Yes, we use industry-standard encryption and security practices. All data is stored securely and never shared with third parties."
        },
        {
          q: "Can I export my guest data?",
          a: "Both plans include CSV export functionality. Premium users also get advanced reporting and analytics exports."
        }
      ]
    }
  ];

  const helpTopics = [
    {
      icon: "🚀",
      title: "Getting Started Guide",
      description: "Step-by-step walkthrough of creating your first event",
      action: "View Guide",
      link: "/support/getting-started"
    },
    {
      icon: "📧",
      title: "Email Best Practices",
      description: "Tips for writing effective invitations and reminders",
      action: "Read Tips",
      link: "/support/email-best-tips"
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Understanding your RSVP data and guest insights",
      action: "Learn More"
    },
    {
      icon: "🎨",
      title: "Customization Options",
      description: "Personalizing your RSVP page design and branding",
      action: "Explore Options"
    },
    {
      icon: "📱",
      title: "Mobile Optimization",
      description: "Ensuring great experience across all devices",
      action: "View Tips"
    },
    {
      icon: "⚡",
      title: "Troubleshooting",
      description: "Common issues and quick solutions",
      action: "Get Help"
    }
  ];

  return (
    <>
      <Header />
      <main className={styles.supportPage}>
        <Container>
          <div className={`${styles.comingSoonContent} ${isAnimating ? styles.animate : ''}`}>
            {/* Coming Soon Hero Section */}
            <div className={styles.comingSoonHero}>
              <div className={styles.supportIcon}>
                <div className={styles.iconAnimation}>
                  <div className={styles.floatingElement}>🆘</div>
                  <div className={styles.floatingElement}>📚</div>
                  <div className={styles.floatingElement}>💬</div>
                  <div className={styles.floatingElement}>⭐</div>
                </div>
                <span className={styles.mainIcon}>🔧</span>
              </div>
              
              <h1 className={styles.comingSoonTitle}>
                Support Center <span className={styles.highlight}>Coming Soon</span>
              </h1>
              
              <p className={styles.comingSoonSubtitle}>
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
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

export default Support;