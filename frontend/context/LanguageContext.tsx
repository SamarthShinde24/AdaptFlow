"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

export type SupportedLanguage = "en" | "hi";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// COMPREHENSIVE BILINGUAL TRANSLATION DICTIONARY (ENGLISH -> HINDI)
// Covers UI controls, settings, learning terminology, buttons, and placeholders
// Designed for natural, idiomatic educational Hindi (CBSE / Indian University standard)
// ============================================================================
export const TRANSLATION_MAP: Record<string, string> = {
  // Navigation & Core Actions
  "Dashboard": "डैशबोर्ड",
  "AI Search": "एआई खोज",
  "Source Chat": "स्रोत चैट",
  "Adaptive Quiz": "अनुकूली प्रश्नोत्तरी",
  "Assignments": "असाइनमेंट",
  "Analytics": "विश्लेषण",
  "Settings": "सेटिंग्स",
  "Active": "सक्रिय",
  "Inactive": "निष्क्रिय",
  "Done": "संपन्न",
  "Save": "सहेजें",
  "Save Changes": "परिवर्तन सहेजें",
  "Discard": "निरस्त करें",
  "Cancel": "रद्द करें",
  "Confirm": "पुष्टि करें",
  "Delete": "हटाएं",
  "Edit": "संपादित करें",
  "Submit": "सबमिट करें",
  "Submit Answer": "उत्तर सबमिट करें",
  "Submit Assignment": "असाइनमेंट जमा करें",
  "Start Quiz": "क्विज़ प्रारंभ करें",
  "Start Assessment": "मूल्यांकन प्रारंभ करें",
  "Review": "समीक्षा करें",
  "Clear": "साफ़ करें",
  "Close": "बंद करें",
  "Back": "वापस",
  "Next": "आगे",
  "Previous": "पिछला",
  "Search": "खोजें",
  "Filter": "फ़िल्टर",
  "All": "सभी",
  "View": "देखें",
  "Download": "डाउनलोड",
  "Upload": "अपलोड",
  "Open": "खोलें",
  "New": "नया",
  "Loading...": "लोड हो रहा है...",
  "Please wait...": "कृपया प्रतीक्षा करें...",
  "Success": "सफलता",
  "Error": "त्रुटि",
  "Warning": "चेतावनी",
  "Info": "जानकारी",
  "Help": "सहायता",
  "Dismiss": "हटाएं",
  "Retry": "पुनः प्रयास करें",
  "Refresh": "ताज़ा करें",
  "Exit": "बाहर निकलें",
  "Select all": "सभी चुनें",
  "Deselect all": "सभी अचयनित करें",
  "Expand": "विस्तार करें",
  "Collapse": "समेटें",
  "Copy": "कॉपी करें",
  "Copied!": "कॉपी हो गया!",
  "Export": "निर्यात",
  "Import": "आयात",
  "Sort by": "क्रमबद्ध करें",
  "Status": "स्थिति",
  "Actions": "क्रियाएं",
  "Details": "विवरण",
  "Overview": "अवलोकन",

  // Settings Modal Texts & Preferences Studio
  "Language & Localization": "भाषा एवं स्थानीयकरण",
  "Choose platform display language": "प्लेटफ़ॉर्म प्रदर्शन भाषा चुनें",
  "Choose platform display language. Translates website content while preserving sidebar navigation and headings in English.":
    "प्लेटफ़ॉर्म प्रदर्शन भाषा चुनें। साइडबार नेविगेशन और शीर्षकों को अंग्रेज़ी में रखते हुए वेबसाइट सामग्री का हिंदी में अनुवाद करता है।",
  "English": "अंग्रेज़ी (English)",
  "Default Platform Language": "डिफ़ॉल्ट प्लेटफ़ॉर्म भाषा",
  "हिंदी": "हिंदी (Hindi)",
  "Complete platform Hindi translation": "संपूर्ण प्लेटफ़ॉर्म हिंदी अनुवाद",
  "Workspace environment, study goals, AI grounding, and shortcuts":
    "कार्यक्षेत्र वातावरण, अध्ययन लक्ष्य, एआई प्रमाणिकता और शॉर्टकट",
  "Appearance & Theme": "उपस्थिति एवं थीम",
  "Obsidian Dark": "ऑब्सिडियन डार्क (गहन कृष्ण)",
  "Deep focus palette with #09090B base": "#09090B आधार के साथ गहन अध्ययन पैलेट",
  "Clean Light": "क्लीन लाइट (उज्ज्वल श्वेत)",
  "Crisp daylight studio palette": "उज्ज्वल एवं स्पष्ट स्टूडियो पैलेट",
  "Study Goals & Pacing": "अध्ययन लक्ष्य एवं गति",
  "Daily Flashcard Goal": "दैनिक फ़्लैशकार्ड लक्ष्य",
  "Cards / day": "कार्ड्स / दिन",
  "Cards": "कार्ड्स",
  "10 Cards": "10 कार्ड्स",
  "20 Cards": "20 कार्ड्स",
  "30 Cards": "30 कार्ड्स",
  "50 Cards": "50 कार्ड्स",
  "Audio & Sound Effects": "ऑडियो एवं ध्वनि प्रभाव",
  "Subtle chime on card flip, correct answer, and quiz completion":
    "कार्ड पलटने, सही उत्तर और क्विज़ पूरा होने पर सूक्ष्म ध्वनि",
  "Adaptive Spaced Repetition (SRS)": "अनुकूली अंतराल पुनरावृत्ति (SRS)",
  "Resurface missed concepts more frequently until mastered":
    "कमज़ोर विषयों को निपुण होने तक अधिक बार दोहराएं",
  "AI Engine & RAG Grounding": "एआई इंजन एवं RAG प्रमाणिकता",
  "Bayesian Knowledge Tracing (BKT)": "बायेसियन ज्ञान अनुरेखण (BKT)",
  "Compute latent mastery probability P(L) in real-time across topics":
    "सभी विषयों में वास्तविक समय में दक्षता संभावना P(L) की गणना करें",
  "Strict Course Grounding": "सख्त पाठ्यक्रम प्रमाणिकता",
  "Restrict citations and quiz answers strictly to uploaded course sources":
    "प्रश्नोत्तरी और उद्धरणों को केवल अपलोड की गई अध्ययन सामग्री तक सीमित रखें",
  "Auto-Render Topic Flowcharts": "विषय फ़्लोचार्ट स्वचालित रूप से बनाएं",
  "Automatically convert procedural explanations into interactive visual diagrams":
    "प्रक्रियात्मक व्याख्याओं को संवादात्मक आरेखों में स्वचालित रूप से बदलें",
  "Account Details": "खाता विवरण",
  "Logged in account": "लॉग-इन खाता",
  "Student": "विद्यार्थी",
  "Instructor": "प्रशिक्षक",
  "Faculty": "संकाय शिक्षक",
  "Data & Storage Management": "डेटा एवं संग्रहण प्रबंधन",
  "Clear Local Cache": "स्थानीय कैश साफ़ करें",
  "Cache Cleared!": "कैश साफ़ हो गया!",
  "Export Study JSON": "अध्ययन प्रोफ़ाइल निर्यात करें",
  "Exported!": "निर्यात संपन्न!",
  "Preferences save automatically": "प्राथमिकताएं स्वतः सहेजी जाती हैं",
  "Keyboard Shortcuts Reference": "कीबोर्ड शॉर्टकट निर्देशिका",
  "Toggle Sidebar": "साइडबार टॉगल करें",
  "Command Palette / Search": "कमांड पैलेट / त्वरित खोज",
  "Send Chat Message": "चैट संदेश भेजें",
  "Flip Flashcard": "फ़्लैशकार्ड पलटें",
  "Next / Previous Flashcard": "अगला / पिछला फ़्लैशकार्ड",
  "Score Card (Mastered / Review)": "स्कोर कार्ड (निपुण / समीक्षा)",
  "Toggle Fullscreen Focus Mode": "पूर्ण स्क्रीन एकाग्रता मोड टॉगल करें",

  // Course Dashboard & Library
  "Mastery Progress": "दक्षता एवं प्रगति",
  "Study Time": "अध्ययन समय",
  "Total Study Time": "कुल अध्ययन समय",
  "Retention Rate": "स्मरण अवधारण दर",
  "Quiz Score": "क्विज़ प्राप्तांक",
  "Recent Activity": "हालिया गतिविधि",
  "Active Concepts": "सक्रिय अवधारणाएं",
  "Practice Now": "अभी अभ्यास करें",
  "Continue Learning": "अध्ययन जारी रखें",
  "Course Materials": "पाठ्यक्रम अध्ययन सामग्री",
  "Ingested Materials": "अपलोड की गई सामग्री",
  "Knowledge State": "ज्ञान स्थिति",
  "Proficient": "प्रवीण",
  "Needs Review": "पुनरावलोकन आवश्यक",
  "Mastered": "निपुण",
  "Learning": "सीख रहे हैं",
  "Topic Flow Map": "विषय प्रवाह मानचित्र",
  "Prerequisite Flow": "पूर्वापेक्षा ज्ञान प्रवाह",
  "Prerequisite Knowledge Graph": "पूर्वापेक्षा ज्ञान आरेख",
  "Quick Actions": "त्वरित क्रियाएं",
  "Study Deck": "अध्ययन डेक",
  "Take Assessment": "मूल्यांकन प्रारंभ करें",
  "View Analytics": "विश्लेषण देखें",
  "Upload Notes": "नोट्स अपलोड करें",
  "Upload Document": "दस्तावेज़ अपलोड करें",
  "Upload Material": "अध्ययन सामग्री अपलोड करें",
  "Drop files here or click to browse": "फ़ाइलें यहाँ खींचें या ब्राउज़ करने हेतु क्लिक करें",
  "Drag and drop your PDF, PPTX, or Video files": "अपनी PDF, PPTX, या वीडियो फ़ाइलें खींचकर यहाँ छोड़ें",
  "Supported formats: PDF, PPTX, VTT, MP4, SRT": "समर्थित प्रारूप: PDF, PPTX, VTT, MP4, SRT",
  "Daily Streak": "दैनिक निरंतरता",
  "Day Streak": "दिन की निरंतरता",
  "Days Streak": "दिनों की निरंतरता",
  "Overall Progress": "समग्र प्रगति",
  "Subjects": "अध्ययन विषय",
  "Today": "आज",
  "Yesterday": "कल",
  "Last 7 Days": "पिछले 7 दिन",
  "Last 30 Days": "पिछले 30 दिन",
  "Artificial Intelligence": "आर्टिफिशियल इंटेलिजेंस (AI)",
  "Biology": "जीव विज्ञान",
  "Computer Science": "कंप्यूटर साइंस",
  "Mathematics": "गणित",
  "Physics": "भौतिक विज्ञान",
  "Chemistry": "रसायन विज्ञान",
  "CBSE Class 11": "सीबीएसई कक्षा 11",
  "Architectural Heritage of Rajasthan": "राजस्थान की स्थापत्य धरोहर",
  "Cellular Energetics & Bioenergetics": "कोशिकीय ऊर्जा विज्ञान",
  "Data Structures & Algorithms": "डेटा संरचनाएं एवं एल्गोरिदम",

  // NotebookLM Chat Studio & AI Tutor
  "Ask a question about your course materials...": "अपनी अध्ययन सामग्री के संबंध में प्रश्न पूछें...",
  "Ask anything about your uploaded sources...": "अपने अपलोड किए गए स्रोतों से कुछ भी पूछें...",
  "Type your question...": "अपना प्रश्न यहाँ लिखें...",
  "Search sources...": "सामग्री खोजें...",
  "Search past conversations...": "पिछली बातचीत खोजें...",
  "Selected sources": "चयनित स्रोत",
  "sources selected": "स्रोत चयनित",
  "Source selected": "स्रोत चयनित",
  "All sources": "सभी स्रोत",
  "No sources selected": "कोई स्रोत चयनित नहीं",
  "Sources": "स्रोत",
  "Grounding Citations": "प्रमाणित संदर्भ उद्धरण",
  "Citations": "संदर्भ उद्धरण",
  "Ask AI": "एआई शिक्षक से पूछें",
  "Send message": "संदेश भेजें",
  "Attach files": "फ़ाइलें संलग्न करें",
  "New AI Dialogue": "नया संवाद",
  "Dialogue History": "संवाद इतिहास",
  "No matching conversation records found.": "कोई पिछला संवाद रिकॉर्ड नहीं मिला।",
  "Regenerate response": "पुनः उत्तर उत्पन्न करें",
  "Copy to clipboard": "क्लिपबोर्ड पर कॉपी करें",
  "Export conversation": "बातचीत निर्यात करें",
  "Clear conversation": "बातचीत साफ़ करें",
  "Thinking...": "विश्लेषण कर रहा है...",
  "Generating response...": "उत्तर तैयार किया जा रहा है...",
  "Interactive Visual Diagram": "संवादात्मक दृश्य आरेख",
  "Topic Flowchart": "विषय फ़्लोचार्ट",
  "Fullscreen": "पूर्ण स्क्रीन",
  "Exit Fullscreen": "पूर्ण स्क्रीन से बाहर निकलें",
  "Download Diagram": "आरेख डाउनलोड करें",
  "Zoom In": "ज़ूम इन",
  "Zoom Out": "ज़ूम आउट",
  "Reset View": "दृश्य रीसेट करें",
  "Ask a question": "प्रश्न पूछें",
  "View Document": "दस्तावेज़ देखें",
  "Open Document": "दस्तावेज़ खोलें",
  "Document Details": "दस्तावेज़ विवरण",
  "Not found in any of your sources": "आपके किसी भी अध्ययन स्रोत में नहीं मिला",
  "Based on your course materials": "आपकी अध्ययन सामग्री के आधार पर",
  "Verified Source Provenance": "सत्यापित स्रोत संदर्भ",
  "Jump to source": "स्रोत पर जाएं",
  "Confidence": "विश्वसनीयता",
  "Confidence Score": "विश्वसनीयता स्कोर",
  "Suggested Questions": "सुझाए गए प्रश्न",
  "Ask follow-up": "आगे का प्रश्न पूछें",
  "Click to open video player": "वीडियो प्लेयर खोलने हेतु क्लिक करें",
  "Open PDF document at page": "इस पृष्ठ पर PDF खोलें",
  "View slide presentation": "स्लाइड प्रस्तुति देखें",

  // Adaptive Quiz & Flashcards
  "Adaptive Assessment": "अनुकूली मूल्यांकन",
  "Next Question": "अगला प्रश्न",
  "Previous Question": "पिछला प्रश्न",
  "Question": "प्रश्न",
  "Questions": "प्रश्न",
  "Explanation": "विस्तृत व्याख्या",
  "Explanation:": "व्याख्या:",
  "Your Answer": "आपका उत्तर",
  "Correct Answer": "सटीक उत्तर",
  "Correct!": "सटीक एवं सही!",
  "Incorrect": "त्रुटिपूर्ण उत्तर",
  "Score": "प्राप्तांक",
  "Mastery": "दक्षता",
  "Accuracy": "सटीकता",
  "Review Flashcards": "फ़्लैशकार्ड की समीक्षा करें",
  "Flip Card": "कार्ड पलटें",
  "Click to flip card": "कार्ड पलटने के लिए क्लिक करें",
  "Mark as Mastered": "निपुण चिह्नित करें",
  "Needs More Practice": "अधिक अभ्यास की आवश्यकता",
  "Question of": "का प्रश्न",
  "Completed": "संपूर्ण",
  "Time Remaining": "शेष समय",
  "Time Spent": "व्यतीत समय",
  "Select an option": "एक विकल्प चुनें",
  "Submit Answer & Continue": "उत्तर सबमिट करें और आगे बढ़ें",
  "Finish Assessment": "मूल्यांकन समाप्त करें",
  "Diagnostic Breakdown": "निदानात्मक विश्लेषण",
  "Concept Breakdown": "अवधारणावार विश्लेषण",
  "Performance Summary": "प्रदर्शन सारांश",
  "Retake Quiz": "क्विज़ पुनः दें",
  "Return to Dashboard": "डैशबोर्ड पर लौटें",
  "Difficulty Level": "कठिनाई स्तर",
  "Easy": "सरल",
  "Medium": "मध्यम",
  "Hard": "कठिन",
  "Adaptive": "अनुकूली",

  // Assignments & Instructor Portal
  "Delete submission": "प्रस्तुतीकरण हटाएं",
  "Edit submission": "प्रस्तुतीकरण संपादित करें",
  "Submitted": "जमा किया गया",
  "Pending": "लंबित",
  "Pending Grading": "मूल्यांकन प्रतीक्षित",
  "Graded": "मूल्यांकित",
  "Due Date": "अंतिम तिथि",
  "Grade": "प्राप्तांक",
  "Feedback": "प्रशिक्षक प्रतिक्रिया",
  "Teacher Feedback": "अध्यापक प्रतिक्रिया",
  "No assignments found": "कोई असाइनमेंट नहीं मिला",
  "Are you sure you want to delete this submission?": "क्या आप निश्चित रूप से इस प्रस्तुतीकरण को हटाना चाहते हैं?",
  "This action cannot be undone.": "इस क्रिया को पूर्ववत नहीं किया जा सकता।",
  "Upload Solution": "समाधान फ़ाइल अपलोड करें",
  "Submission History": "प्रस्तुतीकरण इतिहास",
  "Class Performance": "कक्षा का प्रदर्शन",
  "Cohort Analytics": "समूह विश्लेषण",
  "Students Enrolled": "नामांकित विद्यार्थी",
  "Assigned Subjects": "सौंपे गए विषय",
  "Create New Assignment": "नया असाइनमेंट बनाएं",
  "Assignment Title": "असाइनमेंट शीर्षक",
  "Description": "विवरण",
  "Due on": "अंतिम तिथि",
  "Max Points": "अधिकतम अंक",
  "View Student Submission": "विद्यार्थी की प्रस्तुति देखें",

  // Pedagogy & Difficulty Descriptors
  "Foundational concepts and definitions": "मूलभूत अवधारणाएं एवं परिभाषाएं",
  "Core terminology and direct definition recall. Tests foundational understanding with balanced, topic-relevant distractors.":
    "मुख्य शब्दावली और प्रत्यक्ष परिभाषा स्मरण। संतुलित और विषय-प्रासंगिक विकल्पों के साथ बुनियादी समझ का परीक्षण करता है।",
  "Applied understanding and analysis": "व्यावहारिक समझ एवं विश्लेषणात्मक चिंतन",
  "Analytical questions requiring cause-and-effect reasoning and concept mapping. Every distractor is structurally equivalent and plausible.":
    "कारण-और-प्रभाव तर्क तथा अवधारणा मानचित्रण की आवश्यकता वाले विश्लेषणात्मक प्रश्न। प्रत्येक विकल्प संरचनात्मक रूप से संतुलित है।",
  "Advanced synthesis and edge cases": "उन्नत संश्लेषण एवं जटिल प्रकरण",
  "Complex multi-source scenarios, edge cases, and synthesis across materials. Grounded directly in exact page numbers and timestamps.":
    "जटिल बहु-स्रोत परिदृश्य और अध्ययन सामग्री का गहरा संश्लेषण। सटीक पृष्ठ संख्याओं और समय-अंकन पर आधारित।",

  // Difficulty Tier Buttons & Badges
  "Select Easy": "सरल चुनें",
  "Select Medium": "मध्यम चुनें",
  "Select Hard": "कठिन चुनें",
  "Selected: Easy": "चयनित: सरल",
  "Selected: Medium": "चयनित: मध्यम",
  "Selected: Hard": "चयनित: कठिन",
  "Select": "चुनें",
  "Selected": "चयनित",
  "Foundational": "बुनियादी",
  "Applied": "व्यावहारिक",
  "Rigorous": "कठिन एवं गहन",
  "Questions Available": "प्रश्न उपलब्ध",
  "Question Available": "प्रश्न उपलब्ध",
  "*required": "*अनिवार्य",
  "required": "अनिवार्य",

  // Quiz Length & Options
  "Quick Sprint (~3 min)": "त्वरित अभ्यास (~3 मिनट)",
  "Standard Assessment (~7 min)": "मानक मूल्यांकन (~7 मिनट)",
  "Comprehensive Diagnostic (~12 min)": "विस्तृत निदानात्मक परीक्षण (~12 मिनट)",
  "5 Questions": "5 प्रश्न",
  "10 Questions": "10 प्रश्न",
  "15 Questions": "15 प्रश्न",
  "Recommended": "अनुशंसित",
  "Selected:": "चयनित:",

  // Footer & Prompts
  "Zero Repeated Questions · Dynamic Mid-Quiz Adaptation": "शून्य दोहराव प्रश्न · गतिशील अनुकूली मूल्यांकन",
  "Zero Repeated Questions": "शून्य दोहराव प्रश्न",
  "Dynamic Mid-Quiz Adaptation": "गतिशील अनुकूली मूल्यांकन",
  "Please select a topic and difficulty tier to enable the quiz": "क्विज़ प्रारंभ करने हेतु कृपया विषय और कठिनाई स्तर चुनें",
  "Please select a topic to start": "प्रारंभ करने हेतु कृपया एक विषय चुनें",
  "Please select a difficulty level to start": "प्रारंभ करने हेतु कृपया कठिनाई स्तर चुनें",
  "Ready to launch adaptive evaluation grounded in your materials": "आपकी अध्ययन सामग्री पर आधारित अनुकूली मूल्यांकन प्रारंभ करने हेतु तैयार",
  "Preparing your knowledge base...": "आपकी ज्ञान सामग्री तैयार की जा रही है...",
  "Preparing your knowledge base:": "आपकी ज्ञान सामग्री तैयार की जा रही है:",
  "Something went wrong - try refreshing": "कुछ गड़बड़ हुई - कृपया पुनः प्रयास करें",
  "Back to Configuration": "कॉन्फ़िगरेशन पर वापस जाएं",
  "Change Topic / Difficulty": "विषय / कठिनाई बदलें",
  "Loading Quiz Engine...": "क्विज़ इंजन लोड हो रहा है...",
  "Selected Study Material": "चयनित अध्ययन सामग्री",
  "Selected Topic": "चयनित विषय",
  "adaptive questions from": "अनुकूली प्रश्न:",
  "with verified citations.": "सत्यापित संदर्भों के साथ।",
  "knowledge units": "ज्ञान इकाइयाँ",
  "total units extracted": "कुल संकलित इकाइयाँ",
  "Textbook": "पाठ्यपुस्तक",
  "Lecture Video": "व्याख्यान वीडियो",
  "Slide Deck": "स्लाइड डेक",

  // Header Subtitles & Badges
  "Upload PDF textbooks, lecture videos, and slide decks with provenance tracking.":
    "सत्यापित स्रोत ट्रैकिंग के साथ PDF पाठ्यपुस्तकें, व्याख्यान वीडियो और स्लाइड डेक अपलोड करें।",
  "Review task requirements, track upcoming deadlines, and submit deliverables.":
    "कार्य आवश्यकताओं की समीक्षा करें, आगामी अंतिम तिथियों को ट्रैक करें और असाइनमेंट जमा करें।",
  "Ask questions and receive answers linked to exact pages, timestamps, and slides.":
    "प्रश्न पूछें और सटीक पृष्ठों, समय-अंकनों और स्लाइड्स से जुड़े उत्तर प्राप्त करें।",
  "Test your mastery with AI-generated questions backed by course materials.":
    "पाठ्यक्रम सामग्री पर आधारित एआई-निर्मित प्रश्नों के साथ अपनी दक्षता का परीक्षण करें।",
  "Active recall topic cards grounded by verified course citations.":
    "सत्यापित पाठ्यक्रम संदर्भों पर आधारित सक्रिय स्मरण विषय कार्ड।",
  "Assign default curriculum subjects to students and oversee cohort mastery.":
    "विद्यार्थियों को डिफ़ॉल्ट पाठ्यक्रम विषय सौंपें और समूह दक्षता की निगरानी करें।",
  "Review student assignment uploads, evaluate scores, and export Excel gradebooks.":
    "विद्यार्थियों के असाइनमेंट अपलोड की समीक्षा करें, अंकों का मूल्यांकन करें और एक्सेल ग्रेडबुक निर्यात करें।",
  "Ask questions, review lecture provenance, and query course syllabus materials.":
    "प्रश्न पूछें, व्याख्यान स्रोत संदर्भों की समीक्षा करें और पाठ्यक्रम सामग्री में खोजें।",
  "Generate, inspect, and assign adaptive quizzes to cohort students from uploaded sources.":
    "अपलोड किए गए स्रोतों से समूह के विद्यार्थियों के लिए अनुकूली क्विज़ बनाएं, उनका निरीक्षण करें और सौंपें।",
  "Multimodal study platform with verified citation provenance.":
    "सत्यापित संदर्भ स्रोत ट्रैकिंग के साथ मल्टीमॉडल अध्ययन प्लेटफ़ॉर्म।",
  "Source Tracking Verified": "सत्यापित स्रोत ट्रैकिंग",
  "Verified": "सत्यापित",

  // Quiz Progress Header & Actions
  "Topic:": "विषय:",
  "Change Topic": "विषय बदलें",
  "Restart": "पुनः प्रारंभ करें",
  "completed": "संपन्न",
  "remaining": "शेष",

  // Question Card Feedback & Rubrics
  "Diagram Question": "चित्र-आधारित प्रश्न",
  "Full Resolution": "पूर्ण रिज़ॉल्यूशन",
  "Click to inspect diagram in high-resolution Lightbox viewer": "हाई-रिज़ॉल्यूशन लाइटबॉक्स व्यूअर में चित्र देखने हेतु क्लिक करें",
  "Reference visual extracted from uploaded course material.": "अपलोड की गई अध्ययन सामग्री से निकाला गया संदर्भ चित्र।",
  "Type your answer based on course materials...": "पाठ्यक्रम सामग्री के आधार पर अपना उत्तर लिखें...",
  "Check My Answer": "मेरे उत्तर की जांच करें",
  "Full Credit (100%) - Concept Mastered": "पूर्ण अंक (100%) - अवधारणा में निपुण",
  "Substantial Credit": "पर्याप्त अंक",
  "Key Concepts Captured": "मुख्य अवधारणाएं सम्मिलित",
  "Partial Credit": "आंशिक अंक",
  "Review Recommended": "समीक्षा अनुशंसित",
  "Needs Review (0%) - Key Concepts Missed": "समीक्षा आवश्यक (0%) - मुख्य अवधारणाएं छूट गईं",
  "Correct! Mastered concept.": "सटीक उत्तर! अवधारणा में निपुणता प्राप्त।",
  "Incorrect. Conceptual review:": "त्रुटिपूर्ण उत्तर। अवधारणा की समीक्षा करें:",
  "Rubric Evaluation": "रूब्रिक मूल्यांकन",
  "Diagnostic Rationale": "निदानात्मक विश्लेषण",
  "Semantic Rubric Breakdown": "सिमेंटिक रूब्रिक विश्लेषण",
  "Captured Concepts:": "पहचाने गए मुख्य बिंदु:",
  "Missing Concepts:": "छूटे हुए बिंदु:",
  "Model Solution:": "मानक समाधान:",
  "Diagnosed Concept Misconception": "अवधारणा संबंधी भ्रांति का निदान",
  "Verified Course Source:": "सत्यापित पाठ्यक्रम स्रोत:",
  "View Performance Summary": "प्रदर्शन सारांश देखें",

  // Score Summary Card
  "Mastery Achieved": "दक्षता प्राप्त",
  "You demonstrated comprehensive understanding of the multimodal course materials.":
    "आपने मल्टीमॉडल पाठ्यक्रम सामग्री की व्यापक एवं गहन समझ प्रदर्शित की है।",
  "Proficient · Needs Fine-Tuning": "प्रवीण · थोड़े सुधार की आवश्यकता",
  "Good grasp of key formulas, but some slide concepts and lecture timestamps require targeted review.":
    "मुख्य सूत्रों की अच्छी समझ है, परंतु कुछ स्लाइड अवधारणाओं और व्याख्यान समय-अंकनों की लक्षित समीक्षा आवश्यक है।",
  "Foundational Review Needed": "बुनियादी समीक्षा आवश्यक",
  "Consider asking the AdaptFlow AI Tutor to clarify core concepts before retaking.":
    "पुनः प्रयास करने से पहले मुख्य अवधारणाओं को स्पष्ट करने हेतु AdaptFlow AI शिक्षक से पूछें।",
  "Post-Assessment Mastery & Weak Topics Report": "मूल्यांकन-उपरांत दक्षता एवं सुधार क्षेत्र रिपोर्ट",
  "All Tested Topics Mastered": "सभी परीक्षित विषयों में निपुणता प्राप्त",
  "Focus Area(s) Detected": "सुधार क्षेत्र पहचाने गए",
  "Identified Weak Topics (Review Needed)": "पहचाने गए सुधार क्षेत्र (पुनरावलोकन आवश्यक)",
  "None! You answered all concept questions correctly.": "कोई नहीं! आपने अवधारणा के सभी प्रश्नों के सही उत्तर दिए हैं।",
  "Mastered Concepts": "निपुण अवधारणाएं",
  "Work through the remediation plan below to achieve topic mastery.": "विषय में दक्षता प्राप्त करने हेतु नीचे दी गई सुधार योजना का अनुसरण करें।",
  "Diagnosed Concept Misconceptions & Remediation Plan": "पहचानी गई अवधारणा भ्रांतियां एवं सुधार योजना",
  "Section 3.c Rubric Compliance": "अनुभाग 3.c रूब्रिक अनुपालन",
  "No Critical Misconceptions Detected!": "कोई गंभीर वैचारिक भ्रांति नहीं पाई गई!",
  "You answered all diagnostic questions in alignment with primary course textbook slides and lecture transcripts. Excellent conceptual precision!":
    "आपने पाठ्यपुस्तक स्लाइड्स और व्याख्यान प्रतिलेखों के अनुरूप सभी निदानात्मक प्रश्नों के उत्तर दिए। उत्कृष्ट वैचारिक सटीकता!",
  "Your Submission:": "आपकी प्रस्तुति:",
  "Verified Course Standard:": "सत्यापित पाठ्यक्रम मानक:",
  "Diagnosed Misconception Rationale": "निदान की गई भ्रांति का आधार",
  "Discuss with AI Tutor in Source Chat": "स्रोत चैट में एआई शिक्षक से चर्चा करें",
  "Complete Assessment Question Log": "संपूर्ण मूल्यांकन प्रश्न विवरण",
  "Correct": "सटीक",
  "Configure New Quiz": "नया क्विज़ सेट करें",
  "Open Source Chat with AI Tutor": "एआई शिक्षक के साथ स्रोत चैट खोलें",

  // Dashboard Video Ingestion
  "Ingest Lecture Video via Link": "लिंक द्वारा व्याख्यान वीडियो जोड़ें",
  "No need to download videos. Paste any video stream link to parse timestamps and audio.":
    "वीडियो डाउनलोड करने की आवश्यकता नहीं है। समय-अंकन और ऑडियो पार्स करने हेतु कोई भी वीडियो लिंक पेस्ट करें।",
  "Zero Downloads Needed": "डाउनलोड की कोई आवश्यकता नहीं",
  "Video Link:": "वीडियो लिंक:",
  "Fetching video metadata and title...": "वीडियो मेटाडेटा एवं शीर्षक प्राप्त किया जा रहा है...",
  "Title Auto-Detected": "शीर्षक स्वतः पहचाना गया",
  "Video Title (Auto-detected, editable):": "वीडियो शीर्षक (स्वतः पहचाना गया, संपादन योग्य):",
  "Editable": "संपादन योग्य",
  "Ingest Stream...": "स्ट्रीम जोड़ी जा रही है...",
  "Ingest Video": "वीडियो जोड़ें",
  "Default Ingestion Metadata:": "डिफ़ॉल्ट अंतर्ग्रहण मेटाडेटा:",
  "Course:": "पाठ्यक्रम:",
  "Subject:": "विषय:",
  "Upload PDF textbooks, lecture videos, or slide decks to automatically build your structured knowledge base.":
    "अपनी संरचित ज्ञान सामग्री स्वतः तैयार करने के लिए PDF पाठ्यपुस्तकें, व्याख्यान वीडियो या स्लाइड डेक अपलोड करें।",
  "PDF Textbooks": "PDF पाठ्यपुस्तकें",
  "Lecture Videos (.mp4, .vtt)": "व्याख्यान वीडियो (.mp4, .vtt)",
  "Slide Decks (.pptx)": "स्लाइड डेक (.pptx)",

  // Welcome Toast & Alerts
  "Welcome back": "पुनः स्वागत है",
  "You have 2 new assignments and 3 materials ready to study":
    "आपके पास 2 नए असाइनमेंट और अध्ययन हेतु 3 सामग्री तैयार हैं",
  "View Assignments": "असाइनमेंट देखें",
  "Go to Chat": "चैट पर जाएं",
  "Dismiss notification": "अधिसूचना हटाएं",
};

