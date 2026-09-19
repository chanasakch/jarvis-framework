/**
 * The one place org/repo and the framework's display name are named. Every generated
 * link (install command, edit-on-GitHub, footer, header) follows from these two values.
 * See SITE_PLAN.md §7 risk 7.
 */
export const siteConfig = {
  githubOrg: "chanasakch",
  githubRepo: "jarvis-framework",
  get githubUrl() {
    return `https://github.com/${this.githubOrg}/${this.githubRepo}`;
  },
  /** Matches the real installer syntax in jarvis-framework/bin/cli.js. */
  get installCommand() {
    return `npx ${this.githubRepo} init --name jarvis`;
  },
  /** Base path used by EditOnGithub for hand-written MDX under site/content/. */
  get editBaseUrl() {
    return `${this.githubUrl}/edit/main/site/content`;
  },
};
