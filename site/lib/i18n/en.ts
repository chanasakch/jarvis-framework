import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    frameworkName: "Jarvis",
  },

  skipToContent: "Skip to content",

  nav: {
    docs: "Docs",
    commands: "Commands",
    workflows: "Workflows",
    changelog: "Changelog",
    github: "GitHub",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  languageSwitch: {
    label: "Language",
    en: "English",
    th: "ไทย",
  },

  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },

  search: {
    buttonLabel: "Search",
    placeholder: "Search docs and commands…",
    empty: "No results found.",
    groupPages: "Pages",
    groupCommands: "Commands",
    shortcutHint: "⌘K",
  },

  footer: {
    tagline: "An AI-driven SDLC framework for Claude Code.",
    docsHeading: "Documentation",
    projectHeading: "Project",
    license: "MIT License",
    editedOn: "Edit this page on GitHub",
  },

  docsShell: {
    onThisPage: "On this page",
    editThisPage: "Edit this page on GitHub",
    previous: "Previous",
    next: "Next",
    breadcrumbHome: "Docs",
    missingTranslationNotice: "This page hasn't been translated to Thai yet — showing the English version.",
  },

  docsNavGroups: {
    start: "Start",
    reference: "Reference",
    team: "Team",
  },

  docsNav: {
    introduction: "Introduction",
    "getting-started": "Getting Started",
    concepts: "Concepts",
    commands: "Commands",
    agents: "Agents",
    workflows: "Workflows",
    gates: "Gates",
    standards: "Standards",
    configuration: "Configuration",
    team: "Team",
    troubleshooting: "Troubleshooting",
    faq: "FAQ",
  },

  notFound: {
    title: "Page not found",
    body: "The page you were looking for doesn't exist or has moved.",
    backHome: "Back to home",
  },

  landing: {
    hero: {
      headline: "Standards enforced by gates, not by hope.",
      subhead:
        "Jarvis routes every change through specialist agents, checks it against your team's own standards, and blocks the parts that must never happen — before a human ever has to say so.",
      getStarted: "Get started",
      viewOnGithub: "View on GitHub",
      copyInstall: "Copy install command",
      copied: "Copied",
    },
    problem: {
      heading: "The problem, and the approach",
      problemLabel: "The problem",
      problemTitle: "An agent that writes plausible code isn't the same as one that follows your standards.",
      problemBody:
        "Left to itself, an AI coding agent will write a JOIN where your team agreed never to use one, skip an index, return a raw database error to the browser, or ship an acceptance criterion with no test — all while sounding confident about it.",
      approachLabel: "The approach",
      approachTitle: "So Jarvis turns your standards into rules with IDs, and the rules into gates that fail.",
      approachBody:
        "A script checks the deterministic parts. A gatekeeper agent checks the judgement calls, with evidence. A human approves the phases that matter. Nothing moves forward silently.",
    },
    pipeline: {
      heading: "How it works",
      subhead: "Ten work types, each with its own phase sequence. Pick one to see it end to end.",
      workTypeLabel: "Work type",
      phasesLabel: "Phases",
      agentLabel: "Agent",
      ownerLabel: "Owner",
      outputsLabel: "Outputs",
      checklistLabel: "Checklist prefix",
      approvalLabel: "Approval",
      approvalHuman: "Human approval required",
      approvalNone: "No approval required",
      optionalLabel: "Optional — skipped unless",
    },
    features: {
      heading: "What's actually enforced",
      subhead: "Not documentation everyone means to read. Rules a script and an agent actually check.",
      items: {
        orchestrator: {
          title: "One orchestrator, specialist agents",
          body: "/jarvis routes each phase to the agent that owns it — a requirements writer, an architect, a backend developer, a security reviewer — never doing the work itself.",
        },
        gates: {
          title: "Three-layer gates",
          body: "A deterministic script, then a gatekeeper agent with evidence, then a human where it matters. Forcing past a failed gate is possible — audited, reasoned, and never silent.",
        },
        traceability: {
          title: "Traceability by ID",
          body: "Every requirement, story, criterion, task and finding carries an ID, from the first intake question to the release notes.",
        },
        standards: {
          title: "Standards as code",
          body: "Your team's rules live in versioned files with rule IDs a reviewer can cite — not a wiki page nobody opens before merging.",
        },
        hooks: {
          title: "Hooks that block unsafe actions",
          body: "Editing framework files, running a human-only command, touching a migration without a declared schema change — blocked before the tool call runs, not caught after.",
        },
        team: {
          title: "Team-ready from day one",
          body: "Upgrades replace framework files only, never your standards. State is small, git-friendly JSON — two people on two work items never conflict.",
        },
      },
    },
    replay: {
      heading: "See a session",
      subhead: "A real /jarvis run — the intake questions, the status report, a gate failure.",
      play: "Play",
      pause: "Pause",
      step: "Step",
      restart: "Restart",
      showTranscript: "Show transcript",
      hideTranscript: "Hide transcript",
      captions: {
        start: "Starting a new work item.",
        intake: "The orchestrator classifies the work and asks up to five intake questions, in one message.",
        answer: "Answering unlocks the phase sequence — it runs on its own until an approval or a gate stops it.",
        status: "Every turn ends with a status report, whatever happened.",
        gateFailed: "Later, a review finds a real problem — the gate fails, and the orchestrator prints exactly what's blocking it.",
        forced: "Forcing past it is possible. It's audited, reasoned, and creates a follow-up item for what's still unresolved — never silent.",
      },
    },
    finalCta: {
      heading: "Bring your own standards.",
      body: "Jarvis ships with a full standards set for Go and React — read it, change it, or replace it. Either way, the gates hold.",
      cta: "Read the docs",
    },
  },
};
