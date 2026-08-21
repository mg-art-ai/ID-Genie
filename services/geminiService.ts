import { LearningObjective, AudienceProfile } from '../types';
import { INSTRUCTIONAL_MODELS } from '../constants';

async function proxyGenerateContent(request: any) {
  const res = await fetch('/api/gemini/generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate content');
  }
  return res.json();
}

const ai = {
  models: {
    generateContent: proxyGenerateContent
  }
};

/**
 * Extracts a JSON object or array from a string, handling markdown code fences and leading text.
 * @param text The text response from the model.
 * @returns The parsed JSON object.
 */
const extractJson = <T>(text: string): T => {
  // First, try to find a markdown code block
  let match = text.match(/```json\n([\s\S]*?)\n```/);
  let jsonString = match?.[1];

  if (!jsonString) {
    // If no markdown block, find the first '{' or '[' and assume it's the start of the JSON
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    if (firstBrace === -1 && firstBracket === -1) {
        console.error("Failed to find JSON start in model response:", text);
        throw new Error("Invalid JSON response from model. Could not find a JSON block.");
    }

    let startIndex;
    if (firstBrace === -1) {
        startIndex = firstBracket;
    } else if (firstBracket === -1) {
        startIndex = firstBrace;
    } else {
        startIndex = Math.min(firstBrace, firstBracket);
    }

    jsonString = text.substring(startIndex);
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Failed to parse extracted JSON string:", jsonString, e);
    throw new Error("Invalid JSON response from model. The extracted block is not valid JSON.");
  }
};


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader result is not a string'));
      }
      resolve(reader.result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const extractTextFromDocument = async (file: File): Promise<string> => {
  const prompt = `
    You are an expert document analyst specializing in brand identity and instructional design. Your task is to meticulously analyze the attached style guide document and extract its core principles.

    Present the extracted information as a comprehensive, well-structured summary in Markdown format. This summary will be used as a set of instructions for a generative AI, so it must be exceptionally clear, concise, and actionable.

    Organize your output under the following headings. If the document does not contain information for a specific section, write "Not specified."

    ## Overall Brand Voice & Persona
    - **Tone:** (e.g., Professional, conversational, witty, formal)
    - **Voice Adjectives:** (e.g., Confident, empathetic, authoritative, playful)
    - **Persona:** (e.g., Acts as a helpful mentor, a trusted expert, a friendly peer)
    - **Audience:** (Describe the target audience, their expertise level, and relationship to the brand.)

    ## Language & Grammar
    - **Voice:** (e.g., Use active voice, avoid passive constructions)
    - **Punctuation:** (e.g., Use of serial/Oxford comma, rules for em dashes)
    - **Capitalization:** (e.g., Title case for headings, sentence case for subheadings)
    - **Numbers & Dates:** (e.g., Spell out numbers one through nine, use YYYY-MM-DD format)

    ## Formatting & Structure
    - **Headings:** (e.g., Rules for H1, H2, H3 usage)
    - **Lists:** (e.g., When to use bulleted vs. numbered lists)
    - **Emphasis:** (e.g., Use bold for emphasis, italics for titles)
    - **Other Structures:** (e.g., Rules for tables, blockquotes, or special callouts)

    ## Terminology
    - **Preferred Terms:** (List specific words or phrases to use)
    - **Terms to Avoid:** (List specific words or phrases to avoid)

    ## Accessibility (A11Y) Guidelines
    - **Alt Text:** (e.g., All images must have descriptive alt text)
    - **Color & Contrast:** (e.g., Text must meet WCAG AA contrast ratios)
    - **Link Text:** (e.g., Link text must be descriptive, avoid "click here")
    - **Plain Language:** (e.g., Write at an 8th-grade reading level, avoid jargon)
    ---
    Analyze the document now and generate the summary.
  `;
  try {
    const data = await fileToBase64(file);
    const filePart = { inlineData: { mimeType: file.type, data } };
    const parts = [{ text: prompt }, filePart];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API for text extraction:", error);
    throw new Error("Failed to extract text from the document. The file format may be unsupported.");
  }
};

/**
 * Extracts raw text from a source file (PDF, TXT, DOCX, etc.).
 * @param file The file to process.
 * @returns The extracted plain text content.
 */
const extractTextFromSourceFile = async (file: File): Promise<string> => {
  const prompt = `
    Extract the raw text content from the provided file. 
    Do not summarize, analyze, or format it. 
    Return only the plain text content as a single block of text.
  `;
  try {
    const data = await fileToBase64(file);
    const filePart = { inlineData: { mimeType: file.type, data } };
    const parts = [{ text: prompt }, filePart];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
    });

    return response.text;

  } catch (error) {
    console.error(`Error extracting text from source file ${file.name}:`, error);
    throw new Error(`Failed to extract text from ${file.name}. The file format may be unsupported or the file may be corrupt.`);
  }
};

/**
 * Processes an array of files, separating them into image parts and extracted text content.
 * @param files The array of files to process.
 * @param initialContent The initial text content from the textarea.
 * @returns An object with combined content, image parts for the API, and any errors.
 */
