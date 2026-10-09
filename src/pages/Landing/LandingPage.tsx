import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2, Filter, Kanban, Sparkles } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { signInAsGuest } from "../../lib/auth/guestDemo";

import "./landing.css";

const GITHUB_REPO_URL = "https://github.com/luidji95/Job-Application-Tracker";

// sample cards for the board preview in the hero
const PREVIEW_COLUMNS = [
  {
    title: "Applied",
    color: "#9aa3b8",
    cards: [
      { company: "Northwind Labs", role: "Frontend Developer", meta: "Remote · 3 days ago" },
      { company: "Mapleworks", role: "React Developer", meta: "Novi Sad · 5 days ago" },
      { company: "Vela Studio", role: "UI Engineer", meta: "Remote · 1 week ago" },
    ],
  },
  {
    title: "HR interview",
    color: "#8c97ff",
    cards: [
      { company: "Kite Systems", role: "Junior Frontend", meta: "Belgrade · call Tue" },
      { company: "Orbit Pay", role: "Web Developer", meta: "Hybrid · call Thu" },
    ],
  },
  {
    title: "Technical",
    color: "#c4a1ff",
    cards: [{ company: "Halden", role: "Frontend Developer", meta: "Remote · task due Fri" }],
  },
  {
    title: "Offer",
    color: "#4fd3a3",
    cards: [{ company: "Brightloop", role: "React Developer", meta: "Belgrade · reply by Mon" }],
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleTryDemo = async () => {
    setDemoError(null);
    setDemoLoading(true);

    try {
      await signInAsGuest();
      navigate("/dashboard");
    } catch (err: unknown) {
      setDemoError(
        err instanceof Error
          ? `The demo could not start: ${err.message}`
          : "The demo could not start. Try again in a moment."
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing__inner">
        <header className="landing-nav">
          <Link to="/" className="landing-brand">
            <Logo />
            JobFlowTracker
          </Link>

          <nav className="landing-nav__links" aria-label="Main">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              Open source
            </a>
            <Link to="/login">Log in</Link>
            <Button variant="secondary" size="md" onClick={handleTryDemo} disabled={demoLoading}>
              Try the demo
            </Button>
          </nav>
        </header>

        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">Free and open source</p>
            <h1>Know where every application stands.</h1>
            <p className="hero__lead">
              One board for your whole job search: every application, the stage it is in, and what
              to prepare for next.
            </p>

            <div className="hero__actions">
              <Button size="lg" onClick={handleTryDemo} isLoading={demoLoading}>
                Try the demo, no sign-up
              </Button>
              <Link to="/register" className="btn btn--secondary btn--lg">
                Create a free account
              </Link>
            </div>

            {demoError ? (
              <p className="form-error" role="alert">
                {demoError}
              </p>
            ) : (
              <p className="hero__note">
                The demo opens a board with sample applications. Nothing to install.
              </p>
            )}
          </div>

          <div className="preview" aria-hidden="true">
            <div className="preview__bar">
              <span>My job search</span>
              <span>7 applications</span>
            </div>
            <div className="preview__cols">
              {PREVIEW_COLUMNS.map((col) => (
                <div className="preview__col" key={col.title}>
                  <div className="preview__col-title">
                    <span className="dot" style={{ background: col.color }} />
                    {col.title}
                  </div>
                  {col.cards.map((card) => (
                    <div className="preview__card" key={card.company}>
                      <strong>{card.company}</strong>
                      <span>{card.role}</span>
                      <small>{card.meta}</small>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <h2 className="section__title">
            A spreadsheet stops working after the tenth application. This doesn't.
          </h2>

          <div className="features">
            <article className="feature">
              <Kanban size={32} strokeWidth={1.7} aria-hidden="true" />
              <h3>Six stages, one board</h3>
              <p>
                Applied, HR interview, Technical, Final, Offer, Rejected. Move a card when
                something happens. A rejected application remembers the stage it came from, so you
                can restore it.
              </p>
            </article>

            <article className="feature">
              <Sparkles size={32} strokeWidth={1.7} aria-hidden="true" />
              <h3>A short brief for every job ad</h3>
              <p>
                Paste the job description. You get the key requirements and what to prepare for,
                saved in the notes of that application.
              </p>
            </article>

            <article className="feature">
              <Filter size={32} strokeWidth={1.7} aria-hidden="true" />
              <h3>See where you drop off</h3>
              <p>
                Pass rates for screening, HR and technical rounds, your offer conversion, and the
                stage where you get rejected most often.
              </p>
            </article>
          </div>
        </section>

        <section className="ai-demo">
          <div className="ai-demo__copy">
            <p className="eyebrow">AI insight</p>
            <h2>Read the ad once. Keep the brief.</h2>
            <p>
              Job ads are long and most of the text is the same everywhere. The summary keeps what
              is specific to this role, so you know what to revise before the call.
            </p>
          </div>

          <div className="ai-demo__example">
            <div className="ai-demo__in">
              <span className="ai-demo__label">Job description (example)</span>
              <p>
                We are looking for a Frontend Developer to join our product team. You will build
                features in React and TypeScript, work closely with designers, write tests and take
                part in code reviews. Experience with REST APIs and state management is expected…
              </p>
            </div>
            <div className="ai-demo__out">
              <span className="ai-demo__label">What to focus on</span>
              <ul>
                <li>React and TypeScript are the core. Expect a live task.</li>
                <li>Be ready to talk about testing and code review habits.</li>
                <li>Prepare one example of working with a designer.</li>
                <li>Revise state management and calling REST APIs.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <h2 className="section__title">How it works</h2>

          <ol className="steps">
            <li>
              <span className="steps__n">Step 1</span>
              <h3>Add an application</h3>
              <p>
                Company, position, location, salary and tags. It takes less time than a row in a
                spreadsheet.
              </p>
            </li>
            <li>
              <span className="steps__n">Step 2</span>
              <h3>Move it as things happen</h3>
              <p>
                A reply, an interview, an offer. Add notes after each call while you still remember
                them.
              </p>
            </li>
            <li>
              <span className="steps__n">Step 3</span>
              <h3>Check your numbers</h3>
              <p>
                After a few weeks the statistics show which round stops you, and that is where to
                put the practice.
              </p>
            </li>
          </ol>
        </section>

        <section className="oss">
          <div>
            <h3>Open source, built in public</h3>
            <p>
              React, TypeScript and Supabase. Your applications are tied to your account and nobody
              else can read them.
            </p>
          </div>
          <a
            className="btn btn--secondary btn--md"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Code2 size={18} aria-hidden="true" />
            View the code on GitHub
          </a>
        </section>

        <section className="cta">
          <h2>Your next application deserves a better place than a spreadsheet.</h2>
          <div className="cta__actions">
            <button
              type="button"
              className="btn btn--lg cta__primary"
              onClick={handleTryDemo}
              disabled={demoLoading}
            >
              Try the demo
            </button>
            <Link to="/register" className="btn btn--lg cta__secondary">
              Create a free account
            </Link>
          </div>
        </section>

        <footer className="landing-footer">
          <span>JobFlowTracker · built by Miloš Petrović</span>
          <span className="landing-footer__links">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link to="/login">Log in</Link>
          </span>
        </footer>
      </div>
    </div>
  );
};
