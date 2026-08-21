import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { marked } from 'marked';
import { Button } from './ui/Button';
import { rephraseObjective, suggestEnablingObjectiveEdits, rephraseAllEnablingObjectives } from '../services/geminiService';
import { Tooltip } from './ui/Tooltip';
import { LearningObjective, UserRole } from '../types';
import { BLOOMS_TAXONOMY_VERBS } from '../constants';
import { PlaceholderImageGenerator } from './PlaceholderImageGenerator';
import { FeedbackSurvey } from './FeedbackSurvey';

interface OutputPanelProps {
  objectives: LearningObjective[];
  generatedDesign: string;
  isGeneratingObjectives: boolean;
  isGeneratingDesign: boolean;
  error: string | null;
  designHistory: string[];
  activeVersionIndex: number;
  onRevertToVersion: (index: number) => void;
  onUpdateObjective: (terminalIndex: number, enablingIndex: number | null, newText: string) => void;
  styleGuide: string;
  onRegenerateWithFeedback: (feedback: string) => void;
  onClearAndRegenerate: () => void;
  currentUserRole: UserRole;
  feedbackGiven: Set<string>;
  onDesignFeedback: (rating: 'positive' | 'negative', designContent: string) => void;
}

// Helper component for the status icon in the progress indicator
const StatusIcon: React.FC<{ status: 'active' | 'complete' | 'pending'; step: number }> = ({ status, step }) => {
  if (status === 'active') {
    return (
      <div className="h-6 w-6 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (status === 'complete') {
    return (
      <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[--color-primary]">
        <svg className="h-4 w-4 text-[--color-text-on-primary]" fill="currentColor" viewBox="0 0 24 24">
          <path d="m9.55 18-5.7-5.7 1.4-1.4 4.3 4.3 9.3-9.3 1.4 1.4-10.7 10.7Z"/>
        </svg>
      </div>
    );
  }
  // Pending status
  return (
    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[--color-border] text-[--color-text-muted] font-semibold text-sm">
      {step}
    </div>
  );
};

// Helper component for the visual progress indicator
const ProgressIndicator: React.FC<{
  isGeneratingObjectives: boolean;
  isGeneratingDesign: boolean;
}> = ({ isGeneratingObjectives, isGeneratingDesign }) => {
  type Status = 'active' | 'complete' | 'pending';

  const getStatuses = (): [Status, Status] => {
    if (isGeneratingObjectives) {
      return ['active', 'pending'];
    }
    if (isGeneratingDesign) {
      return ['complete', 'active'];
    }
    // This case should not be reached if the component is used correctly
    return ['pending', 'pending'];
  };

  const [step1Status, step2Status] = getStatuses();
  
  const step1TextColor = step1Status === 'pending' ? 'text-[--color-text-muted]' : 'text-[--color-text-heading]';
  const step2TextColor = step2Status === 'pending' ? 'text-[--color-text-muted]' : 'text-[--color-text-heading]';

  return (
     <div className="flex-1 flex flex-col items-center justify-center text-[--color-text-muted] w-full py-8">
      <div className="w-full max-w-sm p-4">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[--color-border]" aria-hidden="true"></div>
          <ul className="space-y-10">
            <li className="relative flex items-center">
              <div className="z-10 bg-[--color-background-card] pr-4">
                <StatusIcon status={step1Status} step={1} />
              </div>
              <div className="ml-4">
                <p className={`font-semibold transition-colors duration-300 ${step1TextColor}`}>
                  Generating SMART Objectives
                </p>
                {step1Status === 'active' && <p className="text-sm text-[--color-text-muted]">The genie is analyzing the content...</p>}
              </div>
            </li>
            <li className="relative flex items-center">
               <div className="z-10 bg-[--color-background-card] pr-4">
                <StatusIcon status={step2Status} step={2} />
              </div>
              <div className="ml-4">
                <p className={`font-semibold transition-colors duration-300 ${step2TextColor}`}>
                  Generating Instructional Design
                </p>
                {step2Status === 'active' && <p className="text-sm text-[--color-text-muted]">Applying instructional models...</p>}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const ObjectiveItem: React.FC<{
  objective: string;
  terminalIndex: number;
  enablingIndex: number | null;
  onUpdate: (terminalIndex: number, enablingIndex: number | null, newText: string) => void;
  styleGuide: string;
  isEditable: boolean;
  onTerminalSave?: (terminalIndex: number, newText: string) => void;
  isSuggesting?: boolean;
}> = ({ objective, terminalIndex, enablingIndex, onUpdate, styleGuide, isEditable, onTerminalSave, isSuggesting }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(objective);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRephrasing, setIsRephrasing] = useState(false);

  useEffect(() => {
    setEditText(objective);
  }, [objective]);

  const handleSave = () => {
    onUpdate(terminalIndex, enablingIndex, editText);
    if (enablingIndex === null && onTerminalSave) {
      onTerminalSave(terminalIndex, editText);
    }
    setIsEditing(false);
    setSuggestions([]);
  };

  const handleRephrase = async () => {
    setIsRephrasing(true);
    setSuggestions([]);
    try {
      const result = await rephraseObjective(editText, styleGuide);
      setSuggestions(result);
    } catch (e) {
      console.error("Failed to rephrase", e);
    } finally {
      setIsRephrasing(false);
    }
  };

  const highlightedText = useMemo(() => {
    const allVerbs = Object.values(BLOOMS_TAXONOMY_VERBS).flat();
    const regex = new RegExp(`\\b(${allVerbs.join('|')})\\b`, 'gi');
    return objective.replace(regex, (match) => `<strong class="text-[--color-secondary-accent]">${match}</strong>`);
  }, [objective]);

  if (isEditing) {
    return (
      <div className="p-3 bg-[--color-background-body] rounded-lg">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full bg-[--color-background-card] border border-[--color-border] rounded-md p-2 text-[--color-text-base] text-sm"
          rows={3}
        />
        {isRephrasing && <div className="text-sm text-[--color-text-muted] my-2 flex items-center gap-2"><Spinner/> Finding better phrasings...</div>}
        {suggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold text-[--color-text-muted]">Suggestions:</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setEditText(s)}
                className="w-full text-left text-sm p-2 bg-[--color-background-card] hover:bg-[--color-border] rounded-md"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button type="button" onClick={handleRephrase} disabled={isRephrasing} className="w-auto py-1 px-3 text-sm">
            {isRephrasing ? 'Rephrasing...' : 'Rephrase'}
          </Button>
          <button type="button" onClick={() => setIsEditing(false)} className="text-sm text-[--color-text-muted] hover:text-[--color-text-base]">Cancel</button>
          <button type="button" onClick={handleSave} className="text-sm font-semibold text-[--color-primary] hover:text-[--color-primary-hover]">Save</button>
        </div>
      </div>
    );
  }

  const paddingClass = enablingIndex === null ? 'p-3' : 'py-2 pl-3 pr-2';

  return (
    <div className={`group flex justify-between items-start gap-2 hover:bg-[--color-background-body] rounded-lg transition-colors ${paddingClass}`}>
      <p className="flex-1 text-sm text-[--color-text-base] leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightedText }} />
      <div className="flex-shrink-0 mt-1">
        {isSuggesting && <Spinner />}
        {isEditable && !isSuggesting &&
          <Tooltip text="Edit Objective">
            <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[--color-text-muted]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/>
              </svg>
            </button>
          </Tooltip>
        }
      </div>
    </div>
  );
};

const FeedbackAndRegeneration: React.FC<{
  onRegenerate: (feedback: string) => void;
  isGenerating: boolean;
  isEditable: boolean;
}> = ({ onRegenerate, isGenerating, isEditable }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (feedback.trim()) {
      onRegenerate(feedback);
      setFeedback('');
    }
  };

  return (
    <div className="p-1">
      <h3 className="text-base font-semibold text-[--color-text-heading] mb-2">Provide feedback to improve the design.</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={!isEditable}
        className="w-full bg-[--color-background-body] border border-[--color-border] rounded-md p-3 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary-focus-ring] focus:border-[--color-primary] transition duration-200"
        rows={4}
        placeholder={isEditable ? "e.g., 'Make the tone more conversational,' or 'Add a practical example for slide 3.'" : "Feedback input is disabled in Viewer mode."}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        isLoading={isGenerating}
        disabled={!feedback.trim() || isGenerating || !isEditable}
        className="mt-3"
      >
        Regenerate with Feedback
      </Button>
    </div>
  );
};

const VersionHistory: React.FC<{
  history: string[];
  activeIndex: number;
  onRevert: (index: number) => void;
  isEditable: boolean;
}> = ({ history, activeIndex, onRevert, isEditable }) => {
  if (history.length <= 1) return (
    <div className="p-1 text-center text-sm text-[--color-text-muted]">
        No other versions available. Regenerate with feedback to create new versions.
    </div>
  );

  return (
    <div className="p-1">
      <h3 className="text-base font-semibold text-[--color-text-heading] mb-3">Available Versions</h3>
      <div className="flex flex-wrap gap-2">
        {history.map((_, index) => (
          <Tooltip key={index} text={`Revert to Version ${history.length - index}`}>
            <button
              onClick={() => onRevert(index)}
              disabled={!isEditable}
              className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                index === activeIndex
                  ? 'bg-[--color-primary] text-[--color-text-on-primary] font-bold'
                  : 'bg-[--color-background-card] hover:bg-[--color-border] text-[--color-text-muted] disabled:bg-[--color-background-body] disabled:cursor-not-allowed border border-[--color-border]'
              }`}
            >
              V{history.length - index}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};


export const OutputPanel: React.FC<OutputPanelProps> = ({
  objectives,
  generatedDesign,
  isGeneratingObjectives,
  isGeneratingDesign,
  error,
  designHistory,
  activeVersionIndex,
  onRevertToVersion,
  onUpdateObjective,
  styleGuide,
  onRegenerateWithFeedback,
  onClearAndRegenerate,
  currentUserRole,
  feedbackGiven,
  onDesignFeedback,
}) => {
  const isGenerating = isGeneratingObjectives || isGeneratingDesign;
  const showPlaceholder = !isGenerating && objectives.length === 0 && !generatedDesign && !error;
  const showObjectives = !isGenerating && objectives.length > 0 && !generatedDesign;
  const showDesign = !isGenerating && generatedDesign;
  const isEditable = currentUserRole !== 'Viewer';
  const [activeTab, setActiveTab] = useState<'design' | 'refine' | 'history'>('design');

  const [isSuggestingEdits, setIsSuggestingEdits] = useState<Record<number, boolean>>({});
  const [editSuggestions, setEditSuggestions] = useState<{ terminalIndex: number; suggestions: string[] } | null>(null);

  const [isRephrasingAll, setIsRephrasingAll] = useState<Record<number, boolean>>({});
  const [rephraseAllSuggestions, setRephraseAllSuggestions] = useState<{ terminalIndex: number; suggestions: string[] } | null>(null);

  const placeholderRoots = useRef<any[]>([]);

  const [copiedState, setCopiedState] = useState<string | null>(null);

  const designHtml = useMemo(() => {
    if (!generatedDesign) return '';
    try {
      const rawHtml = marked.parse(generatedDesign, { gfm: true, breaks: true });
      // Replace placeholders with a div container for React to mount into
      const processedHtml = rawHtml.replace(
        /\[(Image|Visual|Graphic|Placeholder): (.*?)\]/gi,
        '<div class="placeholder-image-container" data-prompt="$2"></div>'
      );
      return processedHtml;
    } catch (e) {
      console.error("Markdown parsing error:", e);
      return `<p>Error rendering content. Please check the generated text.</p>`;
    }
  }, [generatedDesign]);

  const formattedObjectives = useMemo(() => {
    return objectives.map((obj, index) => {
        const enablers = obj.enabling.map(e => `  - ${e}`).join('\n');
        return `Terminal Objective ${index + 1}: ${obj.terminal}\nEnabling Objectives:\n${enablers}`;
    }).join('\n\n');
  }, [objectives]);

  useEffect(() => {
    // When a new design is generated, switch back to the main design tab
    if (generatedDesign) {
        setActiveTab('design');
    }
  }, [generatedDesign]);

  useEffect(() => {
    const cleanup = () => {
        placeholderRoots.current.forEach(root => root.unmount());
        placeholderRoots.current = [];
    };
    cleanup();

    if (showDesign && activeTab === 'design') {
        const containers = document.querySelectorAll('.placeholder-image-container');
        containers.forEach(container => {
            const prompt = (container as HTMLElement).dataset.prompt;
            if (prompt) {
                const root = ReactDOM.createRoot(container);
                placeholderRoots.current.push(root);
                root.render(<PlaceholderImageGenerator prompt={prompt} />);
            }
        });
    }

    return cleanup;
  }, [designHtml, showDesign, activeTab]);

  const handleTerminalSave = async (terminalIndex: number, newText: string) => {
    setIsSuggestingEdits(prev => ({ ...prev, [terminalIndex]: true }));
    try {
        const currentEnabling = objectives[terminalIndex].enabling;
        const suggestions = await suggestEnablingObjectiveEdits(newText, currentEnabling, styleGuide);
        if (suggestions && suggestions.length === currentEnabling.length) {
            setEditSuggestions({ terminalIndex, suggestions });
        }
    } catch (e) {
        console.error("Failed to get suggestions", e);
    } finally {
        setIsSuggestingEdits(prev => ({ ...prev, [terminalIndex]: false }));
    }
  };

  const handleRephraseAll = async (terminalIndex: number) => {
      setIsRephrasingAll(prev => ({ ...prev, [terminalIndex]: true }));
      try {
          const terminalObjective = objectives[terminalIndex].terminal;
          const enablingObjectives = objectives[terminalIndex].enabling;
          const suggestions = await rephraseAllEnablingObjectives(terminalObjective, enablingObjectives, styleGuide);
          if (suggestions && suggestions.length === enablingObjectives.length) {
              setRephraseAllSuggestions({ terminalIndex, suggestions });
          }
      } catch (e) {
          console.error("Failed to rephrase all", e);
      } finally {
          setIsRephrasingAll(prev => ({ ...prev, [terminalIndex]: false }));
      }
  };

  const applyEditSuggestions = () => {
      if (!editSuggestions) return;
      const { terminalIndex, suggestions } = editSuggestions;
      suggestions.forEach((suggestion, enIndex) => {
          onUpdateObjective(terminalIndex, enIndex, suggestion);
      });
      setEditSuggestions(null);
  };

  const applyRephraseAllSuggestions = () => {
      if (!rephraseAllSuggestions) return;
      const { terminalIndex, suggestions } = rephraseAllSuggestions;
      suggestions.forEach((suggestion, enIndex) => {
          onUpdateObjective(terminalIndex, enIndex, suggestion);
      });
      setRephraseAllSuggestions(null);
  };
  
  const SuggestionModal: React.FC<{
    title: string;
    originalObjectives: string[];
    suggestedObjectives: string[];
    onApply: () => void;
    onDismiss: () => void;
  }> = ({ title, originalObjectives, suggestedObjectives, onApply, onDismiss }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onDismiss}>
        <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-[--color-text-heading] mb-4 flex-shrink-0">{title}</h3>
          <div className="overflow-y-auto pr-2 -mr-2 space-y-4 flex-grow">
            {originalObjectives.map((original, index) => (
              <div key={index} className="p-3 bg-[--color-background-body] rounded-lg border border-[--color-border]">
                <p className="text-xs font-semibold text-[--color-text-muted] mb-1">ORIGINAL</p>
                <p className="text-sm text-[--color-text-muted] line-through">{original}</p>
                <p className="text-xs font-semibold text-[--color-primary] mt-2 mb-1">SUGGESTED</p>
                <p className="text-sm text-[--color-text-base]">{suggestedObjectives[index]}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[--color-border] flex-shrink-0">
            <Button type="button" onClick={onDismiss} className="w-auto py-2 px-4 bg-transparent text-[--color-text-base] hover:bg-[--color-border] border border-[--color-border]">
              Cancel
            </Button>
            <Button type="button" onClick={onApply} className="w-auto py-2 px-4">
              Apply Suggestions
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const handleCopy = async (type: 'design-formatted' | 'design-html' | 'design-plain' | 'objectives-plain') => {
    if (copiedState) return;

    try {
      if (type === 'design-formatted') {
        const htmlBlob = new Blob([designHtml], { type: 'text/html' });
        const textBlob = new Blob([generatedDesign], { type: 'text/plain' });
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        // @ts-ignore
        await navigator.clipboard.write([clipboardItem]);
      } else if (type === 'design-html') {
        await navigator.clipboard.writeText(designHtml);
      } else if (type === 'design-plain') {
        await navigator.clipboard.writeText(generatedDesign);
      } else if (type === 'objectives-plain') {
        await navigator.clipboard.writeText(formattedObjectives);
      }
      setCopiedState(type);
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error(`Failed to copy ${type}:`, err);
      alert(`Could not copy to clipboard. Your browser might not support this feature.`);
    }
  };

  const handleClearAndRegenerateClick = () => {
    if (window.confirm('Are you sure you want to clear this output and generate a new version?')) {
      onClearAndRegenerate();
    }
  };

  const ActionButton: React.FC<{
      tooltip: string;
      onClick: () => void;
      'aria-label': string;
      children: React.ReactNode;
      disabled?: boolean;
  }> = ({ tooltip, children, ...props }) => (
    <Tooltip text={tooltip}>
        <button
            {...props}
            className="p-2 rounded-full text-[--color-text-muted] hover:bg-[--color-border] hover:text-[--color-text-heading] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {children}
        </button>
    </Tooltip>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--color-primary]" viewBox="0 0 24 24" fill="currentColor">
        <path d="m9.55 18-5.7-5.7 1.4-1.4 4.3 4.3 9.3-9.3 1.4 1.4-10.7 10.7Z"/>
    </svg>
  );

  const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[--color-primary-focus-ring] rounded-t-md ${
        isActive
          ? 'border-[--color-primary] text-[--color-primary]'
          : 'border-transparent text-[--color-text-muted] hover:text-[--color-text-base] hover:border-[--color-border]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <Card className="min-h-[60vh] flex flex-col">
      <h2 className="text-2xl font-bold text-[--color-text-heading] mb-6">Generated Output</h2>
      
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/>
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-red-600 dark:text-red-400">An Error Occurred</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 max-w-md">{error}</p>
        </div>
      )}

      {showPlaceholder && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[--color-text-muted] p-8 border-2 border-dashed border-[--color-border] rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 22q-.825 0-1.412-.587Q6 20.825 6 20h2v-2H3q-.425 0-.712-.287Q2 17.425 2 17q0-.425.288-.713Q2.575 16 3 16h1v-1.5q0-2.275 1.3-4.137Q6.6 8.5 8.925 7.6L9.6 4.925Q9.85 4 10.513 3.5Q11.175 3 12 3q.825 0 1.488.5q.662.5.912 1.425L15.05 7.6q2.325.9 3.625 2.763Q20 12.225 20 14.5V16h1q.425 0 .713.287Q22 16.575 22 17q0 .425-.287.713Q21.425 18 21 18h-5v2h2q.825 0 1.413.587Q20 21.175 20 22q0 .825-.587 1.413Q18.825 24 18 24H8Zm8-14.7-1.425-.525L12 5l-2.575 1.775L8 7.3V10h8V7.3ZM4 12h16v2.5q0-.775-.425-1.425Q19.15 12.425 18.5 12H18v-2h-2v2h-2v-2H8v2H6v-2H4v2Z"/>
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-[--color-text-heading]">Ready for Magic</h3>
          <p className="mt-1 max-w-sm">Complete the steps in the input panel to generate your instructional design.</p>
        </div>
      )}

      {isGenerating && (
        <ProgressIndicator
          isGeneratingObjectives={isGeneratingObjectives}
          isGeneratingDesign={isGeneratingDesign}
        />
      )}

      {showObjectives && (
        <div>
           <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-[--color-text-heading]">Generated Learning Objectives</h3>
            <Tooltip text="Copy objectives as plain text">
              <button
                onClick={() => handleCopy('objectives-plain')}
                aria-label="Copy objectives to clipboard"
                className="p-2 rounded-full text-[--color-text-muted] hover:bg-[--color-border] hover:text-[--color-text-heading] transition-colors"
              >
                {copiedState === 'objectives-plain' ? <CheckIcon/> : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/>
                  </svg>
                )}
              </button>
            </Tooltip>
          </div>
          <p className="text-sm text-[--color-text-muted] mb-4">Review, edit, or rephrase the objectives below. When you're ready, select your desired output and click "Generate Design".</p>
          <div className="space-y-6">
            {objectives.map((obj, termIndex) => (
                <div key={termIndex} className="p-4 bg-[--color-background-body] rounded-lg border border-[--color-border]">
                    <h4 className="font-bold text-md text-[--color-text-heading] mb-1">Terminal Objective {termIndex + 1}</h4>
                    <ObjectiveItem 
                        objective={obj.terminal} 
                        terminalIndex={termIndex}
                        enablingIndex={null}
                        onUpdate={onUpdateObjective}
                        styleGuide={styleGuide}
                        isEditable={isEditable}
                        onTerminalSave={handleTerminalSave}
                        isSuggesting={isSuggestingEdits[termIndex]}
                    />
                     <div className="flex justify-between items-center mt-4 mb-2 ml-4">
                        <h5 className="font-semibold text-sm text-[--color-text-muted]">Enabling Objectives:</h5>
                        {isEditable && (
                            <Tooltip text="Rephrase all enabling objectives below for clarity and conciseness.">
                                <Button
                                    type="button"
                                    onClick={() => handleRephraseAll(termIndex)}
                                    isLoading={isRephrasingAll[termIndex]}
                                    disabled={isRephrasingAll[termIndex]}
                                    className="w-auto py-1 px-3 text-xs"
                                >
                                    Rephrase All
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                    <ul className="space-y-1 pl-4 border-l-2 border-[--color-border] ml-4">
                        {obj.enabling.map((enablingObj, enIndex) => (
                        <li key={enIndex}>
                            <ObjectiveItem 
                                objective={enablingObj}
                                terminalIndex={termIndex}
                                enablingIndex={enIndex}
                                onUpdate={onUpdateObjective}
                                styleGuide={styleGuide}
                                isEditable={isEditable}
                            />
                        </li>
                        ))}
                    </ul>
                </div>
            ))}
          </div>
        </div>
      )}

      {showDesign && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-[--color-text-heading]">Instructional Design Document</h3>
            <div className="flex items-center gap-1">
                <ActionButton
                  tooltip="Clear and Recreate"
                  onClick={handleClearAndRegenerateClick}
                  aria-label="Clear output and generate a new version"
                  disabled={!isEditable}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.2 2.8c-.5-.5-1.3-.5-1.8 0L3 18.4V21h2.6l15.6-15.6c.5-.5.5-1.3 0-1.8l-1.6-1.8ZM7 19H5v-2l9.6-9.6 2 2L7 19ZM16 3.4 12 7.4l-2-2 4-4 2 2ZM22 12l-4.5 2L15 18.5l-2-4.5L7.5 12l4.5-2L14 5.5l2 4.5L20.5 12Z"/>
                  </svg>
                </ActionButton>
               <ActionButton
                  tooltip={copiedState === 'design-formatted' ? 'Copied!' : 'Copy Formatted (Rich Text)'}
                  onClick={() => handleCopy('design-formatted')}
                  aria-label="Copy as formatted text"
                >
                  {copiedState === 'design-formatted' ? <CheckIcon/> : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-5 14H7v-2h7v2Zm3-4H7v-2h10v2Zm0-4H7V7h10v2Z"/>
                    </svg>
                  )}
               </ActionButton>
               <ActionButton
                  tooltip={copiedState === 'design-html' ? 'Copied!' : 'Copy HTML Source'}
                  onClick={() => handleCopy('design-html')}
                  aria-label="Copy HTML source code"
                >
                  {copiedState === 'design-html' ? <CheckIcon/> : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z"/>
                    </svg>
                  )}
               </ActionButton>
                <ActionButton
                  tooltip={copiedState === 'design-plain' ? 'Copied!' : 'Copy Plain Text'}
                  onClick={() => handleCopy('design-plain')}
                  aria-label="Copy to clipboard"
                >
                  {copiedState === 'design-plain' ? <CheckIcon/> : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/>
                    </svg>
                  )}
                </ActionButton>
            </div>
          </div>
            
          <div className="border-b border-[--color-border] mb-4">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <TabButton isActive={activeTab === 'design'} onClick={() => setActiveTab('design')}>
                    Generated Design
                </TabButton>
                 <TabButton isActive={activeTab === 'refine'} onClick={() => setActiveTab('refine')}>
                    Refine & Improve
                </TabButton>
                <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                    Version History
                </TabButton>
              </nav>
          </div>

          <div className="mt-4 min-h-[300px]">
            {activeTab === 'design' && (
                <div
                    className="prose max-w-none generated-output-container"
                    dangerouslySetInnerHTML={{ __html: designHtml }}
                />
            )}
            {activeTab === 'refine' && (
                 <FeedbackAndRegeneration
                    onRegenerate={onRegenerateWithFeedback}
                    isGenerating={isGeneratingDesign}
                    isEditable={isEditable}
                />
            )}
            {activeTab === 'history' && (
                <VersionHistory 
                    history={designHistory}
                    activeIndex={activeVersionIndex}
                    onRevert={onRevertToVersion}
                    isEditable={isEditable}
                />
            )}
          </div>
          
          {isEditable && !feedbackGiven.has(generatedDesign) && (
            <FeedbackSurvey 
              onFeedback={(rating) => onDesignFeedback(rating, generatedDesign)}
            />
          )}
        </>
      )}
      
      {editSuggestions && (
          <SuggestionModal
              title="Suggested Edits for Enabling Objectives"
              originalObjectives={objectives[editSuggestions.terminalIndex].enabling}
              suggestedObjectives={editSuggestions.suggestions}
              onApply={applyEditSuggestions}
              onDismiss={() => setEditSuggestions(null)}
          />
      )}

      {rephraseAllSuggestions && (
          <SuggestionModal
              title="Rephrased Enabling Objectives"
              originalObjectives={objectives[rephraseAllSuggestions.terminalIndex].enabling}
              suggestedObjectives={rephraseAllSuggestions.suggestions}
              onApply={applyRephraseAllSuggestions}
              onDismiss={() => setRephraseAllSuggestions(null)}
          />
      )}
    </Card>
  );
};