// Normalized lowercase map for case-insensitive lookup
const NORMALIZED_MAP: Record<string, string> = {};
Object.keys(TRANSLATION_MAP).forEach((key) => {
  NORMALIZED_MAP[key.toLowerCase()] = TRANSLATION_MAP[key];
});

// Sorted list of phrases (longest first) for safe substring replacement
const SORTED_PHRASES = Object.keys(TRANSLATION_MAP).sort((a, b) => b.length - a.length);

// Escape string for regular expression
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Regex dynamic templates for patterns with numbers, units, time, coordinates
const DYNAMIC_PATTERNS: Array<{
  regex: RegExp;
  replacer: (...args: string[]) => string;
}> = [
  // "X Questions Available"
  {
    regex: /\b(\d+)\s+Questions?\s+Available\b/gi,
    replacer: (_m, count) => `${count} प्रश्न उपलब्ध`,
  },
  // "Selected: X Questions"
  {
    regex: /\bSelected:\s*(\d+)\s+Questions?\b/gi,
    replacer: (_m, count) => `चयनित: ${count} प्रश्न`,
  },
  // "X Questions"
  {
    regex: /\b(\d+)\s+Questions?\b/gi,
    replacer: (_m, count) => `${count} प्रश्न`,
  },
  // "Select (Easy|Medium|Hard)"
  {
    regex: /\bSelect\s+Easy\b/gi,
    replacer: () => "सरल चुनें",
  },
  {
    regex: /\bSelect\s+Medium\b/gi,
    replacer: () => "मध्यम चुनें",
  },
  {
    regex: /\bSelect\s+Hard\b/gi,
    replacer: () => "कठिन चुनें",
  },
  // "Selected: (Easy|Medium|Hard)"
  {
    regex: /\bSelected:\s*Easy\b/gi,
    replacer: () => "चयनित: सरल",
  },
  {
    regex: /\bSelected:\s*Medium\b/gi,
    replacer: () => "चयनित: मध्यम",
  },
  {
    regex: /\bSelected:\s*Hard\b/gi,
    replacer: () => "चयनित: कठिन",
  },
  // "Start Quiz (X Questions)"
  {
    regex: /\bStart\s+Quiz\s*\(([^)]+)\)/gi,
    replacer: (_m, inner) => `क्विज़ प्रारंभ करें (${inner})`,
  },
  // "Quick Sprint (~X min)"
  {
    regex: /\bQuick\s+Sprint\s*\(([^)]+)\)/gi,
    replacer: (_m, t) => `त्वरित अभ्यास (${t})`,
  },
  // "Standard Assessment (~X min)"
  {
    regex: /\bStandard\s+Assessment\s*\(([^)]+)\)/gi,
    replacer: (_m, t) => `मानक मूल्यांकन (${t})`,
  },
  // "Comprehensive Diagnostic (~X min)"
  {
    regex: /\bComprehensive\s+Diagnostic\s*\(([^)]+)\)/gi,
    replacer: (_m, t) => `विस्तृत निदानात्मक परीक्षण (${t})`,
  },
  // "X knowledge units"
  {
    regex: /\b(\d+)\s+knowledge\s+units\b/gi,
    replacer: (_m, count) => `${count} ज्ञान इकाइयाँ`,
  },
  // "X% completed"
  {
    regex: /\b(\d+)%\s+completed\b/gi,
    replacer: (_m, pct) => `${pct}% संपन्न`,
  },
  // "X remaining"
  {
    regex: /\b(\d+)\s+remaining\b/gi,
    replacer: (_m, count) => `${count} शेष`,
  },
  // "Topic: X"
  {
    regex: /\bTopic:\s*(.*)$/gi,
    replacer: (_m, topic) => `विषय: ${topic}`,
  },
  // "Rubric Match: X%"
  {
    regex: /\bRubric\s+Match:\s*(\d+)%\b/gi,
    replacer: (_m, score) => `रूब्रिक मिलान: ${score}%`,
  },
  // "Zero Repeated Questions · Dynamic Mid-Quiz Adaptation"
  {
    regex: /\bZero\s+Repeated\s+Questions\s*·\s*Dynamic\s+Mid-Quiz\s+Adaptation\b/gi,
    replacer: () => "शून्य दोहराव प्रश्न · गतिशील अनुकूली मूल्यांकन",
  },
  // "X sources selected" or "X source selected"
  {
    regex: /\b(\d+)\s+sources?\s+selected\b/gi,
    replacer: (_m, count) => `${count} स्रोत चयनित`,
  },
  // "X sources"
  {
    regex: /\b(\d+)\s+sources\b/gi,
    replacer: (_m, count) => `${count} स्रोत`,
  },
  // "X Cards / day" or "X Cards"
  {
    regex: /\b(\d+)\s+Cards?\s*\/\s*day\b/gi,
    replacer: (_m, count) => `${count} कार्ड्स / दिन`,
  },
  {
    regex: /\b(\d+)\s+Cards?\b/gi,
    replacer: (_m, count) => `${count} कार्ड्स`,
  },
  // "Question X of Y"
  {
    regex: /\bQuestion\s+(\d+)\s+of\s+(\d+)\b/gi,
    replacer: (_m, q, total) => `प्रश्न ${q} / ${total}`,
  },
  // "Page X"
  {
    regex: /\bPage\s+(\d+)\b/gi,
    replacer: (_m, p) => `पृष्ठ ${p}`,
  },
  // "Slide #X" or "Slide X"
  {
    regex: /\bSlide\s+#?(\d+)\b/gi,
    replacer: (_m, s) => `स्लाइड ${s}`,
  },
  // "Lecture @ X:Y"
  {
    regex: /\bLecture\s+@\s+([0-9:]+)\b/gi,
    replacer: (_m, time) => `व्याख्यान @ ${time}`,
  },
  // "X% Mastery" or "X% Accuracy"
  {
    regex: /\b(\d+)%\s+Mastery\b/gi,
    replacer: (_m, pct) => `${pct}% दक्षता`,
  },
  {
    regex: /\b(\d+)%\s+Accuracy\b/gi,
    replacer: (_m, pct) => `${pct}% सटीकता`,
  },
  // "Confidence: X%"
  {
    regex: /\bConfidence:\s*(\d+)%\b/gi,
    replacer: (_m, pct) => `विश्वसनीयता: ${pct}%`,
  },
  // "X mins read" or "X min read"
  {
    regex: /\b(\d+)\s*mins?\s+read\b/gi,
    replacer: (_m, m) => `${m} मिनट का पठन`,
  },
  // Relative time: "X min ago", "X hours ago", "X days ago"
  {
    regex: /\b(\d+)\s*min(?:utes?)?\s+ago\b/gi,
    replacer: (_m, m) => `${m} मिनट पूर्व`,
  },
  {
    regex: /\b(\d+)\s*hours?\s+ago\b/gi,
    replacer: (_m, h) => `${h} घंटे पूर्व`,
  },
  {
    regex: /\b(\d+)\s*days?\s+ago\b/gi,
    replacer: (_m, d) => `${d} दिन पूर्व`,
  },
  // "Score: X"
  {
    regex: /\bScore:\s*(\d+)\b/gi,
    replacer: (_m, s) => `प्राप्तांक: ${s}`,
  },
];

