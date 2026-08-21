
import React from 'react';

export const ContextAwarenessTip: React.FC = () => {
  return (
    <div className="mt-2 text-xs text-[--color-text-muted] bg-[--color-background-card] p-3 rounded-md border border-[--color-border] flex items-start gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[--color-primary] mt-0.5 flex-shrink-0">
        <path d="M11 7h2v2h-2V7Zm0 4h2v6h-2v-6Zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Z"/>
      </svg>
      <div>
        <p className="font-semibold text-[--color-text-base]">Context-Aware Generation</p>
        <p className="text-[--color-text-muted]">The genie remembers your style guides and past generations to provide more consistent, personalized results over time.</p>
      </div>
    </div>
  );
};