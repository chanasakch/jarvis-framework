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
    sdlc: "SDLC process",
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

  sdlc: {
    teaser: {
      heading: "From request to release",
      subhead: "Six stages, one loop. Watch a work item move through the lifecycle and see which agent owns each step.",
      cta: "Read the SDLC guide",
    },
    lifecycle: {
      ringLabel: "SDLC stages",
      stageOf: "Stage {n} of {total}",
      play: "Play walkthrough",
      pause: "Pause walkthrough",
      hubTitle: "Jarvis",
      hubSubtitle: "orchestrator",
      legendApproval: "You approve",
      legendLoop: "Failed review loops back to build",
      legendNext: "Next work item",
      loopLabel: "FIX tasks",
      whoLabel: "Who does this on a team",
      agentsLabel: "Jarvis agents",
      producesLabel: "Produces",
      gateLabel: "Checked by",
      addsLabel: "What Jarvis adds",
      phasesLabel: "Phases",
      approvalOn: "You approve {phases} before the next stage starts.",
      noApproval: "No human approval in this stage. The gates decide.",
      gateChecklist: "Checklists {prefixes}, then a gatekeeper agent",
      conditionalWhen: "when {flag} is true",
      optionalWhen: "{phase} runs only when {flag} is true",
      workTypeNote: "Drawn for the feature work type. Other work types skip or reorder phases; see Workflows.",
      stages: {
        discover: {
          tagline: "Understand the request",
          who: "Requester, product owner",
          adds: "The orchestrator sorts the request into one of ten work types and asks up to five flag questions. The analyst then separates the problem from any solution and states each goal as a metric, a baseline and a target.",
        },
        define: {
          tagline: "Say exactly what to build",
          who: "Product owner, business analyst, UX designer",
          adds: "Requirements get IDs and MoSCoW priorities. Every story carries Given/When/Then acceptance criteria, flows are drawn in Mermaid, and every screen covers its loading, empty, error, success and disabled states. You approve the requirements, and the UX spec when the item has a UI.",
        },
        design: {
          tagline: "Decide how to build it",
          who: "Solution architect, tech lead",
          adds: "The architect maps every requirement to a component, names the index behind every query, and files an ADR for each decision or standard exception. The planner then splits the design into single-layer tasks. You approve the architecture.",
        },
        build: {
          tagline: "Write it, one task at a time",
          who: "Backend and frontend developers",
          adds: "Each task goes to one agent, chosen by its layer. After every task the CLI runs that layer's configured checks and the standards lint over the changed files.",
        },
        verify: {
          tagline: "Prove it works",
          who: "QA engineer, security, database and performance reviewers",
          adds: "The tester maps every acceptance criterion to a test case. Reviewers judge the diff in parallel, and a blocking finding sends the item back to build as a FIX task. QA then signs off with a traceability matrix and a Go/No-Go decision.",
        },
        ship: {
          tagline: "Release with a way back",
          who: "Release manager, DevOps engineer",
          adds: "Release notes and the CHANGELOG entry list every forced gate. Database changes also get a runbook, and infrastructure changes get a deploy plan with a rollback drill. You approve the release.",
        },
      },
    },
    roles: {
      agentsLabel: "Agents",
      commandsLabel: "Command",
      noAgent: "No agent",
      items: {
        "product-owner": { name: "Product owner", note: "Writes the PRD and user stories with acceptance criteria." },
        "business-analyst": { name: "Business analyst", note: "Frames the problem, then draws the flows and business rules." },
        "ux-designer": { name: "UX designer", note: "Specifies screens, states, validation and accessibility." },
        "solution-architect": { name: "Solution architect", note: "Designs the system and records each decision as an ADR." },
        "tech-lead": { name: "Tech lead", note: "Breaks the design into ordered, single-layer tasks." },
        "backend-developer": { name: "Backend developer", note: "Implements one Go task with its unit tests." },
        "frontend-developer": { name: "Frontend developer", note: "Implements one React task with its tests." },
        "full-stack-developer": {
          name: "Full-stack developer",
          note: "No agent of its own. Each task has one layer, so the work splits into a backend task and a frontend task.",
        },
        "qa-engineer": { name: "QA engineer", note: "Maps acceptance criteria to tests, then certifies the release." },
        reviewers: { name: "Reviewers", note: "Four reviewers judge every diff in parallel: standards, performance, security and database." },
        "devops-engineer": {
          name: "DevOps engineer",
          note: "Plans pipelines, IaC, deploys and alerts, and reviews infrastructure changes. Runs only when has_infra_change is true.",
        },
        "release-manager": { name: "Release manager", note: "Prepares the release notes, the runbook and the CHANGELOG entry." },
        investigator: { name: "Investigator", note: "Finds the root cause of a bug, baselines performance, assesses threats and writes postmortems." },
        "staff-engineer": {
          name: "Staff engineer",
          note: "Reviews the whole codebase for architecture drift and tech debt, outside any single work item.",
        },
        "project-manager": {
          name: "Project manager",
          note: "No agent. The portfolio command reports every active work item, its dependencies and file conflicts from real state.",
        },
        gatekeeper: { name: "Gatekeeper", note: "An independent judge for every phase. It cites evidence and never edits." },
      },
    },
    trace: {
      ariaLabel: "Traceability chain from requirement to QA matrix",
      note: "A script checks every link in this chain. A requirement with no story, or a criterion with no test, fails the gate.",
      steps: {
        requirement: { label: "Requirement", caption: "prd.md" },
        story: { label: "User story", caption: "stories.md" },
        criterion: { label: "Acceptance criterion", caption: "Given / When / Then" },
        test: { label: "Test case", caption: "test-plan.md" },
        report: { label: "QA matrix", caption: "qa-report.md" },
      },
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