export function translateText(text: string): string {
  if (!text || typeof text !== "string") return text;

  // Extract leading and trailing whitespace
  const leadingWsMatch = text.match(/^\s*/);
  const trailingWsMatch = text.match(/\s*$/);
  const leadingWs = leadingWsMatch ? leadingWsMatch[0] : "";
  const trailingWs = trailingWsMatch ? trailingWsMatch[0] : "";
  const trimmed = text.trim();

  if (!trimmed) return text;

  // 1. Direct exact match (fast path)
  if (TRANSLATION_MAP[trimmed]) {
    return leadingWs + TRANSLATION_MAP[trimmed] + trailingWs;
  }

  // 2. Normalized lowercase exact match
  const lowerTrimmed = trimmed.toLowerCase();
  if (NORMALIZED_MAP[lowerTrimmed]) {
    return leadingWs + NORMALIZED_MAP[lowerTrimmed] + trailingWs;
  }

  // 3. Punctuation stripping helper: handles strings like "Search...", "Active:", "(Optional)"
  const punctMatch = trimmed.match(/^([(\["']*)(.*?)([:.!?)"']*)$/);
  if (punctMatch) {
    const [, prefixPunct, coreContent, suffixPunct] = punctMatch;
    const coreTrimmed = coreContent.trim();
    if (coreTrimmed) {
      if (TRANSLATION_MAP[coreTrimmed]) {
        return (
          leadingWs +
          prefixPunct +
          TRANSLATION_MAP[coreTrimmed] +
          suffixPunct +
          trailingWs
        );
      }
      if (NORMALIZED_MAP[coreTrimmed.toLowerCase()]) {
        return (
          leadingWs +
          prefixPunct +
          NORMALIZED_MAP[coreTrimmed.toLowerCase()] +
          suffixPunct +
          trailingWs
        );
      }
    }
  }

  // 4. Dynamic template pattern replacements
  let result = trimmed;
  for (const { regex, replacer } of DYNAMIC_PATTERNS) {
    if (regex.test(result)) {
      result = result.replace(regex, replacer as any);
    }
  }

  // 5. Multi-phrase replacement (longest matches first)
  for (const phrase of SORTED_PHRASES) {
    if (phrase.length < 3) continue; // skip single letters or tiny words
    if (result.includes(phrase)) {
      const escaped = escapeRegExp(phrase);
      const isWord = /^[A-Za-z0-9 ]+$/.test(phrase);
      const regex = isWord
        ? new RegExp(`\\b${escaped}\\b`, "g")
        : new RegExp(escaped, "g");
      result = result.replace(regex, TRANSLATION_MAP[phrase]);
    }
  }

  return leadingWs + result + trailingWs;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const originalTextMap = useRef(new WeakMap<Text, string>());
  const originalPlaceholderMap = useRef(new WeakMap<HTMLElement, string>());
  const isTranslatingRef = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adaptflow_language") as SupportedLanguage | null;
      if (saved === "hi" || saved === "en") {
        setLanguageState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem("adaptflow_language", newLang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLang;
      }
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (keyOrText: string): string => {
      if (language === "en") return keyOrText;
      return translateText(keyOrText);
    },
    [language]
  );

  // Check whether a DOM node is in the Sidebar or is a Heading
  // Strict rule: Sidebar & all Headings stay in English ONLY
  const isExcluded = useCallback((node: Node): boolean => {
    const el =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;

    if (!el) return true;

    // 1. Sidebar exclusion (desktop aside, rail, mobile navigation, history panel drawer)
    if (
      el.closest(
        "aside, [data-sidebar], .sidebar, nav[aria-label*='Mobile'], nav[aria-label*='Sidebar']"
      )
    ) {
      return true;
    }

    // 2. All Headings exclusion (h1 to h6, role=heading, .heading, data-heading)
    if (
      el.closest("h1, h2, h3, h4, h5, h6, [role='heading'], .heading, [data-heading]")
    ) {
      return true;
    }

    // 3. Technical syntax, scripts, SVGs, math formulas, focused inputs
    if (
      el.closest(
        "script, style, code, pre, svg, math, noscript, kbd, samp"
      )
    ) {
      return true;
    }

    return false;
  }, []);

  // Translate a single text node
  const applyTextTranslation = useCallback(
    (node: Text) => {
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      if (isExcluded(node)) return;

      const currentVal = node.nodeValue;

      // If the node contains Latin letters, React may have re-rendered with new English text
      if (/[A-Za-z]/.test(currentVal)) {
        originalTextMap.current.set(node, currentVal);
      } else if (!originalTextMap.current.has(node)) {
        originalTextMap.current.set(node, currentVal);
      }

      const original = originalTextMap.current.get(node) || currentVal;
      const translated = translateText(original);
      if (node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    },
    [isExcluded]
  );

  // Restore a single text node back to English
  const restoreTextNode = useCallback((node: Text) => {
    if (originalTextMap.current.has(node)) {
      const original = originalTextMap.current.get(node);
      if (original !== undefined && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    }
  }, []);

  // Translate input/textarea placeholder
  const applyPlaceholderTranslation = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      if (!el.placeholder || !el.placeholder.trim()) return;
      if (isExcluded(el)) return;

      if (!originalPlaceholderMap.current.has(el)) {
        originalPlaceholderMap.current.set(el, el.placeholder);
      }

      const orig = originalPlaceholderMap.current.get(el) || el.placeholder;
      const translated = translateText(orig);
      if (el.placeholder !== translated) {
        el.placeholder = translated;
      }
    },
    [isExcluded]
  );

  // Restore input/textarea placeholder
  const restorePlaceholder = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      if (originalPlaceholderMap.current.has(el)) {
        const orig = originalPlaceholderMap.current.get(el);
        if (orig !== undefined && el.placeholder !== orig) {
          el.placeholder = orig;
        }
      }
    },
    []
  );

  // Walk entire subtree
  const walkTree = useCallback(
    (root: Node, action: "translate" | "restore") => {
      if (isExcluded(root)) return;

      // Handle element-specific attributes (placeholders)
      if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as HTMLElement;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
          if (action === "translate") {
            applyPlaceholderTranslation(inputEl);
          } else {
            restorePlaceholder(inputEl);
          }
        }
      }

      // Handle text nodes
      if (root.nodeType === Node.TEXT_NODE) {
        if (action === "translate") {
          applyTextTranslation(root as Text);
        } else {
          restoreTextNode(root as Text);
        }
        return;
      }

      // Traverse children
      const children = root.childNodes;
      for (let i = 0; i < children.length; i++) {
        walkTree(children[i], action);
      }
    },
    [
      isExcluded,
      applyPlaceholderTranslation,
      restorePlaceholder,
      applyTextTranslation,
      restoreTextNode,
    ]
  );

  // Effect to perform translation or restoration when language changes or DOM updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (language === "hi") {
      isTranslatingRef.current = true;
      walkTree(document.body, "translate");
      isTranslatingRef.current = false;

      // Observe future DOM changes (new elements, modals, navigation, React text updates)
      const observer = new MutationObserver((mutations) => {
        if (isTranslatingRef.current) return;
        isTranslatingRef.current = true;

        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((added) => {
              walkTree(added, "translate");
            });
          } else if (mutation.type === "characterData") {
            const target = mutation.target;
            if (target.nodeType === Node.TEXT_NODE) {
              applyTextTranslation(target as Text);
            }
          }
        }

        isTranslatingRef.current = false;
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
      };
    } else {
      // Language is English: Restore all original text
      isTranslatingRef.current = true;
      walkTree(document.body, "restore");
      isTranslatingRef.current = false;
    }
  }, [language, walkTree, applyTextTranslation]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
