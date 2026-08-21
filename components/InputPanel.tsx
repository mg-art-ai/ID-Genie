import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { INSTRUCTIONAL_MODELS, OUTPUT_TYPES, EXAMPLE_PROMPTS, LEARNING_DOMAINS } from '../constants';
import { extractTextFromDocument, recommendInstructionalModel } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import { ContextAwarenessTip } from './ContextAwarenessTip';
import { AudienceProfile as AudienceProfileType, LearningObjective, UserRole } from '../types';
import { Tooltip } from './ui/Tooltip';
import { LearnerProfile } from './LearnerProfile';

interface InputPanelProps {
  onGenerate: (data: {
    content: string;
    files: File[];
    model: string;
    outputType: string;
    objectives: LearningObjective[];
    styleGuide: string;
    audienceProfile: AudienceProfileType;
  }) => void;
  isGenerating: boolean;
  smartObjectives: LearningObjective[];
  onGenerateObjectives: (data: { 
    content: string; 
    files: File[]; 
    styleGuide: string; 
    audienceProfile: AudienceProfileType;
    numObjectives: number;
    learningDomain: string;
  }) => void;
  isGeneratingObjectives: boolean;
  styleGuide: string;
  onStyleGuideChange: (value: string) => void;
  audienceProfile: AudienceProfileType;
  onAudienceProfileChange: (value: AudienceProfileType) => void;
  currentUserRole: UserRole;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onGenerate,
  isGenerating,
  smartObjectives,
  onGenerateObjectives,
  isGeneratingObjectives,
  styleGuide,
  onStyleGuideChange,
  audienceProfile,
  onAudienceProfileChange,
  currentUserRole,
}) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState(INSTRUCTIONAL_MODELS[0].value);
  const [outputType, setOutputType] = useState(OUTPUT_TYPES[0].value);
  
  const [styleGuideFile, setStyleGuideFile] = useState<File | null>(null);
  const [isExtractingStyle, setIsExtractingStyle] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null);
  const [audienceValidationMsg, setAudienceValidationMsg] = useState<string | null>(null);

  
  const [numObjectives, setNumObjectives] = useState<number>(3);
  const [learningDomain, setLearningDomain] = useState<string>(LEARNING_DOMAINS[0].value);

  // State for AI model recommendation
  const [recommendedModel, setRecommendedModel] = useState<string | null>(null);
  const [recommendationJustification, setRecommendationJustification] = useState<string | null>(null);
  const [isRecommendingModel, setIsRecommendingModel] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const isViewer = currentUserRole === 'Viewer';

  const hasSufficientProfileData = () => {
    return Object.values(audienceProfile).some(field => typeof field === 'string' && field.trim().length > 10);
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }

    // Only trigger recommendation if there's enough content to analyze
    if (content.trim().length > 50 && hasSufficientProfileData()) {
        setIsRecommendingModel(true);
        setRecommendationJustification(null);
        
        debounceTimeoutRef.current = window.setTimeout(async () => {
            try {
                const { recommendedModel: newModel, justification } = await recommendInstructionalModel(content, audienceProfile, outputType);
                setRecommendedModel(newModel);
                setRecommendationJustification(justification);
                // Automatically select the recommended model in the dropdown
                if (INSTRUCTIONAL_MODELS.some(m => m.value === newModel)) {
                  setModel(newModel);
                }
            } catch (error) {
                console.error("Failed to get model recommendation:", error);
                setRecommendationJustification("Could not retrieve a recommendation at this time.");
            } finally {
                setIsRecommendingModel(false);
            }
        }, 1500); // 1.5-second debounce to avoid rapid API calls
    } else {
        // If content is insufficient, clear any existing recommendations
        setIsRecommendingModel(false);
        setRecommendedModel(null);
        setRecommendationJustification(null);
    }

    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, [content, audienceProfile, outputType]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleStyleGuideFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    
    setStyleGuideFile(file);
    setIsExtractingStyle(true);
    setExtractionError(null);
    setExtractionSuccess(null);
    onStyleGuideChange('');

    try {
      const extractedText = await extractTextFromDocument(file);
      onStyleGuideChange(extractedText);
      setExtractionSuccess('File processed successfully! Review the extracted text below.');
      setTimeout(() => setExtractionSuccess(null), 5000);
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to process file.');
    } finally {
      setIsExtractingStyle(false);
    }
  };

  const handleClearStyleGuideFile = () => {
    setStyleGuideFile(null);
    onStyleGuideChange('');
    setExtractionError(null);
    setExtractionSuccess(null);
    const fileInput = document.getElementById('style-guide-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };
  
  const handleGenerateObjectives = () => {
      const filledFields = Object.values(audienceProfile).filter(val => typeof val === 'string' && val.trim().length > 10).length;
      if (filledFields < 2) {
          setAudienceValidationMsg("Please fill out at least two fields in the 'Understand your Audience' section with more than 10 characters for better results.");
          return;
      }
      setAudienceValidationMsg(null);
      onGenerateObjectives({ content, files, styleGuide, audienceProfile, numObjectives, learningDomain });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ content, files, model, outputType, objectives: smartObjectives, styleGuide, audienceProfile });
  };
  
  const handleUseExample = () => {
    const example = EXAMPLE_PROMPTS[outputType];
    if (example) {
      setContent(example);
    }
  };

  const objectivesGenerated = smartObjectives.length > 0;
  const currentExample = EXAMPLE_PROMPTS[outputType];
  const selectedOutputLabel = OUTPUT_TYPES.find(o => o.value === outputType)?.label;


  return (
    <Card className="flex-1 relative">
      {isViewer && (
        <div className="absolute inset-0 bg-[--color-background-card]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <p className="text-lg font-semibold text-[--color-text-muted]">Viewing mode</p>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[--color-text-heading]">Design Process</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[--color-primary] text-[--color-text-on-primary] text-sm font-bold">1</div>
            <label className="text-md font-semibold text-[--color-text-base]">
              Understand your Audience
            </label>
          </div>
          <LearnerProfile
            profile={audienceProfile}
            onChange={onAudienceProfileChange}
            isEditable={!isViewer}
          />
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[--color-primary] text-[--color-text-on-primary] text-sm font-bold">2</div>
            <label htmlFor="content" className="text-md font-semibold text-[--color-text-base]">
              Provide Core Content
            </label>
          </div>
          <Tooltip text="Paste your content, notes, or script here. This is the primary source material for the AI.">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isViewer}
              className="w-full bg-[--color-background-body] border border-[--color-border] rounded-md p-3 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary-focus-ring] focus:border-[--color-primary] transition duration-200"
              rows={8}
              placeholder="Paste your content data dump, notes, or script here..."
            />
          </Tooltip>
        </div>

        <div>
           <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[--color-primary] text-[--color-text-on-primary] text-sm font-bold"> </div>
            <label htmlFor="file-upload" className="text-md font-semibold text-[--color-text-base]">
                Upload Source Files (Optional)
            </label>
          </div>
            <Tooltip text="Upload images, PDFs, or text documents to provide additional context to the AI.">
              <input
                  id="file-upload"
                  type="file"
                  multiple
                  disabled={isViewer}
                  onChange={handleFileChange}
                  className="w-full text-sm text-[--color-text-muted] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[--color-primary]/10 file:text-[--color-primary] hover:file:bg-[--color-primary]/20 transition-colors duration-200"
              />
            </Tooltip>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-[--color-text-base]">Selected Files:</p>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-[--color-background-body] rounded-md border border-[--color-border]">
                      <div className="flex items-center gap-2 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--color-text-muted] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z"/>
                        </svg>
                        <span className="text-sm text-[--color-text-base] truncate" title={file.name}>{file.name}</span>
                      </div>
                      <Tooltip text="Remove file">
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isViewer}
                          className="p-1 rounded-full hover:bg-[--color-border] text-[--color-text-muted] hover:text-[--color-text-heading] disabled:cursor-not-allowed"
                          aria-label={`Remove ${file.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/>
                          </svg>
                        </button>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[--color-primary] text-[--color-text-on-primary] text-sm font-bold">3</div>
                <h3 className="text-md font-semibold text-[--color-text-base]">
                    Define Style Guide (Optional)
                </h3>
            </div>
            <div>
                <label htmlFor="style-guide" className="block text-sm font-medium text-[--color-text-muted] mb-1">Style Guide</label>
                <Tooltip text="Define brand voice, tone, and formatting rules. The AI will adhere to this guide. You can also upload a document to have the AI automatically extract these rules for you.">
                  <textarea
                    id="style-guide"
                    value={styleGuide}
                    onChange={(e) => onStyleGuideChange(e.target.value)}
                    disabled={isViewer}
                    className="w-full bg-[--color-background-body] border border-[--color-border] rounded-md p-3 text-[--color-text-base] focus:ring-2 focus:ring-[--color-primary-focus-ring] focus:border-[--color-primary] transition duration-200"
                    rows={6}
                    placeholder="e.g., Tone: Professional but conversational. Use active voice. Capitalization: Title Case for headings."
                  />
                </Tooltip>
                
                <div className="mt-3">
                    <label className="block text-sm font-medium text-[--color-text-muted] mb-1">Upload Style Guide</label>
                    <div className="flex items-center gap-2">
                         <input
                            id="style-guide-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            disabled={isViewer || isExtractingStyle}
                            onChange={handleStyleGuideFileChange}
                            className="w-full text-sm text-[--color-text-muted] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[--color-primary]/10 file:text-[--color-primary] hover:file:bg-[--color-primary]/20 transition-colors duration-200"
                        />
                        {styleGuideFile && (
                            <Tooltip text="Clear uploaded file">
                                <button type="button" onClick={handleClearStyleGuideFile} className="p-1 rounded-full text-[--color-text-muted] hover:bg-[--color-border]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/></svg>
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {isExtractingStyle && <div className="mt-2 text-sm text-[--color-text-muted] flex items-center gap-2"><Spinner/> Analyzing document...</div>}
                {extractionError && <div className="mt-2 text-sm text-red-500">{extractionError}</div>}
                {extractionSuccess && <div className="mt-2 text-sm text-green-600">{extractionSuccess}</div>}

                <ContextAwarenessTip />
            </div>
        </div>

        <hr className="border-[--color-border]"/>

        <div className="space-y-8" id="generation-phase-1">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[--color-primary] text-[--color-text-on-primary] text-sm font-bold">4</div>
            <h3 className="text-md font-semibold text-[--color-text-base]">
              Define Learning Objectives
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="num-objectives" className="block text-sm font-medium text-[--color-text-muted] mb-1">Number of Terminal Objectives</label>
              <input 
                type="number"
                id="num-objectives"
                value={numObjectives}
                onChange={(e) => {
                  let value = parseInt(e.target.value, 10);
                  if (isNaN(value)) value = 1;
                  setNumObjectives(Math.max(1, Math.min(10, value)));
                }}
                min="1"
                max="10"
                disabled={isViewer}
                className="w-full bg-[--color-background-body] border border-[--color-border] rounded-md p-2 text-sm"
              />
            </div>
             <div>
                <label htmlFor="learning-domain" className="block text-sm font-medium text-[--color-text-muted] mb-1">Prioritize Learning Domain</label>
                <Select
                    id="learning-domain"
                    value={learningDomain}
                    onChange={(e) => setLearningDomain(e.target.value)}
                    options={LEARNING_DOMAINS}
                    disabled={isViewer}
                    className="w-full p-2 text-sm"
                />
            </div>
          </div>
          <div>
            <Button
              type="button"
              onClick={handleGenerateObjectives}
              isLoading={isGeneratingObjectives}
              disabled={isGeneratingObjectives || !content.trim() || isViewer}
            >
              Generate Objectives
            </Button>
            {audienceValidationMsg && (
                <p className="mt-3 text-sm text-orange-500 dark:text-orange-400 font-medium flex items-center gap-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                    </svg>
                    {audienceValidationMsg}
                </p>
            )}
          </div>
        </div>

        <hr className="border-[--color-border]"/>
        
        <div className="space-y-8" id="generation-phase-2">
            <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-colors ${objectivesGenerated ? 'bg-[--color-primary] text-[--color-text-on-primary]' : 'bg-[--color-border] text-[--color-text-muted]'}`}>5</div>
                <h3 className="text-md font-semibold text-[--color-text-base]">
                Learning Solution
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="output-type" className="block text-sm font-medium text-[--color-text-muted] mb-1">Output Type</label>
                  <Select
                      id="output-type"
                      value={outputType}
                      onChange={(e) => setOutputType(e.target.value)}
                      options={OUTPUT_TYPES}
                      disabled={isViewer}
                      className="w-full p-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-[--color-text-muted] mb-1">Instructional Model</label>
                  <Select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      options={INSTRUCTIONAL_MODELS}
                      disabled={isViewer}
                      className="w-full p-2 text-sm"
                  />
                </div>
            </div>
            
             {(isRecommendingModel || recommendationJustification) && (
                <div className="mt-2 p-3 bg-[--color-background-body] rounded-lg border border-[--color-border] flex items-start gap-3 transition-opacity duration-300">
                    <div className="flex-shrink-0 mt-0.5">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--color-secondary-accent]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 9a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 14 9a2.5 2.5 0 0 0 2.5 2.5A2.5 2.5 0 0 0 19 9ZM12 4.47l.94-2.01.94 2.01L15.94 5l-2.01.94L13 7.88l-.94-2.01L11.12 5l2.01-.94.94-2.01ZM19 15a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 14 15a2.5 2.5 0 0 0 2.5 2.5A2.5 2.5 0 0 0 19 15ZM9 14l-4-9-4 9h8Zm-4-2q-1.25 0-2.125-.875T2 9q0-1.25.875-2.125T5 6q1.25 0 2.125.875T8 9q0 1.25-.875 2.125T5 12Z"/>
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[--color-text-base]">Genie's Recommendation</h4>
                        {isRecommendingModel ? (
                            <div className="flex items-center gap-2 text-sm text-[--color-text-muted]">
                                <Spinner /> Analyzing content to suggest the best model...
                            </div>
                        ) : (
                            <p className="text-sm text-[--color-text-muted]">
                                Based on your input, the recommended model is <strong className="text-[--color-primary]">{INSTRUCTIONAL_MODELS.find(m => m.value === recommendedModel)?.label || recommendedModel}</strong>.
                                <br />
                                <em className="italic">{recommendationJustification}</em>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {currentExample && (
            <div className="text-center">
                <Button type="button" onClick={handleUseExample} className="w-auto bg-[--color-primary]/10 hover:bg-[--color-primary]/20 text-[--color-primary] font-semibold py-2 px-4 text-sm">
                Use Example for "{selectedOutputLabel}"
                </Button>
            </div>
            )}
            
            <Button
                type="submit"
                isLoading={isGenerating}
                disabled={isGenerating || smartObjectives.length === 0 || isViewer}
            >
                Generate Instructional Design
            </Button>
        </div>
      </form>
    </Card>
  );
};