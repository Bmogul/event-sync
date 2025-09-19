"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Support = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to coming soon page
    router.push('/support-coming-soon');
  }, [router]);

  // Return null since we're redirecting
  return null;
};

export default Support;