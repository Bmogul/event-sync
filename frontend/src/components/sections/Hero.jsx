"use client";
import styles from "./Hero.module.css";

import { useEffect, useRef } from "react";

import Container from "../layout/Container";
import Button from "../ui/Button";

const Hero = () => {
  const visualRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (visualRef.current) {
        const scrolled = window.pageYOffset;
        visualRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <h1>
              Manage <span className={styles.highlight}>multi-day</span> event
              RSVPs with <span className={styles.highlight}>ease</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Simple RSVP and guest management for weddings, reunions, and
              celebrations
            </p>
            <p className={styles.heroDescription}>
              From weekend weddings to family gatherings, Event-Sync helps
              you organize multiple events, track guest attendance, and handle
              RSVPs effortlessly.
            </p>

            <div className={styles.heroActions}>
              <Button variant="primary" size="large">
                Create Your Event
              </Button>
              <Button variant="secondary" size="large">
                See How It Works
              </Button>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>12</span>
                <span className={styles.heroStatLabel}>Beta Events</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>400+</span>
                <span className={styles.heroStatLabel}>RSVPs Managed</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>One-Time</span>
                <span className={styles.heroStatLabel}>Payment Per Event</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual} ref={visualRef}>
            <div className={styles.heroVisualContent}>
              <div className={styles.heroVisualIcon}>📅</div>
              <div className={styles.mockDashboard}>
                <h3>Your Event Dashboard</h3>
                <p>Track RSVPs across multiple days and sub-events</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
