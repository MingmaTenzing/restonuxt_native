export type ChatRole = 'assistant' | 'user';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type RestoAgentRequest = {
  messages: ChatMessage[];
};
