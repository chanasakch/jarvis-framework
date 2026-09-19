import { LandingPage } from "@/components/landing/landing-page";
import { LocalePreferenceRedirect } from "@/components/i18n/locale-preference";
import { getDictionary } from "@/lib/i18n";

export default function ThaiHomePage() {
  return (
    <>
      <LocalePreferenceRedirect locale="th" />
      <LandingPage locale="th" dict={getDictionary("th")} />
    </>
  );
}
