
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isPending?: boolean;
  createdAt: Date | string;
};

export type Report = {
  id: string;
  userId: string;
  name: string;
  type: 'text' | 'image' | 'assistant';
  content?: string; // data URI for images, raw text for text files, optional for assistant
  originalText?: string;
  summary?: string;
  highlightedSummary?: string;
  chatHistory: Message[];
  createdAt: Date | string;
};

export type UserProfile = {
  uid: string;
  email: string;
  firstName: string;
  lastName:string;
  createdAt: string; 
};

export type AssistantChat = {
  userId: string;
  history: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

    