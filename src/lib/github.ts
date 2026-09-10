// =============================================================================
// 🐙 GitHub — public profile/repos fetch (no auth, rate-limit friendly)
// Demo seed + dashboard import dono isi ko use karte hain. Private data kabhi
// nahi — sirf public GitHub REST API.
// =============================================================================

export interface GithubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  blog: string | null;
  followers: number;
  publicRepos: number;
  htmlUrl: string;
}

export interface GithubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  htmlUrl: string;
  updatedAt: string;
}

const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "LinkForge",
};

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers: HEADERS });
  if (res.status === 404) throw new Error("GitHub user not found");
  if (res.status === 403) throw new Error("GitHub rate limit exceeded — please try again in a few minutes");
  if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
  return (await res.json()) as T;
}

interface GhUserJson {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  blog: string | null;
  followers: number;
  public_repos: number;
  html_url: string;
}

interface GhRepoJson {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  updated_at: string;
  fork: boolean;
}

export async function fetchGithubProfile(username: string): Promise<GithubProfile> {
  const u = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(u)) throw new Error("Invalid GitHub username");
  const j = await gh<GhUserJson>(`/users/${u}`);
  return {
    login: j.login,
    name: j.name,
    bio: j.bio,
    avatarUrl: j.avatar_url,
    blog: j.blog || null,
    followers: j.followers,
    publicRepos: j.public_repos,
    htmlUrl: j.html_url,
  };
}

export async function fetchGithubRepos(username: string, limit = 30): Promise<GithubRepo[]> {
  const u = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(u)) throw new Error("Invalid GitHub username");
  const list = await gh<GhRepoJson[]>(`/users/${u}/repos?per_page=100&sort=updated`);
  return list
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.updated_at.localeCompare(a.updated_at))
    .slice(0, Math.min(Math.max(limit, 1), 50))
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      htmlUrl: r.html_url,
      updatedAt: r.updated_at,
    }));
}

/** Repo → link draft (import preview + seed dono use karte hain) */
export function repoToLinkDraft(repo: GithubRepo, position: number): {
  title: string;
  url: string;
  description: string;
  icon: string;
  type: string;
  size: string;
  position: number;
} {
  const desc = [repo.description?.slice(0, 120), repo.language ? `Built with ${repo.language}` : null]
    .filter(Boolean)
    .join(" · ");
  return {
    title: repo.name,
    url: repo.htmlUrl,
    description: desc,
    icon: "github",
    type: "github",
    size: "standard",
    position,
  };
}
