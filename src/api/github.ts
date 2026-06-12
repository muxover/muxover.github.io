import { CONFIG } from "../config";

export interface Profile {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

export interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics: string[];
  fork: boolean;
  archived: boolean;
}

export type DataStatus = "ok" | "cached" | "lost";

const TTL = CONFIG.github.cacheTtlMin * 60_000;

function readCache<T>(key: string): { t: number; data: T } | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    // storage full or disabled — live without the cache
  }
}

// Fresh cache wins; otherwise fetch; on failure fall back to a stale
// cache rather than breaking the scene.
async function cachedGet<T>(key: string, url: string): Promise<{ data: T; fresh: boolean } | null> {
  const cached = readCache<T>(key);
  if (cached && Date.now() - cached.t < TTL) return { data: cached.data, fresh: true };
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`github ${res.status}`);
    const data = (await res.json()) as T;
    writeCache(key, data);
    return { data, fresh: true };
  } catch {
    return cached ? { data: cached.data, fresh: false } : null;
  }
}

export async function loadGitHub(): Promise<{
  profile: Profile | null;
  repos: Repo[];
  status: DataStatus;
}> {
  const user = CONFIG.user;
  const [p, r] = await Promise.all([
    cachedGet<Profile>("gh:profile", `https://api.github.com/users/${user}`),
    cachedGet<Repo[]>("gh:repos", `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`),
  ]);

  let repos: Repo[] = [];
  if (r) {
    repos = r.data.filter((repo) => repo.name.toLowerCase() !== user);
    if (CONFIG.github.hideForks) repos = repos.filter((repo) => !repo.fork);
    repos.sort((a, b) =>
      CONFIG.github.sortBy === "stars"
        ? b.stargazers_count - a.stargazers_count
        : +new Date(b.pushed_at) - +new Date(a.pushed_at),
    );
  }

  const status: DataStatus = !p && !r ? "lost" : p?.fresh && r?.fresh ? "ok" : "cached";
  return { profile: p?.data ?? null, repos, status };
}
