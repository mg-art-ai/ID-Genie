
export interface SelectOption {
  value: string;
  label: string;
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export interface LearningObjective {
  terminal: string;
  enabling: string[];
}

export interface AudienceProfile {
  role: string;
  goals: string;
  painPoints: string;
  priorKnowledge: string;
  environment: string;
}
