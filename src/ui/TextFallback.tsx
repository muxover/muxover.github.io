import { ABOUT_COPY, CONTACT, IDENTITY, STACK } from "../content";
import { useStore } from "../store";
import { RepoRow } from "./Panel";

export function TextFallback() {
  const repos = useStore((s) => s.repos);
  const profile = useStore((s) => s.profile);
  const status = useStore((s) => s.dataStatus);
  const setTextMode = useStore((s) => s.setTextMode);

  return (
    <div className="textmode">
      <div className="textmode-inner">
        <header>
          <h1>
            {IDENTITY.name} <span className="dim">// {IDENTITY.handle}</span>
          </h1>
          <p className="dim">{IDENTITY.vibe}</p>
          <button className="hud-skip" onClick={() => setTextMode(false)}>
            back to the street
          </button>
        </header>

        <section>
          <h2>:: ABOUT</h2>
          {ABOUT_COPY.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>

        <section>
          <h2>:: PROJECTS</h2>
          {status === "lost" ? (
            <p>
              signal lost — see{" "}
              <a href="https://github.com/muxover" target="_blank" rel="noreferrer">
                github.com/muxover
              </a>
            </p>
          ) : repos.length === 0 ? (
            <p className="dim">loading live from github...</p>
          ) : (
            <div className="repo-list">
              {repos.map((r) => (
                <RepoRow key={r.name} repo={r} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2>:: STACK</h2>
          <ul className="stack-list">
            {STACK.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {profile && (
          <section>
            <h2>:: SIGNAL</h2>
            <p>
              {profile.public_repos} public repos · {profile.followers} followers · on github since{" "}
              {new Date(profile.created_at).getFullYear()}
            </p>
          </section>
        )}

        <section>
          <h2>:: CONTACT</h2>
          <ul className="contact-list">
            {CONTACT.map((c) => (
              <li key={c.label}>
                <span className="dim">{c.label}</span>{" "}
                <a href={c.href} target="_blank" rel="noreferrer">
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
