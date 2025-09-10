"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./EmailBestTips.module.css";

const EmailBestTips = () => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [checkedTips, setCheckedTips] = useState([]);

  const toggleTipCheck = (categoryIndex, tipIndex) => {
    const tipId = `${categoryIndex}-${tipIndex}`;
    if (checkedTips.includes(tipId)) {
      setCheckedTips(checkedTips.filter(id => id !== tipId));
    } else {
      setCheckedTips([...checkedTips, tipId]);
    }
  };

  const emailCategories = [
    {
      title: "Writing Effective Invitations",
      icon: "✉️",
      description: "Craft compelling invitation emails that get opened and responded to",
      tips: [
        {
          title: "Subject Line Mastery",
          description: "Your subject line determines if your email gets opened",
          points: [
            "Include the event name and date: 'Sarah & John's Wedding - June 15th'",
            "Add urgency when appropriate: 'RSVP by May 1st'",
            "Keep it under 50 characters for mobile optimization",
            "Avoid spam trigger words like 'FREE' or 'URGENT'",
            "Personalize when possible: 'You're Invited to Our Wedding!'"
          ],
          examples: [
            "✅ Good: 'You're Invited: Smith Family Reunion - July 4th Weekend'",
            "❌ Poor: 'Party Time!!!'",
            "✅ Good: 'Save the Date: Corporate Annual Gala - March 20th'",
            "❌ Poor: 'FREE FOOD AND DRINKS - MUST ATTEND!!!'"
          ]
        },
        {
          title: "Opening Lines That Hook",
          description: "Start strong to capture attention immediately",
          points: [
            "Lead with excitement: 'We're thrilled to invite you to...'",
            "Reference your relationship: 'As one of our closest friends...'",
            "Create anticipation: 'Mark your calendars for an unforgettable evening...'",
            "Be direct and clear about the event purpose",
            "Include a personal touch when writing to close friends/family"
          ],
          examples: [
            "✅ 'We're excited to celebrate our love with the people who matter most to us!'",
            "✅ 'Your presence would make our special day complete.'",
            "✅ 'Join us for an evening of great food, music, and celebration!'"
          ]
        },
        {
          title: "Essential Information Structure",
          description: "Organize details in a logical, easy-to-scan format",
          points: [
            "Use bullet points or numbered lists for key details",
            "Include: What, When, Where, Dress Code, RSVP deadline",
            "Put the most important information first",
            "Use bold or formatting to highlight crucial details",
            "Add a clear call-to-action button"
          ],
          template: `
**What:** Sarah & John's Wedding Ceremony & Reception
**When:** Saturday, June 15th, 2024 at 4:00 PM
**Where:** Riverside Gardens, 123 Oak Street, Springfield
**Dress Code:** Cocktail attire (no red please!)
**RSVP:** Please respond by May 1st

[RSVP NOW Button]`
        }
      ]
    },
    {
      title: "Follow-Up & Reminders",
      icon: "🔔",
      description: "Keep guests informed and engaged throughout the planning process",
      tips: [
        {
          title: "Timing Your Reminders",
          description: "Send reminders at optimal intervals for maximum response",
          points: [
            "First reminder: 2-3 weeks after initial invitation",
            "Second reminder: 1 week before RSVP deadline",
            "Final reminder: 2-3 days before RSVP deadline",
            "Confirmation reminder: 1 week before the event",
            "Last-minute updates: 24-48 hours before event"
          ],
          schedule: [
            "Initial Invitation: 6-8 weeks before event",
            "First Reminder: 4-5 weeks before event",
            "RSVP Deadline Reminder: 1 week before deadline",
            "Final RSVP Push: 2-3 days before deadline",
            "Event Confirmation: 1 week before event",
            "Last-Minute Details: 24-48 hours before"
          ]
        },
        {
          title: "Reminder Email Best Practices",
          description: "Make reminders helpful, not annoying",
          points: [
            "Reference the original invitation: 'Following up on our wedding invitation...'",
            "Be polite but direct about the deadline",
            "Include all essential details again (people lose emails)",
            "Offer multiple ways to respond (email, phone, RSVP link)",
            "Express understanding: 'We know you're busy, but...'"
          ],
          examples: [
            "✅ 'Just a friendly reminder that we'd love to hear from you!'",
            "✅ 'We're finalizing details and need to hear from you by Friday.'",
            "❌ 'You haven't responded yet. Please RSVP ASAP!!!'"
          ]
        },
        {
          title: "Handling Non-Responders",
          description: "Strategies for getting responses from silent guests",
          points: [
            "Personalize the message with specific details about your relationship",
            "Pick up the phone for VIP guests (close family, wedding party)",
            "Send a shorter, more casual follow-up email",
            "Ask mutual friends to help reach out",
            "Set a hard deadline and explain the consequences (catering numbers, etc.)"
          ],
          templates: [
            "Personal approach: 'Hi [Name], I know you're busy, but I wanted to personally reach out...'",
            "Casual approach: 'Hey! Just checking - are you able to make it to [event]?'",
            "Final approach: 'We need to give final numbers to our caterer by [date]. Can you let us know?'"
          ]
        }
      ]
    },
    {
      title: "Email Design & Formatting",
      icon: "🎨",
      description: "Create visually appealing emails that reflect your event style",
      tips: [
        {
          title: "Mobile-First Design",
          description: "Over 60% of emails are opened on mobile devices",
          points: [
            "Use a single-column layout for easy mobile viewing",
            "Keep line length under 600px width",
            "Use large, finger-friendly buttons (minimum 44px height)",
            "Choose readable fonts (Arial, Helvetica, or system fonts)",
            "Test on multiple devices before sending"
          ],
          mobileChecklist: [
            "✓ Single column layout",
            "✓ Large, tappable buttons",
            "✓ Readable font size (16px minimum)",
            "✓ Adequate spacing between elements",
            "✓ Images load quickly and scale properly"
          ]
        },
        {
          title: "Color Psychology & Branding",
          description: "Use colors to create the right mood and reinforce your event theme",
          points: [
            "Match your email colors to your event theme",
            "Use high contrast for text readability",
            "Limit your color palette to 2-3 colors maximum",
            "Consider the emotional impact of colors",
            "Ensure accessibility for colorblind readers"
          ],
          colorGuide: [
            "Wedding: Soft pastels, gold accents, romantic tones",
            "Corporate: Navy, gray, professional blues",
            "Birthday: Bright, cheerful colors matching the party theme",
            "Holiday: Traditional seasonal colors",
            "Celebration: Warm, inviting colors that convey joy"
          ]
        },
        {
          title: "Image Best Practices",
          description: "Use images effectively to enhance your message",
          points: [
            "Optimize images for fast loading (under 1MB each)",
            "Use high-quality photos that represent your event well",
            "Include alt text for accessibility",
            "Don't rely solely on images to convey important information",
            "Test how images display across different email clients"
          ],
          imageTypes: [
            "Hero image: Beautiful photo representing your event",
            "Venue photos: Help guests visualize the location",
            "Couple/host photos: Add personal connection",
            "Logo/branding: Maintain consistent visual identity",
            "Decorative elements: Borders, dividers, icons"
          ]
        }
      ]
    },
    {
      title: "Personalization & Segmentation",
      icon: "👥",
      description: "Tailor your messages for different guest groups and relationships",
      tips: [
        {
          title: "Guest List Segmentation",
          description: "Group guests for more targeted messaging",
          points: [
            "Family vs. friends vs. colleagues - different tone for each",
            "Local vs. out-of-town guests - include travel info for distant guests",
            "Plus-one status - clear messaging about who's invited",
            "Age groups - adjust tone and communication style",
            "VIP guests - wedding party, immediate family, special friends"
          ],
          segments: [
            "Immediate Family: Most personal, detailed information",
            "Extended Family: Warm but formal, family traditions",
            "Close Friends: Casual tone, inside jokes okay",
            "Work Colleagues: Professional but friendly",
            "Out-of-town Guests: Include travel and accommodation info",
            "Wedding Party: Separate emails with special instructions"
          ]
        },
        {
          title: "Dynamic Personalization",
          description: "Use merge fields and personal details effectively",
          points: [
            "Always use the guest's preferred name (not just 'Dear Guest')",
            "Reference shared memories or experiences when appropriate",
            "Acknowledge their role if they're in the wedding party",
            "Include specific details about their invitation (plus-one status)",
            "Mention dietary restrictions or special accommodations"
          ],
          examples: [
            "✅ 'Dear Sarah and Mike, we can't wait to celebrate with you both!'",
            "✅ 'Hi Mom and Dad, your support means everything to us...'",
            "✅ 'Dear members of the wedding party, here are your special instructions...'",
            "❌ 'Dear valued guest, you are cordially invited...'"
          ]
        },
        {
          title: "Cultural Considerations",
          description: "Be mindful of cultural and religious sensitivities",
          points: [
            "Research cultural norms for your guest list",
            "Consider religious dietary restrictions and holidays",
            "Be inclusive in language and imagery choices",
            "Provide context for unfamiliar traditions",
            "Offer alternatives when cultural conflicts might arise"
          ],
          considerations: [
            "Religious holidays: Check calendar conflicts",
            "Dietary needs: Clearly communicate food options",
            "Dress codes: Explain cultural significance",
            "Gift giving: Mention registry or preferences",
            "Language: Provide translations if needed",
            "Traditions: Explain any unique customs or ceremonies"
          ]
        }
      ]
    },
    {
      title: "Deliverability & Technical Tips",
      icon: "📧",
      description: "Ensure your emails reach inboxes and avoid spam filters",
      tips: [
        {
          title: "Avoiding Spam Filters",
          description: "Technical and content strategies to improve deliverability",
          points: [
            "Avoid excessive capitalization and exclamation points",
            "Don't use too many images or large file attachments",
            "Include a proper from name and reply-to address",
            "Use a reputable email service provider",
            "Always include an unsubscribe option (even for personal events)"
          ],
          spamTriggers: [
            "❌ ALL CAPS SUBJECT LINES!!!",
            "❌ Too many exclamation points!!!!!!",
            "❌ Words like 'FREE', 'WIN', 'URGENT'",
            "❌ Excessive use of dollar signs $$$",
            "❌ Too many links in one email",
            "❌ No text content (image-only emails)"
          ]
        },
        {
          title: "Testing Before Sending",
          description: "Quality assurance steps for professional results",
          points: [
            "Send test emails to yourself first",
            "Check rendering in multiple email clients (Gmail, Outlook, Apple Mail)",
            "Test on both desktop and mobile devices",
            "Verify all links work correctly",
            "Proofread carefully for spelling and grammar errors"
          ],
          testingChecklist: [
            "✓ Subject line appears correctly",
            "✓ Preheader text is optimized",
            "✓ Images load properly",
            "✓ All links work and go to correct destinations",
            "✓ Text is readable on mobile devices",
            "✓ Contact information is accurate",
            "✓ RSVP process works smoothly",
            "✓ Unsubscribe link functions (if applicable)"
          ]
        },
        {
          title: "Analytics & Tracking",
          description: "Monitor your email performance and improve over time",
          points: [
            "Track open rates to measure subject line effectiveness",
            "Monitor click-through rates on RSVP links",
            "Note which emails generate the most responses",
            "Keep records of what worked for future events",
            "Ask for feedback from guests about communication preferences"
          ],
          metrics: [
            "Open Rate: Aim for 20-30% for event emails",
            "Click Rate: 5-10% is typical for event invitations",
            "Response Rate: Track RSVP completion rates",
            "Unsubscribe Rate: Should be minimal for personal events",
            "Time to Response: Note when guests typically respond"
          ]
        }
      ]
    }
  ];

  const quickTips = [
    "Always send test emails to yourself first",
    "Keep subject lines under 50 characters",
    "Include all essential details in every email",
    "Use 'Reply-to' addresses people recognize",
    "Send invitations 6-8 weeks before events",
    "Follow up with non-responders personally",
    "Make RSVP buttons large and obvious",
    "Proofread everything twice before sending"
  ];

  return (
    <>
      <Header />
      <main className={styles.emailTipsPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <Container>
            <div className={styles.heroContent}>
              <div className={styles.breadcrumb}>
                <span onClick={() => router.push('/support')} className={styles.breadcrumbLink}>
                  Support
                </span>
                <span className={styles.breadcrumbSeparator}>→</span>
                <span>Email Best Practices</span>
              </div>
              
              <h1 className={styles.heroTitle}>
                Email Best <span className={styles.highlight}>Practices</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Master the art of event communication with proven email strategies that get results
              </p>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>5</span>
                  <span className={styles.statLabel}>Key Categories</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>40+</span>
                  <span className={styles.statLabel}>Expert Tips</span>
                </div>
                <div className={styles.heroStat}>
                  <span className={styles.statNumber}>3x</span>
                  <span className={styles.statLabel}>Better Response</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Quick Tips Section */}
        <section className={styles.quickTips}>
          <Container>
            <div className={styles.quickTipsContent}>
              <h2 className={styles.sectionTitle}>Quick Reference Tips</h2>
              <p className={styles.sectionSubtitle}>
                Essential email tips you can implement immediately
              </p>
              
              <div className={styles.tipsGrid}>
                {quickTips.map((tip, index) => (
                  <div 
                    key={index} 
                    className={`${styles.tipCard} ${checkedTips.includes(`quick-${index}`) ? styles.checked : ''}`}
                    onClick={() => toggleTipCheck('quick', index)}
                  >
                    <div className={styles.tipIcon}>
                      {checkedTips.includes(`quick-${index}`) ? '✓' : '💡'}
                    </div>
                    <p className={styles.tipText}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Detailed Categories */}
        <section className={styles.detailedGuide}>
          <Container>
            <h2 className={styles.sectionTitle}>Complete Email Guide</h2>
            <p className={styles.sectionSubtitle}>
              Deep dive into each aspect of effective event email communication
            </p>

            <div className={styles.guideContainer}>
              {/* Category Navigation */}
              <div className={styles.categoryNavigation}>
                <h3 className={styles.navTitle}>Categories</h3>
                {emailCategories.map((category, index) => (
                  <button
                    key={index}
                    className={`${styles.categoryNavItem} ${activeCategory === index ? styles.active : ''}`}
                    onClick={() => setActiveCategory(index)}
                  >
                    <span className={styles.categoryIcon}>{category.icon}</span>
                    <span className={styles.categoryNavTitle}>{category.title}</span>
                  </button>
                ))}
              </div>

              {/* Category Content */}
              <div className={styles.categoryContent}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryMeta}>
                    <span className={styles.categoryIcon}>{emailCategories[activeCategory].icon}</span>
                    <span className={styles.categoryNumber}>Category {activeCategory + 1}</span>
                  </div>
                  <h3 className={styles.categoryTitle}>{emailCategories[activeCategory].title}</h3>
                  <p className={styles.categoryDescription}>{emailCategories[activeCategory].description}</p>
                </div>

                <div className={styles.categoryBody}>
                  {emailCategories[activeCategory].tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className={styles.tipSection}>
                      <h4 className={styles.tipTitle}>{tip.title}</h4>
                      <p className={styles.tipDescription}>{tip.description}</p>
                      
                      <div className={styles.tipContent}>
                        <div className={styles.tipPoints}>
                          <h5 className={styles.subheading}>Key Points</h5>
                          <ul className={styles.pointsList}>
                            {tip.points.map((point, pointIndex) => (
                              <li key={pointIndex} className={styles.pointItem}>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {tip.examples && (
                          <div className={styles.tipExamples}>
                            <h5 className={styles.subheading}>Examples</h5>
                            <div className={styles.examplesList}>
                              {tip.examples.map((example, exampleIndex) => (
                                <div key={exampleIndex} className={styles.example}>
                                  {example}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tip.template && (
                          <div className={styles.tipTemplate}>
                            <h5 className={styles.subheading}>Template</h5>
                            <pre className={styles.templateCode}>{tip.template}</pre>
                          </div>
                        )}

                        {tip.schedule && (
                          <div className={styles.tipSchedule}>
                            <h5 className={styles.subheading}>Recommended Schedule</h5>
                            <ul className={styles.scheduleList}>
                              {tip.schedule.map((item, itemIndex) => (
                                <li key={itemIndex} className={styles.scheduleItem}>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(tip.mobileChecklist || tip.colorGuide || tip.imageTypes || tip.segments || tip.considerations || tip.spamTriggers || tip.testingChecklist || tip.metrics) && (
                          <div className={styles.tipExtras}>
                            {tip.mobileChecklist && (
                              <>
                                <h5 className={styles.subheading}>Mobile Checklist</h5>
                                <ul className={styles.checklistList}>
                                  {tip.mobileChecklist.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.checklistItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.colorGuide && (
                              <>
                                <h5 className={styles.subheading}>Color Guide by Event Type</h5>
                                <ul className={styles.guideList}>
                                  {tip.colorGuide.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.guideItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.imageTypes && (
                              <>
                                <h5 className={styles.subheading}>Image Types to Consider</h5>
                                <ul className={styles.imageList}>
                                  {tip.imageTypes.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.imageItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.segments && (
                              <>
                                <h5 className={styles.subheading}>Guest Segments</h5>
                                <ul className={styles.segmentsList}>
                                  {tip.segments.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.segmentItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.considerations && (
                              <>
                                <h5 className={styles.subheading}>Cultural Considerations</h5>
                                <ul className={styles.considerationsList}>
                                  {tip.considerations.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.considerationItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.spamTriggers && (
                              <>
                                <h5 className={styles.subheading}>Avoid These Spam Triggers</h5>
                                <ul className={styles.spamList}>
                                  {tip.spamTriggers.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.spamItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.testingChecklist && (
                              <>
                                <h5 className={styles.subheading}>Pre-Send Testing Checklist</h5>
                                <ul className={styles.testingList}>
                                  {tip.testingChecklist.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.testingItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {tip.metrics && (
                              <>
                                <h5 className={styles.subheading}>Key Metrics to Track</h5>
                                <ul className={styles.metricsList}>
                                  {tip.metrics.map((item, itemIndex) => (
                                    <li key={itemIndex} className={styles.metricItem}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.categoryNavigation}>
                  {activeCategory > 0 && (
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveCategory(activeCategory - 1)}
                    >
                      ← Previous Category
                    </Button>
                  )}
                  {activeCategory < emailCategories.length - 1 && (
                    <Button 
                      variant="primary" 
                      onClick={() => setActiveCategory(activeCategory + 1)}
                    >
                      Next Category →
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
              <h2 className={styles.helpTitle}>Need More Email Help?</h2>
              <p className={styles.helpDescription}>
                Our support team can provide personalized advice for your specific event needs
              </p>
              
              <div className={styles.helpOptions}>
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>📧</div>
                  <h3>Email Templates</h3>
                  <p>Pre-written templates for common event types</p>
                  <Button variant="outline" size="small">Browse Templates</Button>
                </div>
                
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>🎯</div>
                  <h3>Personalized Review</h3>
                  <p>Get feedback on your invitation drafts</p>
                  <Button variant="outline" size="small">Request Review</Button>
                </div>
                
                <div className={styles.helpOption}>
                  <div className={styles.helpIcon}>💬</div>
                  <h3>Live Support</h3>
                  <p>Chat with our communication experts</p>
                  <Button variant="outline" size="small" onClick={() => router.push('/support')}>
                    Contact Support
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

export default EmailBestTips;