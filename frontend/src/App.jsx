import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [result, setResult] = useState("Loading...");

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    fetch(`${baseUrl}/health`)
      .then((res) => res.json())
      .then((data) => setResult(JSON.stringify(data)))
      .catch((err) => setResult(`Error: ${err.message}`));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>AudioFile</h1>
      <p>Backend /health response:</p>
      <pre>{result}</pre>
    </div>
  );
}