async function processFilesForPrompt(files: File[], initialContent: string): Promise<{ combinedContent: string, imageParts: { inlineData: { mimeType: string, data: string } }[], errors: string[] }> {
    let combinedContent = initialContent;
    const imageParts: { inlineData: { mimeType: string, data: string } }[] = [];
    const errors: string[] = [];

    for (const file of files) {
        if (file.type.startsWith('image/')) {
            try {
                const data = await fileToBase64(file);
                imageParts.push({ inlineData: { mimeType: file.type, data } });
            } catch (e: any) {
                errors.push(`Failed to process image ${file.name}: ${e.message}`);
            }
        } else {
            // Assume it's a document and try to extract text
            try {
                const text = await extractTextFromSourceFile(file);
                combinedContent += `\n\n--- CONTENT FROM FILE: ${file.name} ---\n${text}\n--- END OF FILE CONTENT ---`;
            } catch (e: any) {
                 errors.push(`Failed to extract text from document ${file.name}: ${e.message}`);
            }
        }
    }
    return { combinedContent, imageParts, errors };
}

const formatAudienceProfileForPrompt = (profile: AudienceProfile): string => {
  if (Object.values(profile).every(val => !val.trim())) return '';
  return `**Target Audience Profile:**
    ---
    *   **Role & Context:** ${profile.role || 'Not specified.'}
    *   **Primary Goals & Motivations:** ${profile.goals || 'Not specified.'}
    *   **Challenges & Pain Points:** ${profile.painPoints || 'Not specified.'}
    *   **Prior Knowledge & Skills:** ${profile.priorKnowledge || 'Not specified.'}
    *   **Learning Environment:** ${profile.environment || 'Not specified.'}
    ---
    It is critical that you tailor the entire learning solution (tone, complexity, examples, activities) specifically for this audience.`;
};


export const recommendInstructionalModel = async (
  content: string,
  audienceProfile: AudienceProfile,
  outputType: string
): Promise<{ recommendedModel: string; justification: string }> => {
  const availableModels = INSTRUCTIONAL_MODELS.map(m => `"${m.value}"`).join(', ');
  const audienceSection = formatAudienceProfileForPrompt(audienceProfile);
  
  const prompt = `
    You are a world-class Instructional Design theorist. Your task is to recommend the single most effective instructional design model for a given learning scenario.

    Analyze the provided Raw Content, Target Audience Profile, and desired Output Type. Based on your analysis, choose the best model from the provided list.

    **Available Models:**
    [${availableModels}]

    **Your analysis should consider:**
    - Is the content procedural (skill-based) or declarative (knowledge-based)?
    - Is the learning goal performance-oriented (e.g., Action Mapping) or knowledge acquisition (e.g., Gagne)?
    - Is the development process linear (e.g., ADDIE) or iterative (e.g., SAM)?
    - Is learner motivation a key factor (e.g., ARCS)?

    Return a single JSON object with two keys: "recommendedModel" and "justification".
    - "recommendedModel": Must be ONE of the values from the "Available Models" list.
    - "justification": A concise, 2-3 sentence explanation for your recommendation.

    **Raw Content:**
    ---
    ${content}
    ---

    ${audienceSection}
    
    **Desired Output Type:**
    ---
    ${outputType}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendedModel: { type: "STRING" },
            justification: { type: "STRING" },
          },
          required: ['recommendedModel', 'justification'],
        },
      },
    });
    return extractJson<{ recommendedModel: string; justification: string }>(response.text);
  } catch (error) {
    console.error("Error calling Gemini API for model recommendation:", error);
    throw new Error("Failed to get an instructional model recommendation.");
  }
};


export const generateSmartObjectives = async (
  content: string,
  files: File[],
  styleGuide: string,
  audienceProfile: AudienceProfile,
  numObjectives: number,
  learningDomain: string,
): Promise<LearningObjective[]> => {
  const styleGuideSection = styleGuide 
    ? `**Style Guide to Adhere To:**
    ---
    ${styleGuide}
    ---
    Ensure the generated objectives conform to this style guide.`
    : '';
    
  const audienceSection = formatAudienceProfileForPrompt(audienceProfile);

  let learningDomainInstruction = 'Generate a balanced mix of objectives across different learning domains if applicable.';
  switch (learningDomain) {
    case 'cognitive':
      learningDomainInstruction = 'Prioritize the Cognitive learning domain. These objectives should focus on knowledge, comprehension, application, analysis, synthesis, and evaluation.';
      break;
    case 'psychomotor':
      learningDomainInstruction = 'Prioritize the Psychomotor learning domain. These objectives should focus on physical skills, procedures, and tasks that require motor coordination.';
      break;
    case 'affective':
       learningDomainInstruction = 'Prioritize the Affective learning domain. These objectives should focus on attitudes, values, emotions, and feelings.';
      break;
  }

  const { combinedContent, imageParts, errors } = await processFilesForPrompt(files, content);
  if (errors.length > 0) {
      console.warn("File processing issues encountered:", errors.join('\n'));
      // We'll still proceed with whatever content we could gather.
  }

  const prompt = `
    You are an expert Instructional Designer. Based on the provided content, generate exactly ${numObjectives} high-level **Terminal Learning Objectives**. A terminal objective describes the overall performance a learner will be able to do at the end of a course.

    For each Terminal Objective, generate 2-4 specific **Enabling Learning Objectives**. Enabling objectives are the smaller, foundational skills or knowledge a learner needs to master to achieve the corresponding terminal objective.

    All objectives (both terminal and enabling) must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
    ${learningDomainInstruction}

    Return the result as a JSON array of objects. Each object should have a 'terminal' key (string) and an 'enabling' key (array of strings).

    Example JSON structure:
    [
      {
        "terminal": "By the end of this module, the learner will be able to design a basic, responsive web page using HTML and CSS.",
        "enabling": [
          "Identify the purpose of common HTML tags (e.g., h1, p, div).",
          "Apply CSS properties for color, font, and spacing.",
          "Construct a media query to adjust layout for mobile devices."
        ]
      }
    ]

    ${audienceSection}
    ${styleGuideSection}

    **Content:**
    ---
    ${combinedContent || "No text content provided. Analyze the attached images."}
    ---
  `;
  try {
    const parts = [{ text: prompt }, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                terminal: { 
                  type: "STRING",
                  description: "The high-level terminal learning objective."
                },
                enabling: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "A list of specific enabling objectives that support the terminal objective."
                }
              },
              required: ['terminal', 'enabling']
            }
          },
        },
    });
    
    return extractJson<LearningObjective[]>(response.text);

  } catch (error) {
     console.error("Error calling Gemini API for objectives:", error);
    throw new Error("Failed to generate objectives. The model may have returned an unexpected format.");
  }
}

export const rephraseObjective = async (objective: string, styleGuide: string): Promise<string[]> => {
  const styleGuideSection = styleGuide 
    ? `**Style Guide to Adhere To:**
    ---
    ${styleGuide}
    ---
    Ensure the rephrased objectives conform to this style guide.`
    : '';

  const prompt = `
    You are an expert in instructional design and writing clear, concise learning objectives.
    Given the following SMART objective, rephrase it in 3 different ways.
    The rephrased objectives must also adhere to the SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).
    Return the suggestions as a JSON array of strings.

    ${styleGuideSection}

    **Objective to Rephrase:**
    ---
    ${objective}
    ---
  `;
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "STRING",
            },
          },
        },
    });
    
    return extractJson<string[]>(response.text);

  } catch (error) {
     console.error("Error calling Gemini API for rephrasing:", error);
    throw new Error("Failed to rephrase objective.");
  }
}

export const suggestEnablingObjectiveEdits = async (
  newTerminalObjective: string,
  currentEnablingObjectives: string[],
  styleGuide: string,
): Promise<string[]> => {
  const styleGuideSection = styleGuide 
    ? `**Style Guide to Adhere To:**\n---\n${styleGuide}\n---`
    : '';

  const prompt = `
    As an expert Instructional Designer, I have updated a high-level Terminal Objective. Now, I need you to review the original Enabling Objectives and suggest revised versions that are perfectly aligned with the NEW Terminal Objective.

    The revised enabling objectives must remain SMART (Specific, Measurable, Achievable, Relevant, Time-bound) and serve as foundational steps to achieve the new terminal goal. Return exactly one revised suggestion for each original enabling objective.

    Return the result as a JSON array of strings. The array must contain the same number of strings as the original list of enabling objectives.

    **New Terminal Objective:**
    ---
    ${newTerminalObjective}
    ---

    **Original Enabling Objectives to Revise:**
    ---
    ${JSON.stringify(currentEnablingObjectives, null, 2)}
    ---
    
    ${styleGuideSection}
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
    });
    return extractJson<string[]>(response.text);
  } catch (error) {
    console.error("Error calling Gemini API for enabling objective suggestions:", error);
    throw new Error("Failed to suggest edits for enabling objectives.");
  }
}

