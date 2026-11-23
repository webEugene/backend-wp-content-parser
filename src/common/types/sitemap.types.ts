export interface SitemapCheckResult {
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  declaredInRobots: boolean;
  blockedForGooglebot: boolean;
}

export interface SitemapListResult {
  sitemapList: SitemapCheckResult[];
  robotsTxtStatus: 'found' | 'not_found' | 'error';
}
