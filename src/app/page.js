
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
    <div>
      Welcome to event-sync
      <div>
        {userData ? (
          <>Data found</>
        ) : (<>No data</>)}
      </div>
    </div>
  );
}
