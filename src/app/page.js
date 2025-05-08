"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();

  const CreateEvent = async () => {
    try {
      // Attempt to navigate to the page
      router.push("/eventcreate");
    } catch (error) {
      console.error('Navigation error:', error);
      // If navigation fails, redirect to 404 page
      router.push('/404');
    }
  }

  const LearnMore = async () => {
    try {
      // Attempt to navigate to the page
      router.push("/about");
    } catch (error) {
      console.error('Navigation error:', error);
      // If navigation fails, redirect to 404 page
      router.push('/404');
    }
  }

  return (
    <div className={styles.page}>
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
  );
}
