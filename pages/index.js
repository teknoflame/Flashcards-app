import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Hydrate legacy client app by moving existing DOM into Next root if present
    // If app.js exists in public, it will run and mount to window.app. Keep compatibility.
  }, [])

  return (
    <div>
      <h1>StudyFlow (Next.js)</h1>
      <p>The legacy app UI is preserved. Open /app to use the client SPA or use the React components later.</p>
      <a href="/app">Open app</a>
    </div>
  )
}
