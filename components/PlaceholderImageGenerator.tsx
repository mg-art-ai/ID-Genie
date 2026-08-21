import React, { useState } from 'react';
import { generatePlaceholderImage } from '../services/geminiService';
import { Spinner } from './ui/Spinner';

interface PlaceholderImageGeneratorProps {
  prompt: string;
}

export const PlaceholderImageGenerator: React.FC<PlaceholderImageGeneratorProps> = ({ prompt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await generatePlaceholderImage(prompt);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4 p-4 border border-dashed border-[--color-border] rounded-lg bg-[--color-background-body]">
      <p className="text-sm text-[--color-text-muted] mb-3">
        <strong className="text-[--color-text-base]">Suggested Visual:</strong> {prompt}
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-[--color-background-card] rounded-md">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded-md">{error}</div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={prompt} className="w-full h-auto rounded-md border border-[--color-border]" />
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-transparent hover:bg-[--color-border] disabled:opacity-60 text-[--color-secondary-accent] font-semibold py-2 px-4 rounded-md border border-[--color-secondary-accent]/50 hover:border-[--color-secondary-accent]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-background-body] focus:ring-[--color-secondary-accent] transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2ZM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5Z"/>
          </svg>
          Generate Placeholder
        </button>
      )}
    </div>
  );
};