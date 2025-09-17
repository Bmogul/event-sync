"use client";

import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/layout/Footer";

export default function Home() {

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

/*
 *  <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Image className={styles.responsiveLogo} src={"/logo.svg"} alt="Event-Sync" fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          </div>
          <div className={styles.tagLineContainer}>
            <label>Sync up the perfect event</label>
          </div>
        </div>
        <div className={styles.btnBox}>
          <button className={styles.btn} onClick={CreateEvent}>Get Started</button>
          <button className={styles.btn} onClick={LearnMore}>Learn More</button>
        </div>
      </main>
    </div>
*/
