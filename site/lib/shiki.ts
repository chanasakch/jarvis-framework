import { codeToHtml, type BundledLanguage } from "shiki";

// Verified output shape (see globals.css comment): a single call with both themes emits
// one <pre class="shiki ..."> per block, with --shiki-light/--shiki-dark variables per
// token and --shiki-light-bg/--shiki-dark-bg on the wrapper. No client JS re-highlights
// on theme change — CSS alone picks the active variable.
// Not github-light/github-dark: an axe-core pass on a real code sample (S3 QA) found
// github-light emits at least one token (#E36209, string literals) at 3.48:1 against
// white, below WCAG AA's 4.5:1 for small text. light-plus / github-dark-default were
// checked the same way (every token color against the theme's own background) and both
// clear 4.5:1 with margin — see the comment on the .shiki rule in app/globals.css.
export async function highlight(code: string, lang: BundledLanguage | (string & {})) {
  return codeToHtml(code, {
    lang,
    themes: { light: "light-plus", dark: "github-dark-default" },
    defaultColor: false,
  });
}
