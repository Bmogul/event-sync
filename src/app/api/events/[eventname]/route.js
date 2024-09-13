export async function GET(request, { params }) {
  const { eventname } = params;

  // Here, you would typically fetch the event data from your database
  // This is just a mock implementation
  const eventlist = {
    myevent: { name: "myevent", date: "2024-09-15" },
    // Add more events as needed
  };

  if (eventlist[eventname]) {
    return new Response(JSON.stringify(eventlist[eventname]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
