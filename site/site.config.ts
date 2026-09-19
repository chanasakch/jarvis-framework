/**
 * The one place org/repo and the framework's display name are named. This repo has no
 * git remote configured yet (checked at S1 planning time), so these are documented
 * placeholders — update them once the framework repo is pushed, and every generated
 * link (install command, edit-on-GitHub, footer, header) follows automatically.
 * See SITE_PLAN.md §7 risk 7.
 */
export const siteConfig = {
  githubOrg: "your-org",
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
