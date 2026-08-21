
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateInstructionalDesign, generateSmartObjectives } from './services/geminiService';
import { COLOR_THEMES } from './constants';
import { addVectorEntry, findMostRelevantEntries } from './services/vectorService';
import { LearningObjective, UserRole, AudienceProfile } from './types';

interface GenerationParams {
  content: string;
  files: File[];
  model: string;
  outputType: string;
  objectives: LearningObjective[];
  styleGuide: string;
  audienceProfile: AudienceProfile;
}

const initialAudienceProfile: AudienceProfile = {
  role: '',
  goals: '',
  painPoints: '',
  priorKnowledge: '',
  environment: '',
};

const App: React.FC = () => {
  const [smartObjectives, setSmartObjectives] = useState<LearningObjective[]>([]);
  const [generatedDesign, setGeneratedDesign] = useState<string>('');
  const [designHistory, setDesignHistory] = useState<string[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(0);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState<boolean>(false);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [styleGuide, setStyleGuide] = useState<string>('');
  const [audienceProfile, setAudienceProfile] = useState<AudienceProfile>(initialAudienceProfile);
  const [lastGenerationParams, setLastGenerationParams] = useState<GenerationParams | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [theme, setTheme] = useState<string>(COLOR_THEMES[0].value);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());


  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(themeMode === 'light' ? 'dark' : 'light');
    root.classList.add(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const body = window.document.body;
    // Remove any existing theme classes
    COLOR_THEMES.forEach(t => body.classList.remove(t.value));
    // Add the new theme class
    body.classList.add(theme);
  }, [theme]);


  const handleGenerateObjectives = async ({
    content,
    files,
    styleGuide,
    audienceProfile,
    numObjectives,
    learningDomain,
  }: {
    content: string;
    files: File[];
    styleGuide: string;
    audienceProfile: AudienceProfile;
    numObjectives: number;
    learningDomain: string;
  }) => {
    setIsGeneratingObjectives(true);
    setError(null);
    setSmartObjectives([]);
    setGeneratedDesign('');
    setDesignHistory([]);
    setActiveVersionIndex(0);
    setLastGenerationParams(null);

    try {
      const rawObjectives = await generateSmartObjectives(content, files, styleGuide, audienceProfile, numObjectives, learningDomain);
      
      // Sanitize and validate the data from the API to prevent crashes
      const sanitizedObjectives = (rawObjectives || [])
        .map(obj => ({
          terminal: obj.terminal || '', // Ensure terminal is a non-null string
          enabling: Array.isArray(obj.enabling) ? obj.enabling : [], // Ensure enabling is an array
        }))
        .filter(obj => obj.terminal); // Filter out any objectives that are completely malformed

      setSmartObjectives(sanitizedObjectives);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred while generating objectives.');
    } finally {
      setIsGeneratingObjectives(false);
    }
  };

  const handleGenerateDesign = async ({
    content,
    files,
    model,
    outputType,
    objectives,
    styleGuide,
    audienceProfile,
  }: GenerationParams) => {
    setIsGeneratingDesign(true);
    setError(null);

    try {
      // 1. Add current style guide to vector store (if not empty)
      addVectorEntry(styleGuide, 'style-guide');

      // 2. Find relevant context from vector store
      const objectivesText = objectives.map(o => `Terminal: ${o.terminal}\n${o.enabling.map(e => `Enabling: ${e}`).join('\n')}`).join('\n\n');
      const queryForContext = `Content: ${content}\nObjectives: ${objectivesText}\nAudience: ${JSON.stringify(audienceProfile)}`;
      const relevantEntries = findMostRelevantEntries(queryForContext, 2);
      let contextualExamples = '';
      if (relevantEntries.length > 0) {
        contextualExamples = relevantEntries.map(entry => 
          `--- BEGIN EXAMPLE (${entry.type}) ---\n${entry.text}\n--- END EXAMPLE ---`
        ).join('\n\n');
      }

      // 3. Generate the design with the added context
      const design = await generateInstructionalDesign(
        content,
        files,
        model,
        outputType,
        objectives,
        styleGuide,
        audienceProfile,
        undefined, // No feedback on initial generation
        contextualExamples // Pass the new context
      );

      // 4. Add the successful new design to the vector store
      addVectorEntry(design, 'design');

      const newHistory = [design, ...designHistory];
      setDesignHistory(newHistory);
      setGeneratedDesign(design);
      setActiveVersionIndex(0);
      setLastGenerationParams({ content, files, model, outputType, objectives, styleGuide, audienceProfile });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred while generating the design.');
    } finally {
      setIsGeneratingDesign(false);
    }
  };
  
  const handleRegenerateWithFeedback = async (feedback: string) => {
    if (!lastGenerationParams) {
      setError("Cannot regenerate. Please generate a design first.");
      return;
    }

    setIsGeneratingDesign(true);
    setError(null);

    try {
      // Also add context to regeneration
      const { content, objectives, audienceProfile } = lastGenerationParams;
      const objectivesText = objectives.map(o => `Terminal: ${o.terminal}\n${o.enabling.map(e => `Enabling: ${e}`).join('\n')}`).join('\n\n');
      const queryForContext = `Content: ${content}\nObjectives: ${objectivesText}\nAudience: ${JSON.stringify(audienceProfile)}`;
      const relevantEntries = findMostRelevantEntries(queryForContext, 2);
      let contextualExamples = '';
      if (relevantEntries.length > 0) {
        contextualExamples = relevantEntries.map(entry => 
          `--- BEGIN EXAMPLE (${entry.type}) ---\n${entry.text}\n--- END EXAMPLE ---`
        ).join('\n\n');
      }

      const design = await generateInstructionalDesign(
        lastGenerationParams.content,
        lastGenerationParams.files,
        lastGenerationParams.model,
        lastGenerationParams.outputType,
        lastGenerationParams.objectives,
        lastGenerationParams.styleGuide,
        lastGenerationParams.audienceProfile,
        feedback, // Pass the new feedback
        contextualExamples // Pass context here too
      );

      // Add the refined design to the vector store as well
      addVectorEntry(design, 'design');

      // The new design becomes the latest version.
      const newHistory = [design, ...designHistory];
      setDesignHistory(newHistory);
      setGeneratedDesign(design);
      setActiveVersionIndex(0);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred while regenerating the design.');
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleClearAndRegenerate = () => {
    if (!lastGenerationParams) {
      setError("Cannot regenerate. Please generate a design first.");
      return;
    }
    // Reset the state for the new generation
    setGeneratedDesign('');
    setDesignHistory([]);
    setActiveVersionIndex(0);
    setError(null);
    // Use the last parameters to generate a new design from scratch
    handleGenerateDesign(lastGenerationParams);
  };

  const handleRevertToVersion = (index: number) => {
    if (index >= 0 && index < designHistory.length) {
      setGeneratedDesign(designHistory[index]);
      setActiveVersionIndex(index);
    }
  };
  
  const handleUpdateObjective = (terminalIndex: number, enablingIndex: number | null, newText: string) => {
    const updatedObjectives = JSON.parse(JSON.stringify(smartObjectives)); // Deep copy to avoid mutation issues
    if (terminalIndex >= 0 && terminalIndex < updatedObjectives.length) {
      if (enablingIndex === null) {
        // It's a terminal objective
        updatedObjectives[terminalIndex].terminal = newText;
      } else if (enablingIndex >= 0 && enablingIndex < updatedObjectives[terminalIndex].enabling.length) {
        // It's an enabling objective
        updatedObjectives[terminalIndex].enabling[enablingIndex] = newText;
      }
      setSmartObjectives(updatedObjectives);
    }
  };

  const handleDesignFeedback = (rating: 'positive' | 'negative', designContent: string) => {
    const feedbackText = `--- USER FEEDBACK: ${rating.toUpperCase()} ---`;
    // Create a new entry that includes the original design and the feedback.
    // This teaches the vector store what kind of content is considered positive or negative.
    const entryText = `${designContent}\n\n${feedbackText}`;
    addVectorEntry(entryText, 'design');
    // Add the original design content to the 'feedbackGiven' set to hide the survey for this version.
    setFeedbackGiven(prev => new Set(prev).add(designContent));
  };
  
  const toggleThemeMode = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="bg-[--color-background-body] text-[--color-text-base] min-h-screen font-sans transition-colors duration-300">
      <Header 
        currentRole={currentUserRole}
        onRoleChange={(role) => setCurrentUserRole(role as UserRole)}
        themeMode={themeMode}
        onThemeToggle={toggleThemeMode}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-2/5 lg:sticky lg:top-28">
            <InputPanel
              onGenerate={handleGenerateDesign}
              isGenerating={isGeneratingDesign}
              smartObjectives={smartObjectives}
              onGenerateObjectives={handleGenerateObjectives}
              isGeneratingObjectives={isGeneratingObjectives}
              styleGuide={styleGuide}
              onStyleGuideChange={setStyleGuide}
              audienceProfile={audienceProfile}
              onAudienceProfileChange={setAudienceProfile}
              currentUserRole={currentUserRole}
            />
          </div>
          <div className="w-full lg:w-3/5">
            <OutputPanel
              objectives={smartObjectives}
              generatedDesign={generatedDesign}
              isGeneratingObjectives={isGeneratingObjectives}
              isGeneratingDesign={isGeneratingDesign}
              error={error}
              designHistory={designHistory}
              activeVersionIndex={activeVersionIndex}
              onRevertToVersion={handleRevertToVersion}
              onUpdateObjective={handleUpdateObjective}
              styleGuide={styleGuide}
              onRegenerateWithFeedback={handleRegenerateWithFeedback}
              onClearAndRegenerate={handleClearAndRegenerate}
              currentUserRole={currentUserRole}
              feedbackGiven={feedbackGiven}
              onDesignFeedback={handleDesignFeedback}
            />
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-[--color-text-muted] text-sm">
        <p>© {new Date().getFullYear()} Manoj Gopanapalli. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