export const rephraseAllEnablingObjectives = async (
  terminalObjective: string,
  enablingObjectives: string[],
  styleGuide: string
): Promise<string[]> => {
  const styleGuideSection = styleGuide 
    ? `**Style Guide to Adhere To:**\n---\n${styleGuide}\n---`
    : '';

  const prompt = `
    You are an expert in instructional design. Review the following Terminal Objective and its associated Enabling Objectives.

    Your task is to rephrase ALL of the Enabling Objectives to be clearer, more concise, and more action-oriented, while ensuring they remain perfectly aligned with the Terminal Objective.
    
    Return the result as a JSON array of strings. The array must contain the same number of rephrased enabling objectives as the original list.

    **Terminal Objective:**
    ---
    ${terminalObjective}
    ---

    **Enabling Objectives to Rephrase:**
    ---
    ${JSON.stringify(enablingObjectives, null, 2)}
    ---

    ${styleGuideSection}
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
    });
    return extractJson<string[]>(response.text);
  } catch (error) {
    console.error("Error calling Gemini API for rephrasing all objectives:", error);
    throw new Error("Failed to rephrase all enabling objectives.");
  }
}

export const generatePlaceholderImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A clean, modern, professional graphic for a corporate e-learning course. The graphic should represent: ${prompt}` }],
      },
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("The model did not return an image.");

  } catch (error) {
    console.error("Error generating placeholder image:", error);
    throw new Error("Failed to generate placeholder image. The model might have content safety restrictions or another issue.");
  }
};

