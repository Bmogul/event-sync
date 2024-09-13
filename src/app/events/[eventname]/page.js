"use client"
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EventPage({ eventData }) {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log(params)
        const response = await fetch(`/api/events/${params.eventname}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        //router.push('/404'); // Redirect to 404 page if event doesn't exist
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [params.eventname, router]);

  if (loading) {
    return <div>Loading...</div>;
  }


  return (
    <div>
      <h1>Welcome to {params.eventname}</h1>
      {eventData ? (
        <div>
          {/* Display your event data here */}
          <pre>{JSON.stringify(eventData, null, 2)}</pre>
        </div>
      ) : (
        <div>No data available for this event.</div>
      )}
    </div>
  );
}
