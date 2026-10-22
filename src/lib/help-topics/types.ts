/** A single help topic entry */
export interface HelpTopic {
  id: string;
  category?: string;
  title: string;
  content: string;
  keywords?: string[];
}
