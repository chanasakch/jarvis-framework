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
};
