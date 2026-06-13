import {
  ABOUT_COPY,
  CLIENTWORK_COPY,
  CONTACT,
  IDENTITY,
  SERVICES,
  SERVICES_CTA,
  STACK,
} from "../content";
import { useStore } from "../store";
import { RepoRow } from "./Panel";

export function TextFallback() {
  const repos = useStore((s) => s.repos);
  const profile = useStore((s) => s.profile);
  const status = useStore((s) => s.dataStatus);
  const touch = useStore((s) => s.touch);
  const setTextMode = useStore((s) => s.setTextMode);

  return (
    <div className="textmode">
      <div className="textmode-inner">
        <header>
          <h1>
            {IDENTITY.name} <span className="dim">// {IDENTITY.handle}</span>
          </h1>
          <p className="dim">{IDENTITY.vibe}</p>
          {/* the 3D street is desktop-only; no point sending phones into it */}
          {!touch && (
            <button className="hud-skip" onClick={() => setTextMode(false)}>
              enter the street
            </button>
          )}
        </header>

        <section>
          <h2>:: ABOUT</h2>
          {ABOUT_COPY.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>

        <section>
          <h2>:: OPEN SOURCE</h2>
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
          <h2>:: STACK</h2>
          <ul className="stack-list">
            {STACK.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>:: SERVICES</h2>
          <ul className="service-list">
            {SERVICES.map((sv) => (
              <li key={sv.name}>
                <span className="service-name">{sv.name}</span>
                <span className="service-desc dim">{sv.desc}</span>
              </li>
            ))}
          </ul>
          <p className="cta-line">{SERVICES_CTA.page}</p>
        </section>

        <section>
          <h2>:: CLIENT WORK</h2>
          <p>{CLIENTWORK_COPY.body}</p>
          <p className="cta-line">{CLIENTWORK_COPY.page}</p>
        </section>

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
