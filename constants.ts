import { SelectOption, UserRole } from './types';

export const INSTRUCTIONAL_MODELS: SelectOption[] = [
  { value: "ADDIE", label: "ADDIE Model" },
  { value: "Action Mapping", label: "Action Mapping" },
  { value: "ARCS Model of Motivational Design", label: "ARCS Model" },
  { value: "ASSURE Model", label: "ASSURE Model" },
  { value: "Bloom's Taxonomy", label: "Bloom's Taxonomy" },
  { value: "Dick and Carey Model", label: "Dick and Carey Model" },
  { value: "Gagne's Nine Events of Instruction", label: "Gagne's Nine Events" },
  { value: "Kemp Design Model", label: "Kemp Design Model" },
  { value: "Kirkpatrick's Four-Level Training Evaluation", label: "Kirkpatrick's Four Levels" },
  { value: "Merrill's Principles of Instruction", label: "Merrill's Principles" },
  { value: "SAM", label: "SAM (Successive Approximation Model)" },
];

export const OUTPUT_TYPES: SelectOption[] = [
  { value: "Assessment Questions", label: "Assessment Questions" },
  { value: "Case Study", label: "Case Study" },
  { value: "CBT", label: "CBT (Computer-Based Training)" },
  { value: "Detailed Course Outline", label: "Detailed Course Outline" },
  { value: "E-Learning Storyboard", label: "E-Learning Storyboard" },
  { value: "Facilitator Guide", label: "Facilitator Guide" },
  { value: "Gamification Strategy", label: "Gamification Strategy" },
  { value: "High Level Design Document", label: "High Level Design Document (HLDD)" },
  { value: "ILT", label: "ILT (Instructor-Led Training) Plan" },
  { value: "Interactive Scenario Logic", label: "Interactive Scenario Logic" },
  { value: "Job Aid", label: "Job Aid" },
  { value: "Learning Path", label: "Learning Path" },
  { value: "Low Level Design Document", label: "Low Level Design Document (LLDD)" },
  { value: "Microlearning Module", label: "Microlearning Module" },
  { value: "Project Plan (SOW)", label: "Project Plan / Scope of Work (SOW)" },
  { value: "Risk Analysis Plan", label: "Risk Analysis Plan" },
  { value: "Stakeholder Communication Plan", label: "Stakeholder Communication Plan" },
  { value: "Student Guide", label: "Student Guide" },
  { value: "Training Guide", label: "Training Guide" },
  { value: "Video Script", label: "Video Script" },
  { value: "vILT", label: "vILT (Virtual ILT) Plan" },
  { value: "Work Breakdown Structure (WBS)", label: "Work Breakdown Structure (WBS)" },
];

export const COLOR_THEMES: SelectOption[] = [
  { value: "theme-cyber-glow", label: "Cyber Glow (Default)" },
  { value: "theme-sunset-flare", label: "Sunset Flare" },
  { value: "theme-forest-mint", label: "Forest Mint" },
  { value: "theme-crimson-night", label: "Crimson Night" },
];

export const LEARNING_DOMAINS: SelectOption[] = [
  { value: "balanced", label: "None (Balanced)" },
  { value: "cognitive", label: "Cognitive (Knowledge)" },
  { value: "psychomotor", label: "Psychomotor (Skills)" },
  { value: "affective", label: "Affective (Attitudes)" },
];

