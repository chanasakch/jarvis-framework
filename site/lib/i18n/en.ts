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
    missingTranslationNotice: "This page hasn't been translated to Thai yet. Showing the English version.",
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
        "Jarvis routes every change through specialist agents and checks it against your team's own standards. What must never happen is blocked before a human has to catch it.",
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
        "Left to itself, an AI coding agent will write a JOIN where your team agreed never to use one, skip an index, return a raw database error to the browser, or ship an acceptance criterion with no test. It will sound confident the whole time.",
      approachLabel: "The approach",
      approachTitle: "Jarvis turns your standards into rules with IDs, and the rules into gates that fail.",
      approachBody:
        "A script checks the deterministic parts. A gatekeeper agent checks the judgement calls and cites evidence. A human approves the key phases. Every step forward is recorded.",
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
      optionalLabel: "Optional, skipped unless",
      conditionalLabel: "Only when",
      stepOf: "Phase {n} of {total}",
      summary: "{phases} phases, {approvals} need human approval",
      legendApproval: "Human approval",
      legendOptional: "Optional",
      legendConditional: "Extra agent when a flag is set",
    },
    features: {
      heading: "What's enforced",
      subhead: "Rules that a script and an agent check on every change.",
      items: {
        orchestrator: {
          title: "One orchestrator, specialist agents",
          body: "/jarvis routes each phase to the agent that owns it: a requirements writer, an architect, a backend developer, a security reviewer. It never does the work itself.",
        },
        gates: {
          title: "Three-layer gates",
          body: "A deterministic script runs first, then a gatekeeper agent that cites evidence, then a human on the phases that need approval. A human can force past a failed gate, but must give a reason, and the force is written to the audit log.",
        },
        traceability: {
          title: "Traceability by ID",
          body: "Every requirement, story, criterion, task and finding carries an ID, from the first intake question to the release notes.",
        },
        standards: {
          title: "Standards as code",
          body: "Your team's rules live in versioned files, with rule IDs a reviewer can cite in a finding.",
        },
        hooks: {
          title: "Hooks that block unsafe actions",
          body: "Hooks block the tool call before it runs when it would edit framework files, run a human-only command, or touch a migration without a declared schema change.",
        },
        team: {
          title: "Built for teams",
          body: "Upgrades replace framework files only, never your standards. State is small JSON files committed to git, one per work item, so two people on two work items never conflict.",
        },
      },
    },
    replay: {
      heading: "See a session",
      subhead: "A real /jarvis run: the intake questions, the status report, a gate failure.",
      play: "Play",
      pause: "Pause",
      step: "Step",
      restart: "Restart",
      showTranscript: "Show transcript",
      hideTranscript: "Hide transcript",
      captions: {
        start: "Starting a new work item.",
        intake: "The orchestrator classifies the work and asks up to five intake questions, in one message.",
        answer: "Answering unlocks the phase sequence. It runs on its own until an approval or a gate stops it.",
        status: "Every turn ends with a status report.",
        gateFailed: "Later, a review finds a real problem. The gate fails, and the orchestrator prints exactly what's blocking it.",
        forced: "A human can force past it with a reason. The force goes into the audit log, and a follow-up item is created for what's still unresolved.",
      },
    },
    finalCta: {
      heading: "Bring your own standards.",
      body: "Jarvis ships with a full standards set for Go and React. Read it, change it, or replace it. The gates enforce whatever version you keep.",
      cta: "Read the docs",
    },
  },

  changelog: {
    title: "Changelog",
    subhead: "Every notable change to the framework, newest first.",
    empty: "No releases yet.",
  },

  reference: {
    commands: {
      filterPlaceholder: "Filter commands…",
      tabSlash: "Slash commands",
      tabCli: "CLI",
      humanOnlyBadge: "human only",
      argumentsLabel: "Arguments",
      exampleLabel: "Example",
      noResults: "No commands match that filter.",
    },
    agents: {
      toolsLabel: "Tools",
      modelLabel: "Model",
      modesLabel: "Modes",
      inputsLabel: "Inputs",
      outputsLabel: "Outputs",
    },
    standards: {
      fileHeader: "File",
      coversHeader: "Covers",
      rulesHeader: "Rules",
      mustCount: "MUST",
      shouldCount: "SHOULD",
      showRules: "Rule list",
    },
    config: {
      pathHeader: "Key",
      defaultHeader: "Default",
      descriptionHeader: "Description",
    },
  },
};
