export interface SearchItem {
  id: string;
  title: string;
  group: "pages" | "commands";
  href: string;
  keywords?: string[];
}
