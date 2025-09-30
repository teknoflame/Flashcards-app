import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Spark Deck | Flashcards reinvented</title>
        <meta
          name="description"
          content="Spark Deck helps you study smarter with customizable flashcards and quick review sessions."
        />
      </Head>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="page">
        <header className="hero" role="banner">
          <div className="hero__content">
            <p className="hero__eyebrow" aria-hidden="true">
              Welcome to
            </p>
            <h1 className="hero__heading">Spark Deck</h1>
            <p className="hero__tagline">
              Spark faster recall with smart flashcards, spaced repetition insights, and collaborative decks.
            </p>
          </div>
          <nav className="main-nav" aria-label="Main navigation">
            <ul className="main-nav__list">
              <li className="main-nav__item">
                <Link className="main-nav__link" href="/">
                  Home
                </Link>
              </li>
              <li className="main-nav__item">
                <span
                  className="main-nav__link main-nav__link--disabled"
                  role="link"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  Login (coming soon)
                </span>
              </li>
              <li className="main-nav__item">
                <span
                  className="main-nav__link main-nav__link--disabled"
                  role="link"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  Contact (coming soon)
                </span>
              </li>
            </ul>
          </nav>
        </header>

        <main id="main-content" className="main">
          <section className="section">
            <h2 className="section__heading">Study smarter, not harder</h2>
            <p className="section__body">
              Spark Deck gives you a streamlined way to build subjects, craft card decks, and review in fast, focused
              sessions. Whether you are prepping for exams, certifications, or lifelong learning, Spark Deck keeps your
              study flow organized and engaging.
            </p>
          </section>

          <section className="section" aria-labelledby="features-heading">
            <h2 id="features-heading" className="section__heading">
              What you can do today
            </h2>
            <ul className="feature-list">
              <li className="feature-list__item">Create and organize decks that match your study goals.</li>
              <li className="feature-list__item">Track progress as you move from learning to mastery.</li>
              <li className="feature-list__item">Jump into the legacy experience while we build the next-generation UI.</li>
            </ul>
          </section>

          <section className="section">
            <h2 className="section__heading">Ready to get started?</h2>
            <p className="section__body">
              Explore the existing experience and start practicing in seconds.
            </p>
            <Link className="cta" href="/app">
              Open the study workspace
            </Link>
          </section>
        </main>

        <footer className="footer">
          <p className="footer__copy">&copy; {new Date().getFullYear()} Spark Deck. Crafted for curious minds.</p>
        </footer>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #0f172a;
          background: #f3f4f6;
        }

        .skip-link {
          position: absolute;
          left: -999px;
          top: 8px;
          background: #1d4ed8;
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 0.25rem;
          text-decoration: none;
          z-index: 1000;
        }

        .skip-link:focus {
          left: 1rem;
        }

        .page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #ffffff;
          padding: 3rem 1.5rem 2rem;
        }

        .hero__content {
          max-width: 640px;
          margin: 0 auto;
          text-align: center;
        }

        .hero__eyebrow {
          font-size: 0.9rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0;
        }

        .hero__heading {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          margin: 0.75rem 0 0.5rem;
        }

        .hero__tagline {
          font-size: 1.1rem;
          margin: 0 auto 2rem;
          max-width: 32rem;
        }

        .main-nav {
          margin: 0 auto;
          max-width: 720px;
        }

        .main-nav__list {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
          padding: 0;
          margin: 0;
        }

        .main-nav__item {
          margin: 0;
        }

        .main-nav__link {
          display: inline-block;
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s ease, color 0.2s ease;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .main-nav__link:focus,
        .main-nav__link:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .main-nav__link--disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .main {
          flex: 1;
          padding: 2.5rem 1.5rem;
          max-width: 960px;
          margin: 0 auto;
        }

        .section {
          margin-bottom: 2.5rem;
        }

        .section__heading {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
          color: #0f172a;
        }

        .section__body {
          font-size: 1.05rem;
          line-height: 1.6;
          margin: 0;
          color: #1f2937;
        }

        .feature-list {
          list-style: disc;
          padding-left: 1.5rem;
          color: #1f2937;
          margin: 0;
        }

        .feature-list__item {
          margin-bottom: 0.5rem;
        }

        .cta {
          display: inline-block;
          margin-top: 1.25rem;
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: #ffffff;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .cta:hover,
        .cta:focus {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .footer {
          padding: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          color: #475569;
        }

        @media (max-width: 600px) {
          .main {
            padding: 2rem 1.25rem;
          }

          .hero {
            padding: 2.5rem 1rem 1.75rem;
          }
        }
      `}</style>
    </>
  )
}
