
import React from 'react';
import { Tooltip } from './ui/Tooltip';
import { AudienceProfile as AudienceProfileType } from '../types';

interface LearnerProfileProps {
  profile: AudienceProfileType;
  onChange: (profile: AudienceProfileType) => void;
  isEditable: boolean;
}

const ProfileInput: React.FC<{
  id: keyof AudienceProfileType;
  label: string;
  tooltip: string;
  placeholder: string;
  value: string;
  onChange: (field: keyof AudienceProfileType, value: string) => void;
  isEditable: boolean;
}> = ({ id, label, tooltip, placeholder, value, onChange, isEditable }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[--color-text-muted] mb-1">{label}</label>
    <Tooltip text={tooltip}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        disabled={!isEditable}
        className="w-full bg-[--color-background-body] border border-[--color-border] rounded-md p-3 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary-focus-ring] focus:border-[--color-primary] transition duration-200 text-sm"
        rows={3}
        placeholder={placeholder}
      />
    </Tooltip>
  </div>
);

export const LearnerProfile: React.FC<LearnerProfileProps> = ({ profile, onChange, isEditable }) => {
  const handleChange = (field: keyof AudienceProfileType, value: string) => {
    onChange({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-4">
      <ProfileInput
        id="role"
        label="Audience's Role & Context"
        tooltip="Who are they? What is their job title or situation?"
        placeholder="e.g., New sales hires, first-time managers, university students."
        value={profile.role}
        onChange={handleChange}
        isEditable={isEditable}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileInput
            id="goals"
            label="Primary Goals & Motivations"
            tooltip="What do they want to achieve by completing this learning? What motivates them?"
            placeholder="e.g., 'To close deals faster', 'To lead their team more effectively.'"
            value={profile.goals}
            onChange={handleChange}
            isEditable={isEditable}
        />
        <ProfileInput
            id="painPoints"
            label="Challenges & Pain Points"
            tooltip="What problems or frustrations are they currently facing that this learning will solve?"
            placeholder="e.g., 'Struggling with the old CRM', 'Unsure how to handle difficult conversations.'"
            value={profile.painPoints}
            onChange={handleChange}
            isEditable={isEditable}
        />
        <ProfileInput
            id="priorKnowledge"
            label="Current Knowledge & Skills"
            tooltip="What do they already know about this topic? Are they novices or experts?"
            placeholder="e.g., 'Familiar with sales concepts but not our specific process', 'No prior coding experience.'"
            value={profile.priorKnowledge}
            onChange={handleChange}
            isEditable={isEditable}
        />
        <ProfileInput
            id="environment"
            label="Learning Environment"
            tooltip="Where and how will they be learning? In an office, remotely, on a mobile device?"
            placeholder="e.g., 'In a busy office with interruptions', 'Remotely on their laptop', 'On-the-go using a tablet.'"
            value={profile.environment}
            onChange={handleChange}
            isEditable={isEditable}
        />
      </div>
    </div>
  );
};
