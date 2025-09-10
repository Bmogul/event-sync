"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./GettingStarted.module.css";

const GettingStarted = () => {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);

  const toggleStepComplete = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(step => step !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const handleStartCreating = () => {
    router.push('/create-event');
  };

  const steps = [
    {
      title: "Sign Up & Account Setup",
      duration: "2 minutes",
      description: "Create your Event-Sync account and set up your profile",
      details: [
        "Click 'Sign In' from the homepage and choose 'Sign Up'",
        "Enter your name, email, and create a secure password",
        "Verify your email address using the confirmation link",
        "Complete your profile with basic information",
        "You're ready to create your first event!"
      ],
      tips: [
        "Use a business email if creating corporate events",
        "Choose a strong password for account security",
        "Add a profile photo to personalize your invitations"
      ],
      screenshot: "/screenshots/signup.png"
    },
    {
      title: "Create Your First Event",
      duration: "5 minutes",
      description: "Set up the basic details for your event",
      details: [
        "Click 'Create Event' from your dashboard",
        "Enter your event title (e.g., 'Sarah & John's Wedding')",
        "Add event description and key details",
        "Set the main event date and location",
        "Choose your event type (Wedding, Corporate, Birthday, etc.)",
        "Save your event to continue"
      ],
      tips: [
        "Use a descriptive title that guests will recognize",
        "Include the full address for location",
        "Event type helps us suggest relevant features"
      ],
      screenshot: "/screenshots/create-event.png"
    },
    {
      title: "Add Sub-Events",
      duration: "10 minutes",
      description: "Break down your event into individual activities",
      details: [
        "Navigate to the 'Sub-Events' section",
        "Click 'Add Sub-Event' to create individual activities",
        "For weddings: Add 'Rehearsal Dinner', 'Ceremony', 'Reception'",
        "Set specific dates, times, and locations for each",
        "Add dress codes, special instructions, or notes",
        "Arrange sub-events in chronological order"
      ],
      tips: [
        "Most events have 2-4 sub-events",
        "Be specific with timing to avoid guest confusion",
        "Include parking or transportation details"
      ],
      screenshot: "/screenshots/sub-events.png"
    },
    {
      title: "Import Your Guest List",
      duration: "15 minutes",
      description: "Add your guests and organize them into families/groups",
      details: [
        "Go to the 'Guest List' section",
        "Choose to import from CSV or add guests manually",
        "For CSV: Download our template and fill in guest details",
        "Upload your completed CSV file",
        "Review and organize guests into families/groups",
        "Add plus-ones and special dietary restrictions"
      ],
      tips: [
        "CSV import saves time for large guest lists (50+ people)",
        "Group related guests together (Smith Family, Work Friends)",
        "Include phone numbers for SMS notifications"
      ],
      screenshot: "/screenshots/guest-list.png"
    },
    {
      title: "Customize Your RSVP Page",
      duration: "20 minutes",
      description: "Design your RSVP page to match your event style",
      details: [
        "Navigate to the 'RSVP Customization' section",
        "Choose your color scheme and theme",
        "Upload your event photos or logo",
        "Customize the welcome message and instructions",
        "Set RSVP deadline date",
        "Preview your page on desktop and mobile",
        "Make final adjustments to layout and content"
      ],
      tips: [
        "Use high-quality images for best appearance",
        "Keep welcome messages friendly but concise",
        "Test the page on mobile devices"
      ],
      screenshot: "/screenshots/rsvp-customize.png"
    },
    {
      title: "Set Up Guest Communication",
      duration: "10 minutes",
      description: "Configure email templates and communication settings (Premium only)",
      details: [
        "Go to 'Email Settings' in your event dashboard",
        "Customize your invitation email template",
        "Set up automated reminder schedules",
        "Write welcome messages for different sub-events",
        "Configure SMS notification preferences",
        "Test send emails to yourself first"
      ],
      tips: [
        "Personalize emails with guest names",
        "Send test emails before mass sending",
        "Schedule reminders 2 weeks and 3 days before"
      ],
      screenshot: "/screenshots/email-setup.png",
      premium: true
    },
    {
      title: "Preview & Test Your Event",
      duration: "10 minutes",
      description: "Review everything before going live",
      details: [
        "Use the 'Preview' button to see your RSVP page",
        "Test the RSVP process from a guest's perspective",
        "Check all sub-events display correctly",
        "Verify guest list imports properly",
        "Test email sending with a small group first",
        "Make any final adjustments needed"
      ],
      tips: [
        "Ask a friend to test the RSVP process",
        "Double-check all dates and locations",
        "Ensure mobile experience works well"
      ],
      screenshot: "/screenshots/preview.png"
    },
    {
      title: "Launch & Send Invitations",
      duration: "5 minutes",
      description: "Make your event live and send invitations to guests",
      details: [
        "Click 'Publish Event' to make it live",
        "Choose your plan (Basic $21 or Premium $110)",
        "Complete payment to activate features",
        "Send invitations via email or share RSVP links",
        "Monitor responses in your dashboard",
        "Send follow-up reminders as needed"
      ],
      tips: [
        "Start with Premium for full communication features",
        "Send invitations 6-8 weeks before events",
        "Track response rates in your analytics"
      ],
      screenshot: "/screenshots/launch.png"
    },
    {
      title: "Monitor & Manage RSVPs",
      duration: "Ongoing",
      description: "Track responses and manage your guest communications",
      details: [
        "Check your dashboard daily for new responses",
        "Review guest analytics and response rates",
        "Send reminder emails to non-responders",
        "Update guest information as needed",
        "Export guest lists for vendor planning",
        "Send event updates or changes to guests"
      ],
      tips: [
        "Set calendar reminders to check responses",
        "Follow up with important guests personally",
        "Keep vendors updated with accurate head counts"
      ],
      screenshot: "/screenshots/manage.png"
    }
  ];

  const quickStartChecklist = [
    "Create your Event-Sync account",
    "Set up basic event information",
    "Add 2-3 sub-events",
    "Import or add 10+ guests",
    "Customize your RSVP page colors",
    "Preview and test RSVP flow",
    "Choose your plan and publish",
    "Send first batch of invitations"
  ];

  return (
    <>
      <Header />
      <main className={styles.gettingStartedPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <Container>
            <div className={styles.heroContent}>
              <div className={styles.breadcrumb}>
                <span onClick={() => router.push('/support')} className={styles.breadcrumbLink}>
                  Support
                </span>
                <span className={styles.breadcrumbSeparator}>→</span>
                <span>Getting Started Guide</span>
              </div>
              
              <h1 className={styles.heroTitle}>
                Getting Started with <span className={styles.highlight}>Event-Sync</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Complete step-by-step guide to create your first event in under 30 minutes
              </p>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>9</span>
                  <span className={styles.statLabel}>Easy Steps</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>30</span>
                  <span className={styles.statLabel}>Minutes</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Success Rate</span>
                </div>
              </div>

              <Button 
                variant="primary" 
                size="large" 
                onClick={handleStartCreating}
                className={styles.ctaButton}
              >
                Start Creating Your Event
              </Button>
            </div>
          </Container>
        </section>

        {/* Quick Start Checklist */}
        <section className={styles.quickStart}>
          <Container>
            <div className={styles.quickStartContent}>
              <h2 className={styles.sectionTitle}>Quick Start Checklist</h2>
              <p className={styles.sectionSubtitle}>
                Follow this checklist to get your event up and running quickly
              </p>
              
              <div className={styles.checklist}>
                {quickStartChecklist.map((item, index) => (
                  <div 
                    key={index} 
                    className={`${styles.checklistItem} ${completedSteps.includes(index) ? styles.completed : ''}`}
                    onClick={() => toggleStepComplete(index)}
                  >
                    <div className={styles.checklistIcon}>
                      {completedSteps.includes(index) ? '✓' : index + 1}
                    </div>
                    <span className={styles.checklistText}>{item}</span>
                  </div>
                ))}
              </div>

              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(completedSteps.length / quickStartChecklist.length) * 100}%` }}
                ></div>
              </div>
              <p className={styles.progressText}>
                {completedSteps.length} of {quickStartChecklist.length} steps completed
              </p>
            </div>
          </Container>
        </section>

        {/* Detailed Steps */}
        <section className={styles.detailedGuide}>
          <Container>
            <h2 className={styles.sectionTitle}>Detailed Step-by-Step Guide</h2>
            <p className={styles.sectionSubtitle}>
              Complete instructions for each step of the event creation process
            </p>

            <div className={styles.stepsContainer}>
              {/* Step Navigation */}
              <div className={styles.stepsNavigation}>
                <h3 className={styles.navTitle}>Steps</h3>
                {steps.map((step, index) => (
                  <button
                    key={index}
                    className={`${styles.stepNavItem} ${activeStep === index ? styles.active : ''}`}
                    onClick={() => setActiveStep(index)}
                  >
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <span className={styles.stepNavTitle}>{step.title}</span>
                    {step.premium && <span className={styles.premiumBadge}>Premium</span>}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepNumber}>Step {activeStep + 1}</span>
                    <span className={styles.stepDuration}>⏱️ {steps[activeStep].duration}</span>
                    {steps[activeStep].premium && (
                      <span className={styles.premiumTag}>👑 Premium Feature</span>
                    )}
                  </div>
                  <h3 className={styles.stepTitle}>{steps[activeStep].title}</h3>
                  <p className={styles.stepDescription}>{steps[activeStep].description}</p>
                </div>

                <div className={styles.stepBody}>
                  <div className={styles.stepDetails}>
                    <h4 className={styles.subheading}>Instructions</h4>
                    <ol className={styles.stepList}>
                      {steps[activeStep].details.map((detail, index) => (
                        <li key={index} className={styles.stepListItem}>
                          {detail}
                        </li>
                      ))}
                    </ol>

                    <h4 className={styles.subheading}>💡 Pro Tips</h4>
                    <ul className={styles.tipsList}>
                      {steps[activeStep].tips.map((tip, index) => (
                        <li key={index} className={styles.tipItem}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot placeholder */}
                  <div className={styles.stepScreenshot}>
                    <div className={styles.screenshotPlaceholder}>
                      <div className={styles.screenshotIcon}>📱</div>
                      <p>Screenshot coming soon</p>
                      <small>{steps[activeStep].title} Interface</small>
                    </div>
                  </div>
                </div>

                <div className={styles.stepNavigation}>
                  {activeStep > 0 && (
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveStep(activeStep - 1)}
                    >
                      ← Previous Step
                    </Button>
                  )}
                  {activeStep < steps.length - 1 && (
                    <Button 
                      variant="primary" 
                      onClick={() => setActiveStep(activeStep + 1)}
                    >
                      Next Step →
                    </Button>
                  )}
                  {activeStep === steps.length - 1 && (
                    <Button 
                      variant="primary" 
                      onClick={handleStartCreating}
                    >
                      Start Creating Your Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Need Help Section */}
        <section className={styles.helpSection}>
          <Container>
            <div className={styles.helpContent}>
              <h2 className={styles.helpTitle}>Need Additional Help?</h2>
              <p className={styles.helpDescription}>
                Our support team is here to help you succeed with your event
              </p>
              
              <div className={styles.helpOptions}>
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>💬</div>
                  <h3>Live Chat Support</h3>
                  <p>Get instant help Mon-Fri 9AM-6PM PST</p>
                  <Button variant="outline" size="small">Start Chat</Button>
                </div>
                
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>📧</div>
                  <h3>Email Support</h3>
                  <p>Detailed help within 24 hours</p>
                  <Button variant="outline" size="small">Send Email</Button>
                </div>
                
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>📚</div>
                  <h3>Full Documentation</h3>
                  <p>Browse our complete help center</p>
                  <Button variant="outline" size="small" onClick={() => router.push('/support')}>
                    View Support
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default GettingStarted;