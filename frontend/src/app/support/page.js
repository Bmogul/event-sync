"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./Support.module.css";

const Support = () => {
  const [activeTab, setActiveTab] = useState("faq");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium"
  });

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
          a: "Click 'Create Event' from the homepage or dashboard. Follow our step-by-step wizard to set up your event details, add sub-events, and customize your RSVP page."
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
      action: "View Guide"
    },
    {
      icon: "📧",
      title: "Email Best Practices",
      description: "Tips for writing effective invitations and reminders",
      action: "Read Tips"
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
        {/* Hero Section */}
        <section className={styles.supportHero}>
          <Container>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                How can we <span className={styles.highlight}>help you</span>?
              </h1>
              <p className={styles.heroSubtitle}>
                Find answers, get support, or contact our team. We're here to make your event planning journey smooth.
              </p>
              
              {/* Search Bar */}
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search for help articles, guides, or FAQ..."
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>
                  🔍 Search
                </button>
              </div>
            </div>
          </Container>
        </section>

        {/* Quick Help Topics */}
        <section className={styles.helpTopics}>
          <Container>
            <h2 className={styles.sectionTitle}>Popular Help Topics</h2>
            <div className={styles.topicsGrid}>
              {helpTopics.map((topic, index) => (
                <div key={index} className={styles.topicCard}>
                  <div className={styles.topicIcon}>{topic.icon}</div>
                  <h3 className={styles.topicTitle}>{topic.title}</h3>
                  <p className={styles.topicDescription}>{topic.description}</p>
                  <button className={styles.topicAction}>{topic.action}</button>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Support Tabs */}
        <section className={styles.supportContent}>
          <Container>
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === "faq" ? styles.active : ""}`}
                onClick={() => setActiveTab("faq")}
              >
                📚 FAQ
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === "contact" ? styles.active : ""}`}
                onClick={() => setActiveTab("contact")}
              >
                💬 Contact Support
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === "resources" ? styles.active : ""}`}
                onClick={() => setActiveTab("resources")}
              >
                📖 Resources
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "faq" && (
                <div className={styles.faqSection}>
                  <h2 className={styles.contentTitle}>Frequently Asked Questions</h2>
                  <p className={styles.contentSubtitle}>
                    Find quick answers to the most common questions about Event-Sync
                  </p>

                  <div className={styles.faqCategories}>
                    {faqData.map((category, categoryIndex) => (
                      <div key={categoryIndex} className={styles.faqCategory}>
                        <h3 className={styles.categoryTitle}>{category.category}</h3>
                        <div className={styles.faqQuestions}>
                          {category.questions.map((faq, faqIndex) => (
                            <details key={faqIndex} className={styles.faqItem}>
                              <summary className={styles.faqQuestion}>
                                {faq.q}
                              </summary>
                              <div className={styles.faqAnswer}>
                                {faq.a}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className={styles.contactSection}>
                  <h2 className={styles.contentTitle}>Contact Our Support Team</h2>
                  <p className={styles.contentSubtitle}>
                    Can't find what you're looking for? We're here to help!
                  </p>

                  <div className={styles.contactGrid}>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactOption}>
                        <div className={styles.contactIcon}>📧</div>
                        <div>
                          <h4>Email Support</h4>
                          <p>support@eventsync.com</p>
                          <small>Response within 24 hours</small>
                        </div>
                      </div>

                      <div className={styles.contactOption}>
                        <div className={styles.contactIcon}>💬</div>
                        <div>
                          <h4>Live Chat</h4>
                          <p>Available Mon-Fri 9AM-6PM PST</p>
                          <Button variant="primary" size="small">Start Chat</Button>
                        </div>
                      </div>

                      <div className={styles.contactOption}>
                        <div className={styles.contactIcon}>📞</div>
                        <div>
                          <h4>Premium Support</h4>
                          <p>Priority support for Premium users</p>
                          <small>Response within 4 hours</small>
                        </div>
                      </div>
                    </div>

                    <form className={styles.contactForm} onSubmit={handleContactSubmit}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Subject</label>
                          <input
                            type="text"
                            name="subject"
                            value={contactForm.subject}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Priority</label>
                          <select
                            name="priority"
                            value={contactForm.priority}
                            onChange={handleInputChange}
                            className={styles.formSelect}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Message</label>
                        <textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleInputChange}
                          className={styles.formTextarea}
                          rows="6"
                          placeholder="Please describe your issue or question in detail..."
                          required
                        />
                      </div>

                      <Button type="submit" variant="primary" size="large">
                        Send Message
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "resources" && (
                <div className={styles.resourcesSection}>
                  <h2 className={styles.contentTitle}>Resources & Documentation</h2>
                  <p className={styles.contentSubtitle}>
                    Comprehensive guides and resources to help you succeed
                  </p>

                  <div className={styles.resourcesGrid}>
                    <div className={styles.resourceCategory}>
                      <h3 className={styles.resourceCategoryTitle}>📚 Documentation</h3>
                      <ul className={styles.resourceList}>
                        <li><a href="#" className={styles.resourceLink}>Getting Started Guide</a></li>
                        <li><a href="#" className={styles.resourceLink}>API Documentation</a></li>
                        <li><a href="#" className={styles.resourceLink}>Integration Guides</a></li>
                        <li><a href="#" className={styles.resourceLink}>Best Practices</a></li>
                      </ul>
                    </div>

                    <div className={styles.resourceCategory}>
                      <h3 className={styles.resourceCategoryTitle}>🎥 Video Tutorials</h3>
                      <ul className={styles.resourceList}>
                        <li><a href="#" className={styles.resourceLink}>Creating Your First Event</a></li>
                        <li><a href="#" className={styles.resourceLink}>Customizing RSVP Pages</a></li>
                        <li><a href="#" className={styles.resourceLink}>Managing Guest Communications</a></li>
                        <li><a href="#" className={styles.resourceLink}>Analytics Deep Dive</a></li>
                      </ul>
                    </div>

                    <div className={styles.resourceCategory}>
                      <h3 className={styles.resourceCategoryTitle}>📄 Templates</h3>
                      <ul className={styles.resourceList}>
                        <li><a href="#" className={styles.resourceLink}>Wedding Invitation Templates</a></li>
                        <li><a href="#" className={styles.resourceLink}>Corporate Event Templates</a></li>
                        <li><a href="#" className={styles.resourceLink}>Reminder Email Templates</a></li>
                        <li><a href="#" className={styles.resourceLink}>RSVP Page Designs</a></li>
                      </ul>
                    </div>

                    <div className={styles.resourceCategory}>
                      <h3 className={styles.resourceCategoryTitle}>🛠️ Tools</h3>
                      <ul className={styles.resourceList}>
                        <li><a href="#" className={styles.resourceLink}>Guest List Import Tool</a></li>
                        <li><a href="#" className={styles.resourceLink}>Email Preview Tool</a></li>
                        <li><a href="#" className={styles.resourceLink}>RSVP Analytics Calculator</a></li>
                        <li><a href="#" className={styles.resourceLink}>Event Timeline Planner</a></li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.downloadSection}>
                    <h3 className={styles.downloadTitle}>📥 Download Resources</h3>
                    <div className={styles.downloadGrid}>
                      <div className={styles.downloadCard}>
                        <h4>Event Planning Checklist</h4>
                        <p>Complete checklist for organizing successful events</p>
                        <Button variant="outline" size="small">Download PDF</Button>
                      </div>
                      <div className={styles.downloadCard}>
                        <h4>RSVP Etiquette Guide</h4>
                        <p>Best practices for guest communication</p>
                        <Button variant="outline" size="small">Download PDF</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Support;