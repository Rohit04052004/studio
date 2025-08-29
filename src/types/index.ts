export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isPending?: boolean;
};

export type Report = {
  id: string;
  name: string;
  type: 'text' | 'image';
  content: string; // data URI for images, raw text for text files
  originalText?: string;
  summary: string;
  highlightedSummary: string;
  chatHistory: Message[];
};
