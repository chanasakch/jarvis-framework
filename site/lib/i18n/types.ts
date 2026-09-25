import type { RoleId, StageId } from "@/lib/sdlc/model";

export const LOCALES = ["en", "th"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Every UI string in the site, typed once. `en.ts` and `th.ts` are each declared as
 * `const x: Dictionary = {...}` — assigning an object literal with a missing or
 * misspelled key to a typed variable is a TypeScript error, so a missing Thai key fails
 * `tsc --noEmit` (and therefore the build) rather than silently falling back at runtime.
 * This covers UI chrome only; MDX content parity is a separate check
 * (scripts/check-i18n-parity.ts), because MDX bodies aren't representable as a type.
 */
export interface Dictionary {
  meta: {
    /** Framework display name — SITE_SPEC.md "comes from framework config", read via
     *  jarvis.config.yaml's `jarvis.name` at content-generation time (S4); this is the
     *  fallback used before generated content exists. */
    frameworkName: string;
  };

  skipToContent: string;

  nav: {
    docs: string;
    commands: string;
    workflows: string;
    changelog: string;
    github: string;
    openMenu: string;
    closeMenu: string;
  };

  languageSwitch: {
    label: string;
    en: string;
    th: string;
  };

  theme: {
    toggle: string;
    light: string;
    dark: string;
    system: string;
  };

  search: {
    buttonLabel: string;
    placeholder: string;
    empty: string;
    groupPages: string;
    groupCommands: string;
    shortcutHint: string;
  };

  footer: {
    tagline: string;
    docsHeading: string;
    projectHeading: string;
    license: string;
    editedOn: string;
  };

  docsShell: {
    onThisPage: string;
    editThisPage: string;
    previous: string;
    next: string;
    breadcrumbHome: string;
    missingTranslationNotice: string;
  };

  /** Section headings above groups of docs-nav items (lib/content/nav.ts groups). */
  docsNavGroups: {
    start: string;
    reference: string;
    team: string;
  };

  /** Left-nav titles for /docs/*, keyed by slug (lib/content/nav.ts is the source of
   *  the slug list and ordering; titles live here so they're localized). */
  docsNav: {
    introduction: string;
    sdlc: string;
    "getting-started": string;
    concepts: string;
    commands: string;
    agents: string;
    workflows: string;
    gates: string;
    standards: string;
    configuration: string;
    team: string;
    troubleshooting: string;
    faq: string;
  };

  notFound: {
    title: string;
    body: string;
    backHome: string;
  };

  landing: {
    hero: {
      headline: string;
      subhead: string;
      getStarted: string;
      viewOnGithub: string;
      copyInstall: string;
      copied: string;
    };
    problem: {
      heading: string;
      problemLabel: string;
      problemTitle: string;
      problemBody: string;
      approachLabel: string;
      approachTitle: string;
      approachBody: string;
    };
    pipeline: {
      heading: string;
      subhead: string;
      workTypeLabel: string;
      phasesLabel: string;
      agentLabel: string;
      ownerLabel: string;
      outputsLabel: string;
      checklistLabel: string;
      approvalLabel: string;
      approvalHuman: string;
      approvalNone: string;
      optionalLabel: string;
      conditionalLabel: string;
      stepOf: string;
      summary: string;
      legendApproval: string;
      legendOptional: string;
      legendConditional: string;
    };
    features: {
      heading: string;
      subhead: string;
      items: {
        orchestrator: { title: string; body: string };
        gates: { title: string; body: string };
        traceability: { title: string; body: string };
        standards: { title: string; body: string };
        hooks: { title: string; body: string };
        team: { title: string; body: string };
      };
    };
    replay: {
      heading: string;
      subhead: string;
      play: string;
      pause: string;
      step: string;
      restart: string;
      showTranscript: string;
      hideTranscript: string;
      captions: {
        start: string;
        intake: string;
        answer: string;
        status: string;
        gateFailed: string;
        forced: string;
      };
    };
    finalCta: {
      heading: string;
      body: string;
      cta: string;
    };
  };

  /** The SDLC lifecycle diagram (landing teaser + /docs/sdlc). Stage and role IDs come
   *  from lib/sdlc/model.ts, so adding one there is a type error here until it is
   *  translated. What each stage *contains* (agents, outputs, approvals) is read from the
   *  generated workflow JSON, not written here. */
  sdlc: {
    teaser: { heading: string; subhead: string; cta: string };
    lifecycle: {
      ringLabel: string;
      stageOf: string;
      play: string;
      pause: string;
      hubTitle: string;
      hubSubtitle: string;
      legendApproval: string;
      legendLoop: string;
      legendNext: string;
      loopLabel: string;
      whoLabel: string;
      agentsLabel: string;
      producesLabel: string;
      gateLabel: string;
      addsLabel: string;
      phasesLabel: string;
      approvalOn: string;
      noApproval: string;
      gateChecklist: string;
      conditionalWhen: string;
      optionalWhen: string;
      workTypeNote: string;
      stages: Record<StageId, { tagline: string; who: string; adds: string }>;
    };
    roles: {
      agentsLabel: string;
      commandsLabel: string;
      noAgent: string;
      items: Record<RoleId, { name: string; note: string }>;
    };
    trace: {
      ariaLabel: string;
      note: string;
      steps: {
        requirement: { label: string; caption: string };
        story: { label: string; caption: string };
        criterion: { label: string; caption: string };
        test: { label: string; caption: string };
        report: { label: string; caption: string };
      };
    };
  };

  changelog: {
    title: string;
    subhead: string;
    empty: string;
  };

  reference: {
    commands: {
      filterPlaceholder: string;
      tabSlash: string;
      tabCli: string;
      humanOnlyBadge: string;
      argumentsLabel: string;
      exampleLabel: string;
      noResults: string;
    };
    agents: {
      toolsLabel: string;
      modelLabel: string;
      modesLabel: string;
      inputsLabel: string;
      outputsLabel: string;
    };
    standards: {
      fileHeader: string;
      coversHeader: string;
      rulesHeader: string;
      mustCount: string;
      shouldCount: string;
      showRules: string;
    };
    config: {
      pathHeader: string;
      defaultHeader: string;
      descriptionHeader: string;
    };
  };
}
