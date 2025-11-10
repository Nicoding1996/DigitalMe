# Requirements Document - Advanced Style Analysis

## Introduction

The Advanced Style Analysis feature extends DigitalMe's style profiling capabilities beyond surface-level attributes (tone, formality, sentence length) to capture deeper personality traits, unique expressions, and thought patterns. This enhancement enables the AI doppelgänger to more authentically mirror the user's distinctive voice by identifying signature phrases, writing quirks, and contextual patterns that make each person's communication style unique.

## Glossary

- **System**: The DigitalMe application (frontend and backend)
- **User**: A person using DigitalMe to create their digital doppelgänger
- **Style Profile**: The data structure containing all analyzed writing and coding style attributes
- **Source Text**: User-provided writing samples (emails, text, blog posts) used for analysis
- **Phrase Pattern**: A recurring multi-word expression or transition phrase used by the user
- **Thought Pattern**: The structural way a user organizes and connects ideas in writing
- **Personality Marker**: A distinctive writing quirk or self-referential comment that reveals personality
- **NLP Service**: Natural Language Processing service (Gemini API) used for advanced text analysis
- **Analysis Session**: A single execution of style analysis on one or more source texts

## Requirements

### Requirement 1: Phrase Pattern Detection

**User Story:** As a user, I want the system to identify my unique expressions and catchphrases, so that my AI doppelgänger uses the same distinctive language I do.

#### Acceptance Criteria

1. WHEN the System analyzes Source Text, THE System SHALL extract recurring multi-word phrases that appear at least twice across the text
2. WHEN the System identifies phrase patterns, THE System SHALL categorize them as signature expressions, transition phrases, or filler phrases
3. WHEN the System detects transition phrases, THE System SHALL identify phrases like "I think", "kind of", "I would say", "to be honest", "basically"
4. WHEN the System completes phrase analysis, THE System SHALL store the top 10 most frequent phrases in the Style Profile
5. WHEN the System stores phrase patterns, THE System SHALL include frequency count and category for each phrase

### Requirement 2: Thought Flow Analysis

**User Story:** As a user, I want the system to understand how I structure my thoughts, so that my AI doppelgänger organizes ideas the same way I do.

#### Acceptance Criteria

1. WHEN the System analyzes Source Text, THE System SHALL detect whether the writing style is stream-of-consciousness or structured
2. WHEN the System identifies thought flow patterns, THE System SHALL measure the frequency of topic transitions within paragraphs
3. WHEN the System detects parenthetical patterns, THE System SHALL count the usage of parentheses, em-dashes, and nested clauses
4. WHEN the System analyzes sentence connections, THE System SHALL identify how the user links ideas (conjunctions, transitions, abrupt shifts)
5. WHEN the System completes thought flow analysis, THE System SHALL assign a thought flow score from 0 (highly structured) to 100 (stream-of-consciousness)

### Requirement 3: Personality Quirk Detection

**User Story:** As a user, I want the system to capture my writing quirks and self-aware comments, so that my AI doppelgänger reflects my personality authenticity.

#### Acceptance Criteria

1. WHEN the System analyzes Source Text, THE System SHALL identify self-referential comments about writing style (e.g., "I make a lot of grammar mistakes")
2. WHEN the System detects humor patterns, THE System SHALL identify sarcasm markers, self-deprecating humor, and joke structures
3. WHEN the System finds personal context mentions, THE System SHALL extract references to personal traits (e.g., "because of my ADD", "I'm dyslexic")
4. WHEN the System identifies quirks, THE System SHALL store up to 5 personality markers in the Style Profile
5. WHEN the System stores personality markers, THE System SHALL include the original text snippet and marker type

### Requirement 4: Contextual Pattern Analysis

**User Story:** As a user, I want the system to understand how my writing changes based on context, so that my AI doppelgänger adapts appropriately to different situations.

#### Acceptance Criteria

1. WHEN the System analyzes multiple Source Texts, THE System SHALL detect topic categories (technical, personal, professional, creative)
2. WHEN the System identifies contextual variations, THE System SHALL measure formality differences across topic categories
3. WHEN the System detects expertise areas, THE System SHALL identify topics where the user uses more technical vocabulary
4. WHEN the System analyzes emotional tone, THE System SHALL detect sentiment variations by context (enthusiastic, neutral, critical)
5. WHEN the System completes contextual analysis, THE System SHALL store context-specific style variations in the Style Profile

### Requirement 5: NLP Service Integration

**User Story:** As a developer, I want to use the Gemini API for advanced text analysis, so that the system can perform sophisticated NLP without building custom models.

#### Acceptance Criteria

1. WHEN the System performs advanced analysis, THE System SHALL send Source Text to the NLP Service with structured prompts
2. WHEN the System calls the NLP Service, THE System SHALL include analysis type (phrase detection, thought flow, personality quirks, contextual patterns)
3. WHEN the NLP Service returns results, THE System SHALL parse the structured response into the Style Profile format
4. WHEN the NLP Service call fails, THE System SHALL retry up to 2 times with exponential backoff
5. IF the NLP Service fails after retries, THEN THE System SHALL log the error and continue with basic style analysis

### Requirement 6: Profile Data Structure Extension

**User Story:** As a developer, I want to extend the Style Profile data structure, so that advanced analysis results can be stored and retrieved.

#### Acceptance Criteria

1. WHEN the System creates a Style Profile, THE System SHALL include an `advanced` object with fields for phrases, thoughtPatterns, personalityMarkers, and contextualPatterns
2. WHEN the System stores phrase patterns, THE System SHALL use an array of objects with fields: phrase, frequency, category
3. WHEN the System stores thought patterns, THE System SHALL use an object with fields: flowScore, parentheticalFrequency, transitionStyle
4. WHEN the System stores personality markers, THE System SHALL use an array of objects with fields: text, type, context
5. WHEN the System stores contextual patterns, THE System SHALL use an object mapping topic categories to style variations

### Requirement 7: Analysis Performance

**User Story:** As a user, I want advanced analysis to complete within a reasonable time, so that I don't wait too long during onboarding.

#### Acceptance Criteria

1. WHEN the System performs advanced analysis on text under 1000 words, THE System SHALL complete within 10 seconds
2. WHEN the System performs advanced analysis on text between 1000-5000 words, THE System SHALL complete within 30 seconds
3. WHEN the System analyzes text over 5000 words, THE System SHALL process in chunks and show progress updates
4. WHEN the System performs advanced analysis, THE System SHALL run it in parallel with basic style analysis
5. WHEN the System completes advanced analysis, THE System SHALL merge results with the existing Style Profile without overwriting basic attributes

### Requirement 8: User Control and Privacy

**User Story:** As a user, I want control over advanced analysis, so that I can opt-in or skip this feature based on my privacy preferences.

#### Acceptance Criteria

1. WHEN the System presents onboarding options, THE System SHALL show an opt-in checkbox for advanced style analysis
2. WHEN the User opts out of advanced analysis, THE System SHALL perform only basic style analysis
3. WHEN the System performs advanced analysis, THE System SHALL not send personally identifiable information to the NLP Service
4. WHEN the System stores personality markers, THE System SHALL anonymize any personal context mentions before storage
5. WHEN the User views their Style Profile, THE System SHALL display advanced analysis results in a separate expandable section
