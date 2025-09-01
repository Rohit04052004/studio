
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isPending?: boolean;
  createdAt: Date;
};

export type Report = {
  id: string;
  userId: string;
  name: string;
  type: 'text' | 'image';
  content: string; // data URI for images, raw text for text files
  originalText?: string;
  summary: string;
  highlightedSummary: string;
  chatHistory: Message[];
  createdAt: Date;
};

export type UserProfile = {
  uid: string;
  email: string;
  firstName: string;
  lastName:string;
  createdAt: Date;
};
