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
    tagline: "เฟรมเวิร์ก SDLC ที่ขับเคลื่อนด้วย AI สำหรับ Claude Code",
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
    missingTranslationNotice: "หน้านี้ยังไม่มีฉบับแปลภาษาไทย — แสดงเนื้อหาภาษาอังกฤษแทน",
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
      headline: "มาตรฐานที่บังคับใช้ด้วย gate ไม่ใช่ด้วยความหวัง",
      subhead: "Jarvis ส่งทุกการเปลี่ยนแปลงผ่าน agent เฉพาะทาง ตรวจสอบกับมาตรฐานของทีมคุณเอง และบล็อกส่วนที่ห้ามเกิดขึ้นเด็ดขาด ก่อนที่คนจะต้องมาคอยเตือนด้วยซ้ำ",
      getStarted: "เริ่มต้นใช้งาน",
      viewOnGithub: "ดูใน GitHub",
      copyInstall: "คัดลอกคำสั่งติดตั้ง",
      copied: "คัดลอกแล้ว",
    },
    problem: {
      heading: "ปัญหา และแนวทางแก้ไข",
      problemLabel: "ปัญหา",
      problemTitle: "agent ที่เขียนโค้ดดูน่าเชื่อถือ กับ agent ที่ทำตามมาตรฐานของคุณจริง ๆ ไม่ใช่เรื่องเดียวกัน",
      problemBody: "ถ้าปล่อยให้ทำงานตามลำพัง AI coding agent จะเขียน JOIN ในจุดที่ทีมคุณตกลงกันแล้วว่าห้ามใช้ ข้าม index ที่ควรมี ส่ง error ดิบจากฐานข้อมูลตรงไปที่เบราว์เซอร์ หรือส่งมอบ acceptance criterion ที่ไม่มี test รองรับ — ทั้งหมดนี้โดยที่ยังพูดจาน่าเชื่อถือราวกับไม่มีอะไรผิดพลาด",
      approachLabel: "แนวทางแก้ไข",
      approachTitle: "Jarvis จึงแปลงมาตรฐานของคุณให้เป็นกฎที่มี ID กำกับ และแปลงกฎเหล่านั้นให้เป็น gate ที่บล็อกงานทันทีเมื่อไม่ผ่าน",
      approachBody: "สคริปต์ตรวจสอบส่วนที่ชัดเจนตายตัว ส่วน gatekeeper agent ตรวจสอบส่วนที่ต้องใช้วิจารณญาณพร้อมหลักฐานประกอบ และคนเป็นผู้อนุมัติ phase ที่สำคัญ ไม่มีอะไรผ่านไปได้แบบเงียบ ๆ",
    },
    pipeline: {
      heading: "วิธีการทำงาน",
      subhead: "งาน 10 ประเภท แต่ละแบบมีลำดับ phase เป็นของตัวเอง เลือกดูได้เลยว่าแต่ละแบบไปตั้งแต่ต้นจนจบอย่างไร",
      workTypeLabel: "ประเภทงาน",
      phasesLabel: "Phase",
      agentLabel: "Agent",
      ownerLabel: "ผู้รับผิดชอบ",
      outputsLabel: "ผลลัพธ์",
      checklistLabel: "Prefix ของ checklist",
      approvalLabel: "การอนุมัติ",
      approvalHuman: "ต้องมีการอนุมัติจากคน",
      approvalNone: "ไม่ต้องมีการอนุมัติ",
      optionalLabel: "ทางเลือก — ข้ามได้ ยกเว้น",
    },
    features: {
      heading: "สิ่งที่บังคับใช้จริง",
      subhead: "ไม่ใช่เอกสารที่ทุกคนตั้งใจจะอ่านแต่ไม่เคยอ่าน แต่เป็นกฎที่สคริปต์และ agent ตรวจสอบจริง",
      items: {
        orchestrator: {
          title: "หนึ่ง orchestrator กับ agent เฉพาะทางหลายตัว",
          body: "/jarvis ส่งแต่ละ phase ไปยัง agent ที่รับผิดชอบโดยตรง ไม่ว่าจะเป็นคนเขียน requirements, architect, backend developer หรือ security reviewer — ตัวมันเองไม่ลงมือทำงานเอง",
        },
        gates: {
          title: "Gate สามชั้น",
          body: "เริ่มจากสคริปต์ที่ตรวจแบบตายตัว ตามด้วย gatekeeper agent ที่ตรวจพร้อมหลักฐาน และปิดท้ายด้วยคนในจุดที่สำคัญจริง ๆ จะฝืนผ่าน gate ที่ fail ก็ทำได้ แต่ต้องมีการบันทึกตรวจสอบย้อนหลังได้ มีเหตุผลรองรับ และไม่มีทางทำแบบเงียบ ๆ",
        },
        traceability: {
          title: "ตรวจสอบย้อนกลับได้ด้วย ID",
          body: "ทุก requirement, story, criterion, task และ finding มี ID กำกับ ตั้งแต่คำถามแรกใน intake ไปจนถึง release notes",
        },
        standards: {
          title: "มาตรฐานในรูปแบบโค้ด",
          body: "กฎของทีมคุณอยู่ในไฟล์ที่มีเวอร์ชันควบคุม พร้อม rule ID ที่ reviewer อ้างอิงได้ ไม่ใช่หน้า wiki ที่ไม่มีใครเปิดดูก่อน merge",
        },
        hooks: {
          title: "Hook ที่บล็อกการกระทำที่ไม่ปลอดภัย",
          body: "ไม่ว่าจะเป็นการแก้ไฟล์ของ framework การรันคำสั่งที่สงวนไว้สำหรับคนเท่านั้น หรือการแตะ migration โดยไม่ประกาศ schema change ไว้ก่อน — ทุกอย่างถูกบล็อกก่อนที่ tool call จะรัน ไม่ใช่จับได้ทีหลัง",
        },
        team: {
          title: "พร้อมใช้งานกับทั้งทีมตั้งแต่วันแรก",
          body: "การอัปเกรดแทนที่เฉพาะไฟล์ของ framework เท่านั้น ไม่แตะมาตรฐานของคุณ ส่วน state ก็เป็น JSON ขนาดเล็กที่เป็นมิตรกับ git — สองคนทำงานคนละ work item พร้อมกันก็ไม่มีทางชนกัน",
        },
      },
    },
    replay: {
      heading: "ดูตัวอย่างเซสชันจริง",
      subhead: "การรัน /jarvis จริง ตั้งแต่คำถามใน intake, status report ไปจนถึง gate ที่ fail",
      play: "เล่น",
      pause: "หยุดชั่วคราว",
      step: "ทีละขั้น",
      restart: "เริ่มใหม่",
      showTranscript: "แสดง transcript",
      hideTranscript: "ซ่อน transcript",
      captions: {
        start: "เริ่มต้น work item ใหม่",
        intake: "orchestrator จัดประเภทงานแล้วถามคำถาม intake สูงสุด 5 ข้อในข้อความเดียว",
        answer: "พอตอบคำถามแล้ว ลำดับ phase ก็จะทำงานต่อไปเองจนกว่าจะถึงจุดที่ต้อง approve หรือ gate ไหน fail",
        status: "ทุกรอบจบด้วย status report ไม่ว่าผลลัพธ์จะเป็นอย่างไร",
        gateFailed: "ต่อมา review เจอปัญหาจริง — gate ไม่ผ่าน แล้ว orchestrator ก็แสดงให้เห็นชัดเจนว่าอะไรบล็อกอยู่",
        forced: "จะ force ผ่านไปก็ได้ แต่ถูกบันทึกไว้ตรวจสอบ มีเหตุผลกำกับ และสร้าง follow-up item ให้สิ่งที่ยังไม่ได้แก้ — ไม่มีทางเงียบหายไปเฉยๆ",
      },
    },
    finalCta: {
      heading: "นำมาตรฐานของคุณเองมาใช้ได้เลย",
      body: "Jarvis มาพร้อมชุดมาตรฐานครบชุดสำหรับ Go และ React — จะอ่าน แก้ไข หรือแทนที่ทั้งหมดก็ได้ ไม่ว่าจะเลือกทางไหน gate ก็ยังคุมเข้มเหมือนเดิม",
      cta: "อ่านเอกสาร",
    },
  },
};
