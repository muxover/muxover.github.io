import {
  ABOUT_COPY,
  CLIENTWORK_COPY,
  CONTACT,
  IDENTITY,
  SERVICES,
  SERVICES_CTA,
  STACK,
  STATIONS,
} from "../content";
import { useStore } from "../store";
import type { Repo } from "../api/github";

export const LANG_COLORS: Record<string, string> = {
  Go: "#00add8",
  Rust: "#dea584",
  Python: "#3572a5",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  PHP: "#4f5d95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Swift: "#f05138",
};

export function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - +new Date(iso)) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function RepoRow({ repo }: { repo: Repo }) {
  return (
    <a className="repo" href={repo.html_url} target="_blank" rel="noreferrer">
      <div className="repo-head">
        <span className="repo-name">{repo.name}</span>
        <span className="repo-meta">
          {repo.language && (
            <span className="repo-lang">
              <i style={{ background: LANG_COLORS[repo.language] ?? "#777" }} />
              {repo.language}
            </span>
          )}
          <span>★ {repo.stargazers_count}</span>
          <span>{timeAgo(repo.pushed_at)}</span>
        </span>
      </div>
      {repo.description && <div className="repo-desc">{repo.description}</div>}
    </a>
  );
}

function SignalLost() {
  return (
    <div className="signal-lost">
      <p>&gt; SIGNAL LOST</p>
      <p>github is unreachable from this street. come back later, or check directly:</p>
      <a href="https://github.com/muxover" target="_blank" rel="noreferrer">
        github.com/muxover
      </a>
    </div>
  );
}

function Body({ id }: { id: string }) {
  const repos = useStore((s) => s.repos);
  const profile = useStore((s) => s.profile);
  const status = useStore((s) => s.dataStatus);

  switch (id) {
    case "about":
      return (
        <div>
          <p className="panel-name">
            {IDENTITY.name} <span className="dim">// {IDENTITY.handle}</span>
          </p>
          <p className="dim">{IDENTITY.vibe}</p>
          {ABOUT_COPY.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      );
    case "opensource":
      if (status === "lost") return <SignalLost />;
      if (repos.length === 0) return <p className="dim">tuning the screens...</p>;
      return (
        <div className="repo-list">
          {status === "cached" && <p className="dim">(cached signal — github was unreachable just now)</p>}
          {repos.map((r) => (
            <RepoRow key={r.name} repo={r} />
          ))}
        </div>
      );
    case "services":
      return (
        <div>
          <p className="dim">what i build for hire:</p>
          <ul className="service-list">
            {SERVICES.map((sv) => (
              <li key={sv.name}>
                <span className="service-name">{sv.name}</span>
                <span className="service-desc dim">{sv.desc}</span>
              </li>
            ))}
          </ul>
          <p className="cta-line">{SERVICES_CTA.street}</p>
        </div>
      );
    case "clientwork":
      return (
        <div>
          <p>{CLIENTWORK_COPY.body}</p>
          <p className="cta-line">{CLIENTWORK_COPY.street}</p>
        </div>
      );
    case "stack":
      return (
        <div>
          <p className="dim">the machine dispenses:</p>
          <ul className="stack-list">
            {STACK.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      );
    case "contact":
      return (
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
      );
    case "stats":
      if (!profile) return <SignalLost />;
      return (
        <ul className="stats-list">
          <li>
            <b>{profile.public_repos}</b> public repos
          </li>
          <li>
            <b>{profile.followers}</b> followers
          </li>
          <li>
            <b>{profile.following}</b> following
          </li>
          <li>
            on github since <b>{new Date(profile.created_at).getFullYear()}</b>
          </li>
        </ul>
      );
    default:
      return null;
  }
}

export function Panel() {
  const panel = useStore((s) => s.panel);
  const closePanel = useStore((s) => s.closePanel);
  if (!panel) return null;
  const station = STATIONS.find((s) => s.id === panel)!;

  return (
    <div className="panel-backdrop" onClick={closePanel}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-bar">
          <span>:: {station.label}</span>
          <button onClick={closePanel}>[x]</button>
        </div>
        <div className="panel-body">
          <Body id={panel} />
        </div>
        <div className="panel-foot dim">esc / click outside to close</div>
      </div>
    </div>
  );
}
