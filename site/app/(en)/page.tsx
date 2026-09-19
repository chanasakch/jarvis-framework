import { LandingPage } from "@/components/landing/landing-page";
import { LocalePreferenceRedirect } from "@/components/i18n/locale-preference";
import { getDictionary } from "@/lib/i18n";

export default function HomePage() {
  return (
    <>
      <LocalePreferenceRedirect locale="en" />
      <LandingPage locale="en" dict={getDictionary("en")} />
    </>
  );
}
