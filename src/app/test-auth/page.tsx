"use client";
export default function TestAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    <div style={{padding:40,fontFamily:"monospace",color:"white",background:"#111"}}>
      <h1>Auth Test</h1>
      <p>NEXT_PUBLIC_SUPABASE_URL: {url ? "SET" : "MISSING"}</p>
      <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {key ? "SET" : "MISSING"}</p>
    </div>
  );
}
