import type { Dictionary } from "./types";

// Natural developer Thai, not a literal translation of en.ts. Command names, flags,
// file paths, IDs and code stay in English — see SITE_SPEC.md Languages.
export const th: Dictionary = {
  meta: {
    frameworkName: "Jarvis",
  },

  skipToContent: "ข้ามไปยังเนื้อหา",

  nav: {
    docs: "เอกสาร",
    commands: "คำสั่ง",
    workflows: "เวิร์กโฟลว์",
    changelog: "ประวัติการอัปเดต",
    github: "GitHub",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
  },

  languageSwitch: {
    label: "ภาษา",
    en: "English",
    th: "ไทย",
  },

  theme: {
    toggle: "สลับธีม",
    light: "สว่าง",
    dark: "มืด",
    system: "ตามระบบ",
  },

  search: {
    buttonLabel: "ค้นหา",
    placeholder: "ค้นหาเอกสารและคำสั่ง…",
    empty: "ไม่พบผลลัพธ์",
    groupPages: "หน้าเอกสาร",
    groupCommands: "คำสั่ง",
    shortcutHint: "⌘K",
  },

  footer: {
    tagline: "เฟรมเวิร์ก SDLC ที่ใช้ AI ขับเคลื่อน สำหรับ Claude Code",
    docsHeading: "เอกสารประกอบ",
    projectHeading: "โปรเจกต์",
    license: "สัญญาอนุญาต MIT",
    editedOn: "แก้ไขหน้านี้บน GitHub",
  },

  docsShell: {
    onThisPage: "ในหน้านี้",
    editThisPage: "แก้ไขหน้านี้บน GitHub",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    breadcrumbHome: "เอกสาร",
    missingTranslationNotice: "หน้านี้ยังไม่มีฉบับภาษาไทย จึงแสดงฉบับภาษาอังกฤษแทน",
  },

  docsNavGroups: {
    start: "เริ่มต้น",
    reference: "คู่มืออ้างอิง",
    team: "การทำงานเป็นทีม",
  },

  docsNav: {
    introduction: "ความรู้เบื้องต้น",
    sdlc: "กระบวนการ SDLC",
    "getting-started": "เริ่มต้นใช้งาน",
    concepts: "แนวคิดหลัก",
    commands: "คำสั่ง",
    agents: "เอเจนต์",
    workflows: "เวิร์กโฟลว์",
    gates: "เกต",
    standards: "มาตรฐาน",
    configuration: "การตั้งค่า",
    team: "การใช้งานแบบทีม",
    troubleshooting: "แก้ปัญหาเบื้องต้น",
    faq: "คำถามที่พบบ่อย",
  },

  notFound: {
    title: "ไม่พบหน้านี้",
    body: "หน้าที่คุณต้องการไม่มีอยู่หรือถูกย้ายไปแล้ว",
    backHome: "กลับหน้าแรก",
  },

  landing: {
    hero: {
      headline: "มาตรฐานที่มี gate คุม ไม่ต้องหวังให้ทุกคนจำได้",
      subhead: "Jarvis ส่งงานทุกชิ้นให้ agent เฉพาะทาง ตรวจกับมาตรฐานของทีม และบล็อกสิ่งที่ห้ามเกิดไว้ก่อน ไม่ต้องรอให้คนมาทักทีหลัง",
      getStarted: "เริ่มต้นใช้งาน",
      viewOnGithub: "ดูใน GitHub",
      copyInstall: "คัดลอกคำสั่งติดตั้ง",
      copied: "คัดลอกแล้ว",
    },
    problem: {
      heading: "ปัญหา และแนวทางแก้ไข",
      problemLabel: "ปัญหา",
      problemTitle: "โค้ดที่ agent เขียนออกมาดูดี ไม่ได้แปลว่าตรงตามมาตรฐานของทีม",
      problemBody: "ถ้าไม่มีใครคุม AI coding agent จะใช้ JOIN ทั้งที่ทีมตกลงกันแล้วว่าห้ามใช้ ลืมสร้าง index ส่ง error ดิบจากฐานข้อมูลไปถึงเบราว์เซอร์ หรือส่งงานที่ acceptance criterion ไม่มี test แล้วยังรายงานอย่างมั่นใจว่าเรียบร้อยดี",
      approachLabel: "แนวทางแก้ไข",
      approachTitle: "Jarvis เขียนมาตรฐานของทีมเป็นกฎที่มี ID กำกับ แล้วใช้กฎเหล่านั้นเป็น gate ที่บล็อกงานเมื่อไม่ผ่าน",
      approachBody: "สคริปต์ตรวจส่วนที่เช็กด้วยกฎตายตัวได้ gatekeeper agent ตรวจส่วนที่ต้องใช้วิจารณญาณโดยต้องมีหลักฐาน และคนอนุมัติ phase ที่สำคัญ งานจะไปต่อได้ก็ต่อเมื่อผ่านครบ",
    },
    pipeline: {
      heading: "วิธีการทำงาน",
      subhead: "งานมี 10 ประเภท แต่ละประเภทมีลำดับ phase ของตัวเอง เลือกประเภทงานเพื่อดูตั้งแต่ต้นจนจบ",
      workTypeLabel: "ประเภทงาน",
      phasesLabel: "Phase",
      agentLabel: "Agent",
      ownerLabel: "ผู้รับผิดชอบ",
      outputsLabel: "ผลลัพธ์",
      checklistLabel: "Prefix ของ checklist",
      approvalLabel: "การอนุมัติ",
      approvalHuman: "ต้องมีการอนุมัติจากคน",
      approvalNone: "ไม่ต้องมีการอนุมัติ",
      optionalLabel: "ไม่บังคับ ข้ามไปเว้นแต่",
      conditionalLabel: "เฉพาะเมื่อ",
      stepOf: "Phase ที่ {n} จาก {total}",
      summary: "{phases} phase ต้องให้คนอนุมัติ {approvals} phase",
      legendApproval: "คนต้องอนุมัติ",
      legendOptional: "ข้ามได้",
      legendConditional: "มี agent เพิ่มเมื่อเปิด flag",
    },
    features: {
      heading: "สิ่งที่ระบบบังคับจริง",
      subhead: "ไม่ใช่เอกสารที่ทุกคนบอกว่าจะอ่านแล้วไม่เคยได้อ่าน แต่เป็นกฎที่สคริปต์และ agent ตรวจจริง",
      items: {
        orchestrator: {
          title: "orchestrator ตัวเดียว คุม agent เฉพาะทาง",
          body: "/jarvis ส่งแต่ละ phase ให้ agent ที่รับผิดชอบ phase นั้น เช่น คนเขียน requirements, architect, backend developer หรือ security reviewer โดย /jarvis ไม่ลงมือทำงานเอง",
        },
        gates: {
          title: "Gate สามชั้น",
          body: "สคริปต์ที่ตรวจตามกฎตายตัว ต่อด้วย gatekeeper agent ที่ต้องมีหลักฐาน และคนตรวจใน phase ที่จำเป็น force ผ่าน gate ที่ไม่ผ่านได้ แต่ต้องระบุเหตุผล และระบบจะบันทึกไว้ให้ตรวจย้อนหลังเสมอ",
        },
        traceability: {
          title: "ย้อนรอยได้ด้วย ID",
          body: "requirement, story, criterion, task และ finding ทุกตัวมี ID กำกับ ตั้งแต่คำถามแรกตอน intake ไปจนถึง release notes",
        },
        standards: {
          title: "มาตรฐานที่เก็บเป็นไฟล์ในรีโป",
          body: "กฎของทีมเก็บในไฟล์ที่อยู่ใน git มี rule ID ให้ reviewer อ้างถึงได้ ไม่ได้อยู่ในหน้า wiki ที่ไม่มีใครเปิดก่อน merge",
        },
        hooks: {
          title: "Hook บล็อกคำสั่งที่เสี่ยง",
          body: "การแก้ไฟล์ของ framework การรันคำสั่งที่คนต้องรันเอง หรือการแก้ migration โดยไม่ได้ประกาศ schema change ไว้ก่อน จะถูกบล็อกตั้งแต่ก่อน tool call รัน ไม่ต้องรอไปจับได้ทีหลัง",
        },
        team: {
          title: "ใช้กับทั้งทีมได้ตั้งแต่วันแรก",
          body: "อัปเกรดแล้วเขียนทับเฉพาะไฟล์ของ framework ไม่แตะมาตรฐานของทีม state เป็นไฟล์ JSON เล็ก ๆ ที่ใช้กับ git ได้ดี สองคนทำคนละ work item พร้อมกันก็ไม่ conflict",
        },
      },
    },
    replay: {
      heading: "ดูตัวอย่าง session จริง",
      subhead: "การรัน /jarvis จริง ตั้งแต่คำถามตอน intake, status report ไปจนถึงตอนที่ gate ไม่ผ่าน",
      play: "เล่น",
      pause: "หยุดชั่วคราว",
      step: "ทีละขั้น",
      restart: "เริ่มใหม่",
      showTranscript: "แสดง transcript",
      hideTranscript: "ซ่อน transcript",
      captions: {
        start: "เริ่มต้น work item ใหม่",
        intake: "orchestrator จัดประเภทงาน แล้วถามคำถาม intake ไม่เกิน 5 ข้อในข้อความเดียว",
        answer: "พอตอบคำถามแล้ว phase ต่าง ๆ จะรันต่อไปเองจนกว่าจะถึงจุดที่ต้องอนุมัติ หรือเจอ gate ที่ไม่ผ่าน",
        status: "ทุกรอบจบด้วย status report เสมอ ไม่ว่าผลจะออกมาอย่างไร",
        gateFailed: "ต่อมา phase review เจอปัญหาจริง gate จึงไม่ผ่าน และ orchestrator แสดงให้เห็นว่าติดอะไรอยู่",
        forced: "force ผ่าน gate ได้ แต่ต้องระบุเหตุผล ระบบจะบันทึกไว้ให้ตรวจย้อนหลัง และสร้าง follow-up item สำหรับเรื่องที่ยังไม่ได้แก้",
      },
    },
    finalCta: {
      heading: "ใช้มาตรฐานของทีมคุณเองได้",
      body: "Jarvis มีมาตรฐานสำหรับ Go และ React ให้ครบชุด จะใช้ตามนั้น แก้ หรือเปลี่ยนใหม่ทั้งหมดก็ได้ gate ก็ยังตรวจเหมือนเดิม",
      cta: "อ่านเอกสาร",
    },
  },

  sdlc: {
    teaser: {
      heading: "จากคำขอไปจนถึง release",
      subhead: "6 ขั้น วนเป็นวงจรเดียว ดู work item เคลื่อนผ่านแต่ละขั้น และดูว่า agent ตัวไหนรับผิดชอบขั้นนั้น",
      cta: "อ่านคู่มือ SDLC",
    },
    lifecycle: {
      ringLabel: "ขั้นของ SDLC",
      stageOf: "ขั้นที่ {n} จาก {total}",
      play: "เล่นตัวอย่างอัตโนมัติ",
      pause: "หยุดตัวอย่างอัตโนมัติ",
      hubTitle: "Jarvis",
      hubSubtitle: "orchestrator",
      legendApproval: "คนต้องอนุมัติ",
      legendLoop: "review ไม่ผ่านจะวนกลับไป build",
      legendNext: "work item ถัดไป",
      loopLabel: "FIX task",
      whoLabel: "ในทีมทั่วไปใครทำ",
      agentsLabel: "Agent ของ Jarvis",
      producesLabel: "ผลลัพธ์",
      gateLabel: "ตรวจโดย",
      addsLabel: "Jarvis ช่วยอะไร",
      phasesLabel: "Phase",
      approvalOn: "คุณอนุมัติ {phases} ก่อนเริ่มขั้นถัดไป",
      noApproval: "ขั้นนี้ไม่มีการอนุมัติจากคน ให้ gate เป็นผู้ตัดสิน",
      gateChecklist: "Checklist {prefixes} แล้วตามด้วย gatekeeper agent",
      conditionalWhen: "เมื่อ {flag} เป็น true",
      optionalWhen: "{phase} ทำเฉพาะเมื่อ {flag} เป็น true",
      workTypeNote: "วาดตามงานประเภท feature งานประเภทอื่นจะข้ามหรือสลับลำดับ phase ดูที่หน้าเวิร์กโฟลว์",
      stages: {
        discover: {
          tagline: "ทำความเข้าใจคำขอ",
          who: "ผู้ขอ, product owner",
          adds: "orchestrator จัดคำขอเข้าหนึ่งในงาน 10 ประเภท และถามคำถามเรื่อง flag ไม่เกิน 5 ข้อ จากนั้น analyst แยกตัวปัญหาออกจากวิธีแก้ และเขียนเป้าหมายแต่ละข้อเป็น metric, baseline และ target",
        },
        define: {
          tagline: "ระบุให้ชัดว่าจะสร้างอะไร",
          who: "Product owner, business analyst, UX designer",
          adds: "requirement มี ID และลำดับความสำคัญแบบ MoSCoW ทุก story มี acceptance criterion แบบ Given/When/Then, flow วาดด้วย Mermaid และทุกหน้าจอกำหนดสถานะ loading, empty, error, success และ disabled คุณอนุมัติ requirements และอนุมัติ UX spec เมื่องานนั้นมี UI",
        },
        design: {
          tagline: "ตัดสินใจว่าจะสร้างอย่างไร",
          who: "Solution architect, tech lead",
          adds: "architect จับคู่ทุก requirement เข้ากับ component ระบุ index ที่รองรับทุก query และเขียน ADR สำหรับทุกการตัดสินใจและทุกข้อยกเว้นของมาตรฐาน จากนั้น planner แตก design เป็น task ที่แตะ layer เดียว คุณอนุมัติ architecture",
        },
        build: {
          tagline: "ลงมือเขียนทีละ task",
          who: "Backend และ frontend developer",
          adds: "แต่ละ task ส่งให้ agent หนึ่งตัวตาม layer ของมัน ทุกครั้งที่จบ task CLI จะรัน check ที่ตั้งค่าไว้ของ layer นั้น และรัน lint ตามมาตรฐานกับไฟล์ที่แก้",
        },
        verify: {
          tagline: "พิสูจน์ว่าใช้งานได้จริง",
          who: "QA engineer, reviewer ด้าน security, database และ performance",
          adds: "tester จับคู่ทุก acceptance criterion เข้ากับ test case, reviewer ตรวจ diff พร้อมกันแบบขนาน และ finding ที่บล็อกจะส่งงานกลับไป build เป็น FIX task จากนั้น QA รับรองด้วย traceability matrix และคำตัดสิน Go/No-Go",
        },
        ship: {
          tagline: "ปล่อยงานโดยมีทางถอย",
          who: "Release manager, DevOps engineer",
          adds: "release notes และ CHANGELOG ระบุ forced gate ทุกตัว งานที่แก้ฐานข้อมูลมี runbook เพิ่ม งานที่แก้ infrastructure มี deploy plan พร้อมซ้อมการ rollback คุณอนุมัติ release",
        },
      },
    },
    roles: {
      agentsLabel: "Agent",
      commandsLabel: "คำสั่ง",
      noAgent: "ไม่มี agent",
      items: {
        "product-owner": { name: "Product owner", note: "เขียน PRD และ user story พร้อม acceptance criterion" },
        "business-analyst": { name: "Business analyst", note: "ตั้งกรอบปัญหา แล้ววาด flow และ business rule" },
        "ux-designer": { name: "UX designer", note: "กำหนดหน้าจอ สถานะ การตรวจสอบข้อมูล และ accessibility" },
        "solution-architect": { name: "Solution architect", note: "ออกแบบระบบ และบันทึกทุกการตัดสินใจเป็น ADR" },
        "tech-lead": { name: "Tech lead", note: "แตก design เป็น task ที่เรียงลำดับแล้ว แต่ละ task แตะ layer เดียว" },
        "backend-developer": { name: "Backend developer", note: "เขียน task ฝั่ง Go หนึ่งชิ้นพร้อม unit test" },
        "frontend-developer": { name: "Frontend developer", note: "เขียน task ฝั่ง React หนึ่งชิ้นพร้อม test" },
        "full-stack-developer": {
          name: "Full-stack developer",
          note: "ไม่มี agent เฉพาะ เพราะทุก task แตะ layer เดียว งานแบบ full-stack จึงถูกแยกเป็น backend task กับ frontend task",
        },
        "qa-engineer": { name: "QA engineer", note: "จับคู่ acceptance criterion กับ test แล้วรับรองการ release" },
        reviewers: { name: "Reviewer", note: "reviewer 4 ตัวตรวจทุก diff พร้อมกัน ได้แก่ standards, performance, security และ database" },
        "devops-engineer": {
          name: "DevOps engineer",
          note: "วางแผน pipeline, IaC, การ deploy และ alert รวมถึงตรวจงานที่แก้ infrastructure ทำงานเฉพาะเมื่อ has_infra_change เป็น true",
        },
        "release-manager": { name: "Release manager", note: "เตรียม release notes, runbook และ CHANGELOG" },
        investigator: { name: "Investigator", note: "หา root cause ของ bug, วัด baseline ด้าน performance, ประเมินภัยคุกคาม และเขียน postmortem" },
        "staff-engineer": {
          name: "Staff engineer",
          note: "ตรวจทั้ง codebase หา architecture drift และ tech debt โดยไม่ผูกกับ work item ใดเลย",
        },
        "project-manager": {
          name: "Project manager",
          note: "ไม่มี agent คำสั่ง portfolio รายงานทุก work item ที่ยังทำอยู่ พร้อม dependency และไฟล์ที่ชนกัน จากสถานะจริง",
        },
        gatekeeper: { name: "Gatekeeper", note: "ผู้ตัดสินอิสระของทุก phase อ้างหลักฐานเสมอ และไม่แก้ไฟล์" },
      },
    },
    trace: {
      ariaLabel: "สายการย้อนรอยจาก requirement ไปถึง QA matrix",
      note: "ทุกข้อต่อในสายนี้มีสคริปต์ตรวจ requirement ที่ไม่มี story หรือ criterion ที่ไม่มี test จะไม่ผ่าน gate",
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
    title: "ประวัติการอัปเดต",
    subhead: "การเปลี่ยนแปลงสำคัญของเฟรมเวิร์ก เรียงจากใหม่ไปเก่า",
    empty: "ยังไม่มีการเผยแพร่เวอร์ชัน",
  },

  reference: {
    commands: {
      filterPlaceholder: "กรองคำสั่ง…",
      tabSlash: "Slash commands",
      tabCli: "CLI",
      humanOnlyBadge: "คนรันเท่านั้น",
      argumentsLabel: "อาร์กิวเมนต์",
      exampleLabel: "ตัวอย่าง",
      noResults: "ไม่พบคำสั่งที่ตรงกับตัวกรองนี้",
    },
    agents: {
      toolsLabel: "Tools",
      modelLabel: "Model",
      modesLabel: "Modes",
      inputsLabel: "Inputs",
      outputsLabel: "Outputs",
    },
    standards: {
      fileHeader: "ไฟล์",
      coversHeader: "ครอบคลุม",
      rulesHeader: "จำนวน rule",
      mustCount: "MUST",
      shouldCount: "SHOULD",
      showRules: "รายการ rule",
    },
    config: {
      pathHeader: "คีย์",
      defaultHeader: "ค่าเริ่มต้น",
      descriptionHeader: "คำอธิบาย",
    },
  },
};
