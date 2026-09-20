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
