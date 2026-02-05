/**
 * Utility functions to process contributors data from repositories
 */

export interface ProcessedContributor {
  login: string;
  id: number;
  avatarUrl: string;
  profileUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  twitterUsername: string | null;
  websiteUrl: string | null;

  // Aggregated statistics
  totalContributions: number;
  repositories: string[]; // List of repo names
  repoCount: number;

  // Most recent activity
  latestCommit: {
    sha: string;
    message: string;
    date: string;
    url: string;
    repo: string;
  } | null;
}

interface Contributor {
  login: string;
  id: number;
  contributions: number;
  avatarUrl: string;
  profileUrl: string;
  profile: {
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    email: string | null;
    twitterUsername: string | null;
    websiteUrl: string | null;
  } | null;
  activity: {
    lastCommit: {
      sha: string;
      message: string;
      date: string;
      url: string;
    } | null;
  } | null;
}

interface RepoData {
  fullName: string;
  contributorCount: number;
  contributors: Contributor[];
}

interface ContributorsData {
  lastUpdated: string;
  totalRepositories: number;
  totalContributors: number;
  repositories: Record<string, RepoData>;
}

/**
 * Processes contributors data from all repositories and returns a list of unique contributors
 * with aggregated statistics sorted by total contributions (descending)
 */
export function processContributors(data: ContributorsData): ProcessedContributor[] {
  const contributorMap = new Map<string, ProcessedContributor>();

  // Iterate through each repository
  for (const [repoName, repoData] of Object.entries(data.repositories)) {
    for (const contributor of repoData.contributors) {
      const existing = contributorMap.get(contributor.login);

      if (existing) {
        // Add contributions and repo to existing contributor
        existing.totalContributions += contributor.contributions;
        existing.repositories.push(repoName);
        existing.repoCount++;

        // Update latest commit if more recent
        if (contributor.activity?.lastCommit) {
          const newDate = new Date(contributor.activity.lastCommit.date);
          const existingDate = existing.latestCommit
            ? new Date(existing.latestCommit.date)
            : new Date(0);

          if (newDate > existingDate) {
            existing.latestCommit = {
              ...contributor.activity.lastCommit,
              repo: repoName,
            };
          }
        }
      } else {
        // New contributor
        contributorMap.set(contributor.login, {
          login: contributor.login,
          id: contributor.id,
          avatarUrl: contributor.avatarUrl,
          profileUrl: contributor.profileUrl,
          name: contributor.profile?.name || null,
          bio: contributor.profile?.bio || null,
          company: contributor.profile?.company || null,
          location: contributor.profile?.location || null,
          email: contributor.profile?.email || null,
          twitterUsername: contributor.profile?.twitterUsername || null,
          websiteUrl: contributor.profile?.websiteUrl || null,
          totalContributions: contributor.contributions,
          repositories: [repoName],
          repoCount: 1,
          latestCommit: contributor.activity?.lastCommit
            ? { ...contributor.activity.lastCommit, repo: repoName }
            : null,
        });
      }
    }
  }

  // Sort by total contributions (descending)
  return Array.from(contributorMap.values()).sort(
    (a, b) => b.totalContributions - a.totalContributions
  );
}
