/**
 * Utility functions to process contributors data from repositories
 */

export type Region = 'americas' | 'europe' | 'asia-pacific' | 'other';

export interface ProcessedContributor {
  login: string;
  id: number;
  avatarUrl: string;
  profileUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  region: Region;
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

/**
 * Detects region from a location string using keyword matching
 */
export function detectRegion(location: string | null): Region {
  if (!location) return 'other';
  
  const loc = location.toLowerCase();
  
  // Americas patterns
  const americasPatterns = [
    // USA states and cities
    /\busa\b/, /\bu\.s\.?a?\.?\b/, /\bunited states\b/,
    /\b(wa|ca|ny|tx|fl|ma|or|az|co|ga|nc|va|pa|il|oh|mi|nj)\b/,
    /\b(washington|california|new york|texas|florida|massachusetts|oregon|arizona|colorado|georgia|seattle|san francisco|boston|redmond|austin|denver|atlanta|chicago|los angeles|portland)\b/,
    // Canada
    /\bcanada\b/, /\b(toronto|vancouver|montreal|calgary|ottawa|alberta|ontario|quebec|bc|ab)\b/,
    // Latin America
    /\bbrazil\b/, /\bbrasil\b/, /\bméxico\b/, /\bmexico\b/, /\bargentina\b/,
    /\bchile\b/, /\bcolombia\b/, /\bperu\b/, /\bsão paulo\b/, /\brio\b/,
  ];
  
  // Europe patterns
  const europePatterns = [
    /\beurope\b/, /\beu\b/,
    /\bspain\b/, /\bespaña\b/, /\bmadrid\b/, /\bbarcelona\b/,
    /\bfrance\b/, /\bparis\b/, /\blyon\b/,
    /\bgermany\b/, /\bdeutschland\b/, /\bberlin\b/, /\bmunich\b/, /\bfrankfurt\b/,
    /\buk\b/, /\bunited kingdom\b/, /\bengland\b/, /\blondon\b/, /\bmanchester\b/,
    /\bitaly\b/, /\bitalia\b/, /\brome\b/, /\bmilan\b/,
    /\bnetherlands\b/, /\bholland\b/, /\bamsterdam\b/,
    /\bportugal\b/, /\blisbon\b/, /\blisboa\b/,
    /\bpoland\b/, /\bwarsaw\b/, /\bkrakow\b/,
    /\bczech\b/, /\bprague\b/, /\bpraha\b/,
    /\bswitzerland\b/, /\bsuisse\b/, /\bzurich\b/, /\bgeneva\b/,
    /\bbelgium\b/, /\bbrussels\b/,
    /\baustria\b/, /\bvienna\b/,
    /\bireland\b/, /\bdublin\b/,
    /\bsweden\b/, /\bstockholm\b/,
    /\bnorway\b/, /\boslo\b/,
    /\bdenmark\b/, /\bcopenhagen\b/,
    /\bfinland\b/, /\bhelsinki\b/,
  ];
  
  // Asia-Pacific patterns
  const asiaPacificPatterns = [
    /\basia\b/, /\bapac\b/,
    /\bjapan\b/, /\btokyo\b/, /\bosaka\b/,
    /\bchina\b/, /\bbeijing\b/, /\bshanghai\b/, /\bshenzhen\b/, /\bhong kong\b/,
    /\bindia\b/, /\bbangalore\b/, /\bmumbai\b/, /\bdelhi\b/, /\bhyderabad\b/,
    /\baustralia\b/, /\bsydney\b/, /\bmelbourne\b/, /\bbrisbane\b/,
    /\bsingapore\b/,
    /\bkorea\b/, /\bseoul\b/,
    /\btaiwan\b/, /\btaipei\b/,
    /\bindonesia\b/, /\bjakarta\b/,
    /\bmalaysia\b/, /\bkuala lumpur\b/,
    /\bvietnam\b/, /\bhanoi\b/,
    /\bnew zealand\b/, /\bauckland\b/, /\bwellington\b/,
    /\bphilippines\b/, /\bmanila\b/,
    /\bthailand\b/, /\bbangkok\b/,
  ];
  
  if (americasPatterns.some(pattern => pattern.test(loc))) return 'americas';
  if (europePatterns.some(pattern => pattern.test(loc))) return 'europe';
  if (asiaPacificPatterns.some(pattern => pattern.test(loc))) return 'asia-pacific';
  
  return 'other';
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
        const location = contributor.profile?.location || null;
        contributorMap.set(contributor.login, {
          login: contributor.login,
          id: contributor.id,
          avatarUrl: contributor.avatarUrl,
          profileUrl: contributor.profileUrl,
          name: contributor.profile?.name || null,
          bio: contributor.profile?.bio || null,
          company: contributor.profile?.company || null,
          location,
          region: detectRegion(location),
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
