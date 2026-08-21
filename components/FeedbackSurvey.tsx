import React, { useState } from 'react';
import { Button } from './ui/Button';

interface FeedbackSurveyProps {
  onFeedback: (rating: 'positive' | 'negative') => void;
}

export const FeedbackSurvey: React.FC<FeedbackSurveyProps> = ({ onFeedback }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (rating: 'positive' | 'negative') => {
    onFeedback(rating);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mt-8 text-center p-4 bg-[--color-background-body] rounded-lg border border-[--color-border]">
        <p className="font-semibold text-[--color-text-base]">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 text-center p-4 bg-[--color-background-body] rounded-lg border border-[--color-border]">
      <p className="font-semibold text-[--color-text-base] mb-3">Was this output helpful?</p>
      <div className="flex justify-center gap-4">
        <Button
          type="button"
          onClick={() => handleSubmit('positive')}
          className="w-auto bg-transparent hover:bg-[--color-border] border border-green-500/50 hover:border-green-500 text-green-600 dark:text-green-400 font-semibold py-2 px-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12ZM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2Z"/>
          </svg>
          Yes
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('negative')}
          className="w-auto bg-transparent hover:bg-[--color-border] border border-red-500/50 hover:border-red-500 text-red-600 dark:text-red-400 font-semibold py-2 px-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2Zm4 0v12h4V3h-4Z"/>
          </svg>
          No
        </Button>
      </div>
    </div>
  );
};