export const USER_ROLES: { value: UserRole, label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

export const BLOOMS_TAXONOMY_VERBS: Record<string, string[]> = {
  'Remember': ['Define', 'List', 'Recall', 'Repeat', 'Name', 'State', 'Recognize', 'Memorize', 'Identify'],
  'Understand': ['Classify', 'Describe', 'Discuss', 'Explain', 'Summarize', 'Paraphrase', 'Interpret', 'Compare'],
  'Apply': ['Implement', 'Solve', 'Use', 'Demonstrate', 'Apply', 'Choose', 'Execute', 'Construct', 'Illustrate'],
  'Analyze': ['Differentiate', 'Organize', 'Relate', 'Compare', 'Contrast', 'Examine', 'Categorize', 'Deconstruct'],
  'Evaluate': ['Critique', 'Justify', 'Recommend', 'Appraise', 'Defend', 'Judge', 'Assess', 'Validate'],
  'Create': ['Design', 'Formulate', 'Build', 'Invent', 'Compose', 'Generate', 'Construct', 'Develop', 'Hypothesize'],
};

export const EXAMPLE_PROMPTS: Record<string, string> = {
  "Detailed Course Outline": `Topic: Introduction to Python for Data Science

Core Concepts:
- What is Python? Why is it popular for Data Science?
- Basic data types: integers, floats, strings, booleans
- Data structures: lists, tuples, dictionaries
- Introduction to libraries: NumPy for numerical operations, Pandas for data manipulation
- Simple data loading from a CSV file.
- First plot using Matplotlib.`,
  "E-Learning Storyboard": `Topic: Cybersecurity Basics - Phishing Awareness

Audience: All company employees, non-technical
Goal: Employees should be able to identify and report phishing emails.

Key points to cover:
1.  What is phishing? (Simple definition)
2.  Common signs of a phishing email (urgency, bad grammar, suspicious links, unexpected attachments).
3.  Show an example of a phishing email.
4.  What to do if you suspect an email is phishing (don't click, report it to IT).
5.  Quick knowledge check question.`,
  "CBT": `Topic: Using the New CRM Software - Contact Management

Audience: Sales team, familiar with old CRM.
Goal: Users will be able to add a new contact, log a call, and schedule a follow-up task in the new CRM.

Screen-by-screen breakdown:
- Screen 1: Introduction to the new Contact Dashboard.
- Screen 2: Step-by-step guide to clicking the 'New Contact' button.
- Screen 3: Interactive simulation: Fill in the fields for a sample contact.
- Screen 4: Guide to finding the 'Log a Call' activity.
- Screen 5: Knowledge Check: Multiple-choice question on where to find the contact history.
- Screen 6: Summary of the process.`,
  "Facilitator Guide": `Workshop Title: Effective Feedback Conversations

Duration: 90 minutes
Audience: New managers
Objectives:
- Explain the STAR model for feedback.
- Practice delivering constructive feedback in a role-play scenario.
- Identify common pitfalls to avoid when giving feedback.

Activities:
- Icebreaker (5 mins)
- Introduction to STAR model (15 mins)
- Group discussion on feedback challenges (15 mins)
- Role-play practice in pairs (30 mins)
- Debrief and Q&A (15 mins)`,
  "vILT": `Topic: Remote Project Management Best Practices

Duration: 60 minutes
Audience: Project managers new to remote work.
Platform: Zoom

Agenda:
- (5 mins) Welcome & Icebreaker: Use chat to share your biggest remote work challenge.
- (10 mins) Presentation: Key Tools for Remote Collaboration (Asana, Slack, Miro).
- (15 mins) Breakout Rooms: In small groups, discuss a scenario about a missed deadline. Use a shared virtual whiteboard to brainstorm solutions.
- (10 mins) Polling Activity: Run a series of polls on common communication issues.
- (15 mins) Group Discussion & Debrief: Share insights from breakout rooms.
- (5 mins) Q&A and Wrap-up.`,
  "ILT": `Topic: Workplace Fire Safety Training

Duration: 45 minutes
Audience: All office employees.
Location: Main conference room.

Materials: Projector, slide deck, fire extinguisher prop, evacuation maps.

Agenda:
- (5 mins) Introduction & Importance of Fire Safety.
- (10 mins) Presentation: Common fire hazards in the office.
- (10 mins) Activity: "Spot the Hazard" using photos of the office on screen.
- (10 mins) Demonstration: How to use a fire extinguisher (PASS method) using the prop.
- (5 mins) Group Activity: Split into teams, give each team an evacuation map and have them trace the primary and secondary routes from their desk.
- (5 mins) Q&A.`,
  "Video Script": `Video Title: How to Brew the Perfect Pour-Over Coffee

Style: Upbeat, modern, quick cuts
Length: ~3 minutes

Sections:
1.  Intro: "Tired of mediocre coffee? Let's fix that." Show beautiful shot of finished coffee.
2.  What you'll need: List equipment (kettle, grinder, filter, dripper, scale). Show each item.
3.  Step 1: Grind the beans. Talk about grind size (medium-coarse).
4.  Step 2: The Bloom. Explain why it's important. Show the process.
5.  Step 3: The Pour. Demonstrate the circular pouring motion. Mention timing.
6.  Outro: "Enjoy your perfect cup!" Call to action: "Subscribe for more coffee tips."`,
  "Interactive Scenario Logic": `Scenario: Handling a Difficult Customer Call

Role: Customer Service Representative
Goal: De-escalate the situation and find a satisfactory solution.

Initial Situation: Customer is angry because their software subscription auto-renewed and they were charged unexpectedly.

Decision Point 1:
- A) "I understand your frustration. Let's see how we can fix this." -> Leads to positive branch.
- B) "It's company policy to auto-renew." -> Leads to negative branch.
- C) "You should have read the terms and conditions." -> Leads to very negative branch.

Follow-up branches should explore options like offering a refund, explaining the policy calmly, and escalating to a manager.`,
  "Assessment Questions": `Subject: Basic Project Management Principles

Content Covered:
- The five phases of the project lifecycle (Initiation, Planning, Execution, Monitoring & Controlling, Closure).
- Key roles: Project Manager, Stakeholder, Team Member.
- Definition of scope, budget, and timeline.
- Concept of 'scope creep'.`,
  "Gamification Strategy": `Learning Goal: Memorize 50 common Spanish vocabulary words.
Target Audience: Beginner language learners.

Theme Idea: "Vocabulary Voyager" - travel to different virtual cities by learning word sets.

Game Elements:
- Points for correct answers.
- Badges for completing a city (e.g., "Madrid Master," "Bogotá Pro").
- Leaderboard to see who has the most points this week.
- "Streak" bonus for getting 5 questions right in a row.`,
  "Case Study": `Company: "Innovate Inc."
Product: A new project management software.
Challenge: The development team was consistently missing deadlines, causing client frustration. Communication was poor, and nobody had a clear view of the project's progress.
Action: The company adopted Agile methodologies, specifically Scrum. They implemented daily stand-ups, two-week sprints, and used a Kanban board to visualize tasks.
Result: Within 3 months, on-time delivery increased by 40%. Team morale improved, and clients had better visibility into the project's status.`,
  "Job Aid": `Task: How to reset your corporate password.

Create a simple, one-page guide with clear steps.
1.  Go to the company portal at [URL].
2.  Click "Forgot Password?".
3.  Enter your employee ID and company email address.
4.  Check your email for a reset link.
5.  Create a new password that meets the security requirements (list them).
Include a screenshot for each step. Add a "Who to contact for help" section.`,
  "Learning Path": `Role: Junior Software Engineer
Goal: Progress to a Mid-Level Software Engineer role within the next 6-9 months.

Current Skills:
- Proficient in JavaScript (ES6+).
- Basic understanding of React and component lifecycle.
- Can build simple applications using Create React App.
- Familiar with Git for version control.

Areas for Growth:
- State management (currently uses useState, needs to learn Redux or similar).
- Advanced React concepts (Hooks, Context API, performance optimization).
- Testing (Jest, React Testing Library).
- System design principles (basic concepts).
- Understanding the company's CI/CD pipeline.`,
  "Microlearning Module": `Topic: The Pomodoro Technique

Objective: By the end of this module, the learner will be able to apply the Pomodoro Technique to a work task.

Content:
1.  What is it? (A time management method using a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks.)
2.  How it works:
    - Choose a task.
    - Set a timer for 25 mins.
    - Work on the task.
    - When the timer rings, take a 5-min break.
    - After four "pomodoros," take a longer break (15-30 mins).
3.  Quick practice question: "How long is a standard Pomodoro work interval?"`,
  "Student Guide": `Topic: Introduction to Chemistry Lab Safety
Audience: First-year university students
Content to cover:
- Proper lab attire (goggles, lab coat)
- Location of safety equipment (fire extinguisher, eyewash station)
- Rules for handling chemicals
- Waste disposal procedures
- What to do in an emergency
- A short pre-lab quiz to check understanding.`,
  "Training Guide": `Topic: Advanced Customer Service Techniques

Audience: Experienced Support Agents

Key Objectives:
- Master the "Feel, Felt, Found" method.
- Learn to handle social media escalations.

Content Needs:
- Detailed explanation of empathy statements.
- Step-by-step process for de-escalation.
- Real-world examples of good vs. bad responses.
- Practice exercises for each module.`,
  "High Level Design Document": `Project: New Employee Onboarding E-Learning Course
Business Goal: Reduce time-to-productivity for new hires by 20%.
Target Audience: All new corporate employees, across various departments.
Proposed Solution: A 45-minute, self-paced e-learning module covering company history, values, core products, and key internal tools. The course will be hosted on the company's LMS.
Key Modules:
1. Welcome to the Company
2. Our Mission and Values
3. Understanding Our Products
4. Essential Tools and Systems
5. Your First 30 Days
Measurement Strategy: A final quiz with an 80% passing score. LMS completion data and a 30-day post-training survey sent to new hires and their managers.`,
  "Low Level Design Document": `Module: "Understanding Our Products" from the New Employee Onboarding Course
High-Level Objective: Learners will be able to match each core product with its primary customer benefit.
Detailed Structure:
- Slide 1: Module Title Screen.
- Slide 2: Introduction video from the Head of Product (30 seconds).
- Slide 3: Interactive Tab Activity - Each tab represents a product (Product A, B, C). Clicking a tab reveals a short description, key features, and target customer.
- Slide 4: Case Study - A short scenario showing how Product B solved a customer problem.
- Slide 5: Knowledge Check - A drag-and-drop activity where learners match product names to their benefits.
- Slide 6: Summary and transition to the next module.`,
  "Project Plan (SOW)": `Project Title: Q3 Product Update Training for Customer Support Team
Business Need: The customer support team needs to be trained on the new features of the CRM software launching in Q3 to handle customer inquiries effectively.
Key Deliverables: A 30-minute e-learning module, a 1-page quick reference guide (job aid), and a short knowledge check quiz.
Timeline: Project to be completed by August 15th.
Audience: 50 customer support agents, varying levels of technical skill.`,
  "Work Breakdown Structure (WBS)": `Project: Develop a blended learning program for new manager training.
Phases: The program will consist of a self-paced e-learning pre-work module (2 hours), a one-day in-person workshop, and a follow-up coaching session.
Key Topics: Giving effective feedback, delegation, and time management.`,
  "Risk Analysis Plan": `Project: Migrating all existing training content from LMS A to LMS B.
Deadline: Must be completed in 6 weeks.
Key challenges: Content is in various formats (SCORM, PDF, video). Subject matter experts (SMEs) have limited availability to review the migrated content. The new LMS has a different user interface.`,
  "Stakeholder Communication Plan": `Project: Creating a new onboarding program for remote employees.
Stakeholders:
- Head of HR (Project Sponsor)
- IT Department (for tech setup)
- Department Managers (for team-specific onboarding)
- New Hires (the audience)
Goal: Ensure all stakeholders are informed of progress, and their input is gathered at the right times.`,
};