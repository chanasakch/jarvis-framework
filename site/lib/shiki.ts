import { codeToHtml, type BundledLanguage } from "shiki";

// Verified output shape (see globals.css comment): a single call with both themes emits
// one <pre class="shiki ..."> per block, with --shiki-light/--shiki-dark variables per
// token and --shiki-light-bg/--shiki-dark-bg on the wrapper. No client JS re-highlights
// on theme change — CSS alone picks the active variable.
export async function highlight(code: string, lang: BundledLanguage | (string & {})) {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
