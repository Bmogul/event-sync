import styles from "./Features.module.css";

import Container from "../layout/Container";
import FeatureCard from "../ui/FeatureCard";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";

const featuresData = [
  {
    icon: "🎊",
    title: "Multi-Day Event Management",
    description:
      "Create comprehensive events with multiple sub-events across several days. Perfect for weddings, conferences, or celebrations that span multiple days.",
    benefits: [
      "Unlimited sub-events per main event",
      "Custom schedules and timelines",
      "Individual RSVP tracking per sub-event",
      "Guest availability across all days",
    ],
  },
  {
    icon: "✉️",
    title: "Smart RSVP System",
    description:
      "Beautiful, mobile-friendly RSVP pages that make it easy for guests to respond and select which events they'll attend.",
    benefits: [
      "Custom RSVP forms",
      "Plus-one management",
      "Dietary restrictions and notes",
      "Automatic confirmation emails",
    ],
  },
  {
    icon: "👥",
    title: "Guest List Management",
    description:
      "Keep track of who's coming to what. Organize guests by groups, manage contact information, and see attendance patterns.",
    benefits: [
      "Import guests from spreadsheets",
      "Group organization (family, friends, etc.)",
      "Real-time attendance tracking",
      "Guest communication tools",
    ],
  },
  {
    icon: "💰",
    title: "Simple One-Time Pricing",
    description:
      "No monthly subscriptions or hidden fees. Pay once per event and get access to all features for the lifetime of your event.",
    benefits: [
      "One payment per event",
      "No guest limits",
      "All features included",
      "Lifetime access to your event data",
    ],
  },
];

const Features = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

  return (
    <section className={styles.features} id="features">
      <Container>
        <div
          className={`${styles.sectionHeader} ${headerVisible ? styles.visible : ""}`}
          ref={headerRef}
        >
          <h2>Perfect for multi-day celebrations</h2>
          <p>
            Whether it's a wedding weekend or a business conference, manage
            every detail with our simple yet powerful tools.
          </p>
        </div>

        <div
          className={`${styles.featuresGrid} ${gridVisible ? styles.visible : ""}`}
          ref={gridRef}
        >
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              benefits={feature.benefits}
              className={styles[`fadeIn${index % 2 === 0 ? "Left" : "Right"}`]}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Features;
