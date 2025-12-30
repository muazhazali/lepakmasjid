export async function onRequest(context: any) {
  const apiUrl = "https://sedekahjeapi.netlify.app/api/masjid";
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
