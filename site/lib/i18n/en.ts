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
    business: {
      analogy: {
        ariaLabel: "Building a house compared with building software, stage by stage",
        houseLabel: "Building a house",
        softwareLabel: "Building software",
        note: "The comparison is not exact. Software is easier to change after delivery than a building is, so most teams work in short rounds and repeat them. See \"How teams work\" below.",
        steps: {
          discover: { house: "Visit the site and ask the owner what kind of house they want and what it may cost.", software: "Understand who has the problem, what they need and how success will be measured." },
          define: { house: "Write the requirements down: how many bedrooms, whether it needs a lift.", software: "Write the requirements and the criteria used to accept the work." },
          design: { house: "An architect draws the plans and an engineer calculates the structure.", software: "Design the system, then split it into pieces that can be built one at a time." },
          build: { house: "Builders construct it from the plans, one part at a time.", software: "Developers write the code from the design, one task at a time." },
          verify: { house: "Inspect the work and test the plumbing and wiring before handover.", software: "Test and review the code before users get it." },
          ship: { house: "Hand over the house with a manual and a warranty.", software: "Release to real users, with a way back and monitoring." },
        },
      },
      cost: {
        ariaLabel: "Illustrative chart: the later a problem is found, the more it costs to fix",
        replay: "Replay",
        tabsLabel: "Choose when the problem is found",
        foundHere: "If the problem is found now",
        caption: "An illustration of the trend, not measured data. Real numbers differ between teams and pieces of work.",
        points: {
          discover: { label: "Discover", note: "Fix it in the conversation. Talking again takes minutes." },
          define: { label: "Define", note: "Fix a requirements document. Nothing has been built yet." },
          design: { label: "Design", note: "Fix a design. There is no code yet." },
          build: { label: "Build", note: "Fix code and tests that have already been written." },
          verify: { label: "Verify", note: "Fix the code, retest and go round review again." },
          ship: { label: "Ship", note: "Fix something about to go out, so the release slips or stops." },
          live: { label: "Live", note: "Fix something users are relying on, which can affect their data and their trust." },
        },
      },
      journey: {
        ariaLabel: "One idea's path from start to customer",
        exampleTag: "Made-up example: a restaurant wants customers to book tables online",
        questionLabel: "The business question",
        outputLabel: "What comes out",
        skippedLabel: "If you skip it",
        exampleLabel: "In the example",
        stages: {
          discover: { title: "Understand the problem", question: "What is the real problem, who benefits, and how will we know it worked?", output: "A statement of the problem, measurable goals and constraints.", skipped: "The team builds something nobody needs, or solves the wrong problem.", example: "Customers phone to book and the line is always busy. The owner wants fewer missed calls, measured by bookings customers make on the website." },
          define: { title: "Say what to build", question: "What must the system do, and what counts as finished?", output: "Requirements and acceptance criteria that everyone reads the same way.", skipped: "Everyone understands it differently and finds out at handover.", example: "Book up to 30 days ahead, cancel up to 2 hours before, and never double-book a full table." },
          design: { title: "Plan how to build it", question: "How do we build it to meet that, and how do we split the work?", output: "A design, the important decisions on record, and a list of small tasks.", skipped: "Decisions get made on the fly and are hard to undo once there is a lot of code.", example: "Choose to send an SMS confirmation, and decide where the table data will live." },
          build: { title: "Build it", question: "Is each piece built to the design, and can it be checked?", output: "Working code with tests for each piece.", skipped: "One large lump of code nobody dares change.", example: "Build the booking page first, then the table management page for staff." },
          verify: { title: "Prove it works", question: "Does it do what was agreed, and is it safe enough?", output: "Test results, code review results, and a decision on whether it is ready.", skipped: "Real users end up testing it for the team.", example: "Try two people booking the same table at once, and cancelling after the deadline." },
          ship: { title: "Release and watch", question: "Can we release in a way we can undo, and will we notice at once if something is wrong?", output: "The release, a way back, and monitoring after it.", skipped: "The problem shows up while customers are using it, with no way back.", example: "Open it at one branch first, prepare a way back to phone bookings, and watch the error count after launch." },
        },
      },
      models: {
        replay: "Replay",
        whenLabel: "Suits",
        watchLabel: "Watch out for",
        items: {
          waterfall: { name: "Waterfall", how: "Work goes stage by stage in order, and each stage finishes before the next begins.", when: "Stable requirements and a need for clear documents and sign-off, such as regulated work.", watch: "You see the real thing late. A misunderstanding at the start shows up at the end." },
          agile: { name: "Agile", how: "Work is split into short rounds. Each round goes through every stage, and feedback shapes the next one.", when: "You are unsure what users really need and want to change direction as you learn.", watch: "Someone has to make priority calls steadily, or the work scatters." },
          devops: { name: "DevOps", how: "Building, testing and releasing are automated so small changes can go out often and safely.", when: "You release often and want releasing to be routine rather than an event.", watch: "It needs an investment in automation and monitoring first. Without it, releasing often means breaking often." },
        },
      },
      whoWhen: {
        caption: "A typical split of roles. Teams divide the work differently, and one person may wear several hats.",
        roleHeader: "Role",
        lead: "Leads",
        involved: "Takes part",
        none: "Not involved",
        roles: {
          owner: "Business owner / Product owner",
          analyst: "Business analyst",
          designer: "UX designer",
          architect: "Solution architect",
          developer: "Developer",
          qa: "QA",
          devops: "DevOps",
          pm: "Project manager",
        },
      },
      metrics: {
        note: "Jarvis records when each phase changes, who approved it and which gates were forced, in the .jarvis/state folder. The raw data exists, but Jarvis does not calculate these measures for you.",
        items: {
          leadTime: { name: "Lead time", meaning: "Time from starting a piece of work to having it live. It shows how fast an idea reaches a customer." },
          frequency: { name: "Release frequency", meaning: "How often you release. The more often, the smaller each change and the lower the risk of each release." },
          failureRate: { name: "Failed release rate", meaning: "The share of releases that need an urgent fix or a rollback. It shows whether the process catches problems before customers do." },
          restoreTime: { name: "Time to restore", meaning: "How long it takes to bring the service back after a problem. It shows how ready the team is to respond." },
        },
      },
      bridge: {
        painLabel: "Common in a typical team",
        howLabel: "How Jarvis handles it",
        items: {
          drift: { pain: "Requirements drift along the way and nobody knows which one a feature came from.", how: "Every requirement, story and criterion has an ID that can be traced back. The script gate checks that each Must requirement has a story and each criterion has a test." },
          decisions: { pain: "Important decisions live in chat or in someone's head, and in six months nobody remembers why.", how: "The architect writes an ADR for every decision or standards exception, kept in git with its reasoning." },
          review: { pain: "The quality of a review depends on who happens to be free.", how: "Four reviewers judge every diff in parallel against rules with IDs, and a blocking finding sends the work back to be fixed." },
          approval: { pain: "It is unclear who approved what, and when.", how: "Approval is a command a person must run, Claude cannot, and the system records who approved and when." },
          skipped: { pain: "A release is rushed by skipping checks, and nobody knows what was skipped.", how: "Forcing a gate needs a reason, is recorded, and is listed in the QA report and release notes, with a follow-up chore item opened." },
          docs: { pain: "Documents fall behind the code, or are never written.", how: "Each phase has to produce its own document to pass its gate, so documents appear with the work and live in git." },
          parallel: { pain: "Several pieces of work run at once and collide, and nobody can see what is waiting on what.", how: "The portfolio command shows every work item's phase, what it waits on, and files two items both plan to change." },
        },
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