export const generateInstructionalDesign = async (
  content: string,
  files: File[],
  model: string,
  outputType: string,
  objectives: LearningObjective[],
  styleGuide: string,
  audienceProfile: AudienceProfile,
  feedback?: string,
  contextualExamples?: string
): Promise<string> => {

  const styleGuideSection = styleGuide 
    ? `**Style Guide:**
    ---
    ${styleGuide}
    ---
    Crucially, you must adhere to all instructions in this style guide (regarding tone, voice, formatting, language, etc.) when generating the output.`
    : '';

  const audienceSection = formatAudienceProfileForPrompt(audienceProfile);
    
  const feedbackSection = feedback
    ? `**Feedback on Previous Version:**
    ---
    ${feedback}
    ---
    Please carefully consider this feedback and generate a new, improved version of the instructional design. Address the specific points raised in the feedback.`
    : '';
  
  const contextualExamplesSection = contextualExamples
    ? `**Relevant Past Examples:**
    ---
    ${contextualExamples}
    ---
    Review these examples of previously generated content. Use them as a reference to maintain a consistent style, structure, and quality. Strive to match or exceed the quality of these examples.`
    : '';

  const objectivesSection = objectives.length > 0
    ? `**Learning Objectives to Address:**
      ---
      ${objectives.map((obj, termIndex) => 
        `**Terminal Objective ${termIndex + 1} (TO ${termIndex + 1}):** ${obj.terminal}\n` +
        obj.enabling.map((enablingObj, enIndex) => `*   **Enabling Objective ${termIndex + 1}.${enIndex + 1} (EO ${termIndex + 1}.${enIndex + 1}):** ${enablingObj}`).join('\n')
      ).join('\n\n')}
      ---`
    : `First, identify the primary learning objectives from the raw content before proceeding.`;


  let outputFormatInstructions = `Generate the content for the specified **${outputType}**. The output must be well-structured, clear, actionable, and ready for a development team (e.g., e-learning developers, graphic designers, trainers) to use.`;

  if (outputType === "Assessment Questions") {
    outputFormatInstructions = `
    Generate 5-10 **Assessment Questions** to test understanding of the provided content, directly aligned with the learning objectives.
    Include a mix of question types (e.g., Multiple Choice, True/False, Short Answer).
    For each question, provide the question, the correct answer, and brief feedback/rationale for both correct and incorrect answers. Ensure questions are written in clear, simple language.
    
    Here is an example structure:
    
    **Question 1: Multiple Choice**
    *   **Question:** What is the primary purpose of the ADDIE model?
    *   **Options:** 
        *   A) To quickly create prototypes.
        *   B) A framework for designing and developing effective training programs.
        *   C) To evaluate learner motivation.
    *   **Correct Answer:** B
    *   **Feedback:** The ADDIE model is a systematic instructional design framework that consists of five phases: Analysis, Design, Development, Implementation, and Evaluation.
    `;
  } else if (outputType === "Case Study") {
    outputFormatInstructions = `
    Generate a detailed **Case Study** based on the provided content.
    The case study should be structured to facilitate analysis and discussion.
    Use Markdown headings and bullet points to detail the following sections:
    - **Title:** A concise, descriptive title for the case study.
    - **Introduction/Synopsis:** Briefly introduce the protagonist(s) and the context of the case.
    - **The Challenge/Problem:** Clearly describe the problem or situation that needs to be addressed. What were the key issues?
    - **The Solution/Actions Taken:** Detail the steps that were taken to address the problem. Connect these actions back to the principles in the raw content.
    - **The Results/Outcome:** Explain the outcome of the actions taken. Was the solution successful? What were the key metrics of success?
    - **Discussion Questions:** Provide 3-5 thought-provoking questions to guide learner discussion and reflection on the case.
    `;
  } else if (outputType === "Detailed Course Outline") {
    outputFormatInstructions = `
    Generate a **Detailed Course Outline**.
    The outline should be structured hierarchically, breaking down the content into modules, lessons, and topics.
    Use Markdown headings and nested lists to represent the structure. For each topic, provide a brief (1-2 sentence) description of what will be covered and suggest a potential activity or interaction type (e.g., 'Reading', 'Video', 'Quiz', 'Discussion').

    Here is an example structure:

    ## Module 1: Introduction to Project Management
    ### Lesson 1.1: What is a Project?
    - **Topic:** Defining a project and its key characteristics. (Reading)
    - **Topic:** Differentiating projects from ongoing operations. (Quick Quiz)
    ### Lesson 1.2: The Project Lifecycle
    - **Topic:** Overview of the 5 phases: Initiation, Planning, Execution, Monitoring, Closure. (Video)
    - **Topic:** Key activities and deliverables for each phase. (Interactive Diagram)
    `;
  } else if (outputType === "E-Learning Storyboard") {
    outputFormatInstructions = `
    Generate a detailed, slide-by-slide storyboard for an **E-Learning Module**.
    The output must be well-structured, clear, actionable, and ready for an e-learning development team.
    Use Markdown to structure your response. For each slide, use a heading (e.g., '### Slide 1: Title Screen') and then bullet points for the different elements. Provide the following details:
    - **Slide Title:** A clear title for the slide.
    - **Visuals:** A description of all visual elements on the slide (e.g., characters, background, graphics, icons). Include a descriptive alt text suggestion for any key images (e.g., \`Alt Text: A smiling mentor helps a new employee at their desk.\`). **For key visuals, also include a placeholder tag like [Image: description of the image] that can be used to generate a placeholder visual.**
    - **On-Screen Text:** All text that appears on the screen, including titles, body text, and button labels.
    - **Narration (V.O.):** The voiceover script for the slide. If none, write "None". This serves as a transcript.
    - **Interactivity / User Action:** Describe any interactive elements and what the user needs to do (e.g., "User clicks the 'Next' button to continue," "User must answer a multiple-choice question," "Drag and drop activity").
    
    Here is an example structure for a single slide:
    
    ### Slide 3: Knowledge Check
    *   **Slide Title:** What is a 'Promise'?
    *   **Visuals:** A simple background with a question box in the center. Three clickable answer options are displayed below the question. A 'Submit' button is at the bottom right. [Image: An icon representing a multiple-choice question].
    *   **On-Screen Text:** 
        *   Question: Which of the following best describes a JavaScript Promise?
        *   Option A: A variable that is always a string.
        *   Option B: An object representing the eventual completion (or failure) of an asynchronous operation.
        *   Option C: A function that runs immediately.
    *   **Narration (V.O.):** Let's check your understanding. Which of the following best describes a JavaScript Promise? Select an option and click submit.
    *   **Interactivity / User Action:** User selects one of the three radio buttons (A, B, or C) and clicks the 'Submit' button. Feedback will be provided on the next slide based on their choice.
    `;
  } else if (outputType === "CBT") {
    outputFormatInstructions = `
    Generate a storyboard for a classic **Computer-Based Training (CBT) module**.
    The output should be a clear, screen-by-screen breakdown suitable for development in a traditional authoring tool.
    Use Markdown to structure your response. For each screen, use a heading (e.g., '### Screen 1: Title') and provide the following details:
    - **Screen Title:** A clear title.
    - **Visuals:** Describe the layout and any static graphics or images. Use placeholders like [Image: A screenshot of the main dashboard].
    - **On-Screen Text:** All text that appears on the screen.
    - **Audio (Narration):** The full narration script for the screen.
    - **User Interaction:** Specify the required user action, focusing on simple interactions (e.g., "User clicks the 'Next' button," "User answers a multiple-choice question").
    - **Navigation:** Detail the behavior of 'Next', 'Back', or any other navigation buttons.
    `;
  } else if (outputType === "ILT" || outputType === "Facilitator Guide") {
    outputFormatInstructions = `
    Generate a detailed **Instructor-Led Training (ILT) Plan / Facilitator Guide**.
    The plan should be a comprehensive script for an instructor conducting an in-person session.
    Use Markdown to structure the response, including the following sections:
    - **Course Title, Duration, Materials Needed.**
    - **Agenda/Timeline:** A minute-by-minute breakdown of the session.
    - **For each agenda item, provide:**
        *   **Topic:** The topic being covered.
        *   **Time Allotment:** e.g., (15 minutes).
        *   **Instructor Talking Points:** Key information and concepts the instructor should convey.
        *   **Activity/Interaction:** Detailed instructions for any in-person activities (e.g., group discussions, role-playing, worksheets, flip chart exercises).
        *   **Materials for Activity:** Any specific materials needed for the activity.
    `;
  } else if (outputType === "vILT") {
    outputFormatInstructions = `
    Generate a detailed **Virtual Instructor-Led Training (vILT) Plan / Facilitator Guide**.
    This plan should be a script for an instructor leading a live online session (e.g., on Zoom, Teams).
    Use Markdown to structure the response, including:
    - **Course Title, Duration, Virtual Platform.**
    - **Agenda/Timeline:** A minute-by-minute breakdown of the session.
    - **For each agenda item, provide:**
        *   **Topic:** The topic being covered.
        *   **Time Allotment:** e.g., (10 minutes).
        *   **Instructor Talking Points:** What the instructor will say.
        *   **On-Screen Content:** What should be displayed on the shared screen (e.g., "Slide 5: Key Definitions").
        *   **Virtual Tool Interaction:** Explicit instructions for using virtual tools (e.g., "Launch Poll #1," "Open breakout rooms with the following prompt," "Ask participants to use the chat to answer," "Use the virtual whiteboard for brainstorming.").
    `;
  } else if (outputType === "Gamification Strategy") {
    outputFormatInstructions = `
    Generate a **Gamification Strategy Brief** for a learning experience based on the provided content.
    The brief should be creative and align with the learning objectives.
    Use Markdown headings and bullet points to detail the following components:
    - **Theme/Narrative:** A brief story or theme that contextualizes the learning.
    - **Core Game Loop:** What is the primary action the learner will repeat? (e.g., Answer question -> Earn points -> Unlock level).
    - **Gamification Elements:**
        *   **Points/Scoring:** How will points be awarded?
        *   **Badges/Achievements:** List 3-5 specific badges learners can earn.
        *   **Leaderboards:** Describe how a leaderboard would function (e.g., weekly, all-time).
    - **Challenges/Quests:** Propose a sample challenge or quest.
    - **Motivation:** How does this strategy tap into intrinsic and extrinsic motivators?
    `;
  } else if (outputType === "High Level Design Document") {
    outputFormatInstructions = `
    Generate a formal **High Level Design Document (HLDD)** for a training program.
    This document should provide a strategic overview for stakeholders.
    Use Markdown headings and bullet points to detail the following sections:
    - **1.0 Project Overview:** A brief description of the project and its purpose.
    - **2.0 Business Need & Goals:** Explain the business problem this training solves and the desired outcomes.
    - **3.0 Target Audience Analysis:** Describe the intended learners, their characteristics, and prior knowledge.
    - **4.0 Learning Objectives:** List the main, high-level performance objectives.
    - **5.0 Proposed Learning Solution:** Describe the overall solution (e.g., e-learning, workshop, blended). Include duration, modality, and key features.
    - **6.0 Course Structure/Outline:** Provide a high-level outline of the main modules or topics.
    - **7.0 Technical Specifications:** Mention any key technical requirements (e.g., LMS, authoring tool).
    - **8.0 Evaluation Strategy:** Describe how the effectiveness of the training will be measured (e.g., Kirkpatrick's Levels).
    `;
  } else if (outputType === "Interactive Scenario Logic") {
    outputFormatInstructions = `
    Generate the branching logic for an **Interactive Scenario**.
    The output must be a clear, flowchart-like structure using Markdown. Define scenes/nodes, user choices, and the consequences of each choice. All text should be written in plain language.
    
    Here is an example structure:
    
    ### Scene 1: The Challenge
    *   **Situation:** A customer is angry because their delivery is late.
    *   **User Choice A:** Apologize and offer a discount. (Go to Scene 2A)
    *   **User Choice B:** Explain why it's late without apologizing. (Go to Scene 2B)
    *   **User Choice C:** Blame the shipping department. (Go to Scene 2C)
    
    ### Scene 2A: Positive Outcome
    *   **Situation:** The customer accepts the apology and discount.
    *   **Result:** Customer satisfaction is restored. The scenario ends successfully.
    
    ### Scene 2B: Neutral Outcome
    *   **Situation:** The customer is still unhappy but doesn't escalate.
    *   **Result:** A missed opportunity to delight the customer. The scenario ends.
    `;
  } else if (outputType === "Job Aid") {
    outputFormatInstructions = `
    Generate a concise and practical **Job Aid** (also known as a quick reference guide or cheat sheet).
    The goal is to provide immediate, on-the-job support. The format should be scannable and easy to use.
    Use Markdown headings, lists, and tables for maximum clarity. The Job Aid should include one or more of the following, as appropriate:
    - **Checklist:** A list of steps to follow or items to verify.
    - **Step-by-Step Instructions:** A numbered list of actions to perform a specific task.
    - **Decision Tree:** A simple flowchart to help users make a choice.
    - **Key Terminology/Definitions:** A brief glossary of essential terms.
    - **"Do's and Don'ts":** A simple two-column list of best practices and things to avoid.
    When suggesting screenshots or visuals, use a placeholder tag like [Image: description of the screenshot].
    Focus on clarity and brevity. Avoid long paragraphs.
    `;
  } else if (outputType === "Learning Path") {
    outputFormatInstructions = `
    Generate a comprehensive **Learning Path** designed to guide a learner from their current state to a desired level of proficiency.
    The path should be a structured sequence of learning modules and activities.
    Use Markdown headings and nested lists to structure the response. Include the following sections:
    - **Learning Path Title:** A clear title for the entire path.
    - **Target Audience:** Who is this learning path for?
    - **Overall Learning Goals:** What will the learner be able to do after completing this path?
    - **Estimated Total Duration:** An approximation of the time commitment (e.g., "Approx. 3-4 weeks, 5-7 hours per week").
    - **Modules/Phases:** Break the path down into logical stages (e.g., 'Phase 1: Foundations', 'Phase 2: Intermediate Skills').
    - **For each module/phase, provide:**
        *   **Module Title & Objective:** A clear title and a 1-2 sentence objective for the module.
        *   **Key Topics:** A bulleted list of specific topics to be covered.
        *   **Recommended Resources:** A list of suggested learning materials. This can include readings, videos, articles, or specific courses. Use placeholder links where appropriate (e.g., "[Company's internal guide to X]").
        *   **Suggested Activities/Projects:** Practical exercises, projects, or on-the-job tasks to apply the knowledge.
        *   **Milestone/Check-in:** A clear milestone that indicates the learner has successfully completed the module (e.g., "Successfully complete a code review," "Present a summary to your manager").
    `;
  } else if (outputType === "Low Level Design Document") {
    outputFormatInstructions = `
    Generate a detailed **Low Level Design Document (LLDD)**, providing a granular blueprint for a specific module or lesson.
    This document is for developers and instructional designers to build the content.
    Use Markdown headings, lists, and tables to detail the following sections for the specified module:
    - **1.0 Module Overview:** State the module title, duration, and prerequisites.
    - **2.0 Terminal and Enabling Objectives:** List the specific, detailed objectives for this module.
    - **3.0 Content Outline & Flow:** Provide a slide-by-slide or screen-by-screen breakdown of the content flow.
    - **4.0 Instructional Strategies:** Describe the methods used (e.g., scenario-based learning, interactive video, knowledge checks).
    - **5.0 Media & Asset List:** Detail all required media assets (e.g., graphics, videos, audio narration scripts, on-screen text). Use a table format if possible. **For graphics, use a placeholder tag like [Image: description of the graphic].**
    - **6.0 Interactivity Specification:** Describe every user interaction in detail (e.g., "On click of the 'More Info' button, a text box appears with...").
    - **7.0 Assessment Details:** Specify the details of any quizzes or assessments within the module, including question types and feedback logic.
    `;
  } else if (outputType === "Microlearning Module") {
    outputFormatInstructions = `
    Generate the content for a single, focused **Microlearning Module**.
    The module should be designed to be completed in under 5 minutes and achieve one specific learning objective.
    Use Markdown headings and bullet points to structure the following components:
    - **Module Title:** A clear and engaging title.
    - **Learning Objective:** State the single, specific objective for this module.
    - **Key Concept (The "Tell"):** A brief, clear explanation of the core concept (1-2 paragraphs max).
    - **Example/Demonstration (The "Show"):** Provide one concrete example or a short scenario to illustrate the concept. **If a visual would help, include a placeholder like [Image: a diagram illustrating the concept].**
    - **Practice Activity (The "Do"):** A simple interactive question (e.g., multiple choice, reflection question) to reinforce the learning. Provide the correct answer and feedback.
    - **Key Takeaway:** A single, memorable summary sentence.
    `;
  } else if (outputType === "Project Plan (SOW)") {
    outputFormatInstructions = `
    Generate a comprehensive **Project Plan and Scope of Work (SOW)** for an instructional design project.
    This document should be formal, detailed, and suitable for client or stakeholder sign-off.
    Use Markdown headings and bullet points to detail the following sections:
    - **1.0 Project Overview:** A brief, high-level summary of the project's purpose and the proposed solution.
    - **2.0 Business Goals & Objectives:** Clearly state the business problem this project solves and the measurable outcomes.
    - **3.0 Project Scope:**
        *   **In Scope:** A detailed list of all tasks and deliverables included in the project.
        *   **Out of Scope:** Explicitly list what is not included to manage expectations.
    - **4.0 Deliverables:** A list of all tangible outputs (e.g., e-learning module, facilitator guides, job aids).
    - **5.0 Key Stakeholders:** Identify the project sponsor, project manager, SMEs, and other key roles.
    - **6.0 High-Level Timeline & Milestones:** Provide an estimated timeline with key project phases and major milestones (e.g., Kick-off, Design Sign-off, Alpha Review, Final Delivery).
    - **7.0 Assumptions:** List any assumptions being made that the project's success depends on (e.g., "SME availability will not exceed a 48-hour review turnaround").
    - **8.0 Constraints:** List any known limitations, such as budget, technology, or deadlines.
    `;
  } else if (outputType === "Risk Analysis Plan") {
    outputFormatInstructions = `
    Generate a **Risk Analysis Plan** for the instructional design project.
    Identify potential risks that could jeopardize the project's success.
    Present the information in a Markdown table with the following columns:
    - **Risk ID:** A unique identifier (e.g., R01, R02).
    - **Risk Description:** A clear and concise description of the potential risk.
    - **Likelihood:** The probability of the risk occurring (Low, Medium, High).
    - **Impact:** The potential effect on the project if the risk occurs (Low, Medium, High).
    - **Mitigation Strategy:** Proactive steps to reduce the likelihood or impact of the risk.
    - **Contingency Plan:** The reactive plan to be executed if the risk occurs.

    Example Row:
    | Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy | Contingency Plan |
    |---|---|---|---|---|---|
    | R01 | Key Subject Matter Expert (SME) becomes unavailable during the project. | Medium | High | Identify and onboard a backup SME at the project start. Document all SME knowledge in a central repository. | Allocate additional budget for an external consultant. Adjust project timeline. |
    `;
  } else if (outputType === "Stakeholder Communication Plan") {
    outputFormatInstructions = `
    Generate a **Stakeholder Communication Plan** for the instructional design project.
    The plan should outline how, when, and what will be communicated to various project stakeholders to ensure everyone is aligned.
    Present the information in a Markdown table with the following columns:
    - **Stakeholder / Group:** The person or group receiving the communication (e.g., Project Sponsor, Steering Committee, Development Team).
    - **Information to Communicate:** The content of the communication (e.g., Project Status, Risk Updates, Milestone Completion).
    - **Communication Method:** The channel used for communication (e.g., Email Update, Weekly Meeting, Formal Report, Project Dashboard).
    - **Frequency:** How often the communication will occur (e.g., Weekly, Bi-weekly, As Needed, At Milestones).
    - **Owner:** The person responsible for preparing and sending the communication.

    Example Row:
    | Stakeholder / Group | Information to Communicate | Communication Method | Frequency | Owner |
    |---|---|---|---|---|
    | Project Sponsor | High-level project status, budget updates, major risks/issues. | Bi-weekly Email Summary & Monthly Meeting | Bi-weekly (email), Monthly (meeting) | Project Manager |
    `;
  } else if (outputType === "Student Guide") {
    outputFormatInstructions = `
    Generate a comprehensive **Student Guide** for the learning experience.
    The guide should be written in a supportive and clear tone, directly addressing the learner.
    Use Markdown headings, lists, and bold text to structure the following sections:
    - **Introduction:** Briefly welcome the student and explain what they will learn and why it's important.
    - **Learning Objectives:** List the specific, measurable goals for the student.
    - **Required Materials/Prerequisites:** List anything the student needs before starting.
    - **Module Breakdown:** Provide a clear outline of the topics or modules, explaining what each one covers.
    - **Key Activities & Assignments:** Describe the main tasks the student will need to complete (e.g., readings, quizzes, projects).
    - **Tips for Success:** Offer practical advice to help the student succeed in the course.
    - **Getting Help:** Explain how the student can get support if they are stuck.
    `;
  } else if (outputType === "Training Guide") {
    outputFormatInstructions = `
    Generate a comprehensive **Training Guide**.
    This guide should be a standalone, full-content document that a learner can read to master the material.
    Use Markdown headings, bold text, and lists to structure the document clearly.
    Include the following sections:
    - **1. Introduction:**
        *   **Overview:** Briefly explain the training topic.
        *   **Target Audience:** Who is this guide for?
        *   **Training Objectives:** Explicitly list the **Terminal Objectives** and **Enabling Objectives**.
    - **2. Course Content:** Divide the content into logical Modules or Chapters. For each module:
        *   **Module Title:**
        *   **Instructional Content:** Detailed, explanatory text covering the subject matter. Do not just outline it; write the actual content the learner needs to read.
        *   **Key Concepts:** Highlight important definitions or rules.
        *   **Examples:** Provide relevant scenarios or examples to illustrate the concepts.
        *   **Visuals:** Insert placeholder tags like [Image: diagram of X] where visual aids would be beneficial.
    - **3. Practical Application:**
        *   **Activities:** Exercises or reflection questions for the learner.
        *   **Case Studies:** Short scenarios to test application.
    - **4. Assessment:** A short quiz or knowledge check to verify understanding.
    - **5. Conclusion & Next Steps:** Summary and where to find more resources.
    `;
  } else if (outputType === "Video Script") {
    outputFormatInstructions = `
    Generate a detailed, slide-by-slide storyboard for a **Video Script**.
    The output must be well-structured, clear, actionable, and ready for a video production team.
    Use Markdown to structure your response. For each slide/scene, use a heading (e.g., '### Slide 1') and then bullet points for the different elements. Provide the following details:
    - **Visuals:** A clear description of what is on screen. This includes graphics, animations, stock footage, or screen recordings. Include descriptive alt text suggestions for any important on-screen graphics or images (e.g., 'Alt text: A line graph showing a 30% increase in sales over the last quarter.'). **For key graphics, use a placeholder tag like [Image: description of the graphic].**
    - **On-Screen Text:** Any text that should appear on the slide. Write it out exactly. If none, write "None".
    - **Narration (V.O.):** The voiceover script that corresponds to the visuals for that slide. This serves as a full transcript for accessibility.
    - **SFX/Music (Optional):** Suggestions for sound effects or background music cues.
    
    Here is an example structure for a single slide:
    
    ### Slide 1: Introduction
    *   **Visuals:** A clean, modern title card with the course title. [Image: The course logo]. Alt text: The course title 'Mastering Asynchronous JavaScript' on an animated background.
    *   **On-Screen Text:** [Course Title]: Mastering Asynchronous JavaScript
    *   **Narration (V.O.):** (Upbeat, engaging intro music fades slightly to background) Welcome to "Mastering Asynchronous JavaScript." In this course, you'll learn how to write efficient, non-blocking code.
    *   **Music:** Upbeat, modern electronic track starts and fades to background.
    `;
  } else if (outputType === "Work Breakdown Structure (WBS)") {
    outputFormatInstructions = `
    Generate a detailed **Work Breakdown Structure (WBS)** for the instructional design project.
    The WBS should hierarchically decompose the total scope of work into manageable tasks. Use a nested list format in Markdown.
    Organize the WBS according to a standard instructional design model like ADDIE (Analysis, Design, Development, Implementation, Evaluation).

    Here is an example structure:

    **1.0 Analysis Phase**
    *   1.1 Conduct Project Kick-off Meeting
    *   1.2 Perform Needs Analysis
        *   1.2.1 Review existing documentation
        *   1.2.2 Conduct stakeholder interviews
    *   1.3 Define Target Audience
    *   1.4 Develop High-Level Learning Objectives
    *   1.5 Analysis Phase Sign-off

    **2.0 Design Phase**
    *   2.1 Write Detailed Learning Objectives
    *   2.2 Create Design Document/Storyboard
        *   2.2.1 Develop content outline
        *   2.2.2 Script narration
        *   2.2.3 Plan interactions and assessments
    *   2.3 Develop Prototype/Proof of Concept
    *   2.4 Design Phase Sign-off

    **3.0 Development Phase**
    *   ... (and so on for Development, Implementation, and Evaluation) ...
    `;
  }

  const { combinedContent, imageParts, errors } = await processFilesForPrompt(files, content);
  if (errors.length > 0) {
      console.warn("File processing issues encountered:", errors.join('\n'));
  }

  const prompt = `
    You are an expert Instructional Designer and Learning Experience Architect.

    **Primary Directive:** Your most important task is to generate a detailed and practical learning solution based **strictly and exclusively** on the provided "Raw Content" and "Learning Objectives". All generated text, concepts, examples, and activities must be directly derived from this source material. **Do not introduce any outside information or hallucinate content.** Your output must be a faithful transformation of the provided information into the requested format.

    **Raw Content:**
    ---
    ${combinedContent || "No text content provided. Analyze the attached images."}
    ---
    
    ${objectivesSection}

    **Critical Objective Alignment:**
    ---
    The Learning Objectives provided are the absolute blueprint for this design. Every single part of your generated output—every module, slide, activity, and assessment question—must directly support and align with one or more of these specific objectives. You must ensure a clear and traceable link between the objectives and the content you create. For formats like storyboards or guides, you should add a small note (e.g., "(Aligns with EO 1.2)") to each major section to demonstrate this alignment.
    ---

    Now, using the content and objectives above, create the learning solution by following these specific constraints and instructions:

    ${audienceSection}
    ${styleGuideSection}
    ${feedbackSection}
    ${contextualExamplesSection}

    **Instructional Design Model to Apply:** ${model}
    **Desired Output Format:** ${outputType}
    **Output Format Instructions:**
    ---
    ${outputFormatInstructions}
    ---
    
    You must now generate the content. Your entire output must be in well-formatted Markdown.
  `;
  try {
    const parts = [{ text: prompt }, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using a more powerful model for complex generation
        contents: { parts: parts },
    });
    
    return response.text;

  } catch (error) {
     console.error("Error calling Gemini API for instructional design:", error);
    throw new Error("Failed to generate the instructional design. The model may have returned an unexpected format or encountered an issue.");
  }
};