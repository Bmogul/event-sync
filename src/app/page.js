
"use client";
import Image from "next/image";
import styles from "./page.module.css";
import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation";

export default function Home() {

  const searchParams = useSearchParams();
  const guid = searchParams.get("guid");
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const fetchData = async (guid) => {
      try {
        const response = await fetch(`/api/sheets?guid=${guid}`);
        const data = await response.json();
        setUserData(data)
        console.log(data)
        // Process the data as needed
      } catch (error) {
        console.error("Error fetching data:", error);
        setUserData(error)
      }
    };
    fetchData(guid);
  }, [guid]);


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
      </main>
    </div>
  );
}
