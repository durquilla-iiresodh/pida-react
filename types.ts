
export type Role = 'user' | 'model' | 'system';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Citation {
  source: string;
  quote: string;
  url?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  followUpQuestions?: string[];
  groundingSources?: GroundingSource[];
}

export interface AiResponse {
  answer: string;
  citations: Citation[];
  followUpQuestions?: string[];
  groundingSources?: GroundingSource[];
}
