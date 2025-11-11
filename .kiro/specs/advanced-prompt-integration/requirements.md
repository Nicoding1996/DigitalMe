# Requirements Document

## Introduction

The advanced style analysis feature successfully collects rich linguistic data (signature phrases, idiosyncrasies, contextual patterns, thought flow), but the AI responses do not reflect this data because the `buildMetaPrompt()` function only uses basic style profile properties. This feature will integrate advanced analysis data into the prompt construction to enable truly personalized AI responses.

## Glossary

- **buildMetaPrompt**: Backend function that constructs the dynamic prompt sent to Gemini API
- **Advanced Analysis Data**: Rich linguistic patterns including signature phrases, idiosyncrasies, contextual vocabulary, and thought flow patterns
- **Style Profile**: Complete user profile object containing both basic (writing/coding) and advanced analysis data
- **Meta-Prompt**: The constructed prompt that combines user request with style instructions

## Requirements

### Requirement 1

**User Story:** As a user who has completed advanced style analysis, I want the AI to use my signature phrases and unique expressions, so that responses feel authentically like me

#### Acceptance Criteria

1. WHEN advanced analysis data contains signature phrases, THE buildMetaPrompt function SHALL include these phrases in the meta-prompt with their frequency and category
2. WHEN generating responses, THE Gemini API SHALL receive explicit instructions to incorporate signature phrases naturally
3. WHEN signature phrases are present, THE AI responses SHALL use at least one signature phrase per response where contextually appropriate
4. THE buildMetaPrompt function SHALL format signature phrases as examples with usage guidance

### Requirement 2

**User Story:** As a user with distinctive writing quirks, I want the AI to mirror my idiosyncrasies, so that the digital twin captures my unique voice

#### Acceptance Criteria

1. WHEN advanced analysis data contains idiosyncrasies, THE buildMetaPrompt function SHALL include each idiosyncrasy with its example text and explanation
2. THE buildMetaPrompt function SHALL provide clear instructions on how to replicate each idiosyncrasy type
3. WHEN idiosyncrasies include code-switching, THE meta-prompt SHALL instruct the AI to mix languages naturally
4. WHEN idiosyncrasies include onomatopoeia, THE meta-prompt SHALL instruct the AI to use expressive sounds
5. THE buildMetaPrompt function SHALL limit idiosyncrasy examples to the top 5 most frequent patterns

### Requirement 3

**User Story:** As a user who writes in different contexts, I want the AI to adapt vocabulary based on the conversation topic, so that responses match my contextual language patterns

#### Acceptance Criteria

1. WHEN advanced analysis data contains contextual patterns, THE buildMetaPrompt function SHALL include vocabulary for each context type (technical, personal, creative)
2. THE buildMetaPrompt function SHALL instruct the AI to select vocabulary based on the user's request context
3. WHEN the user request is technical, THE AI SHALL prioritize technical vocabulary from contextual patterns
4. WHEN the user request is personal, THE AI SHALL prioritize personal vocabulary from contextual patterns
5. THE buildMetaPrompt function SHALL format contextual vocabulary as categorized lists

### Requirement 4

**User Story:** As a user with a specific thought flow pattern, I want the AI to structure responses using my transition style and parenthetical usage, so that the writing rhythm matches mine

#### Acceptance Criteria

1. WHEN advanced analysis data contains thought patterns, THE buildMetaPrompt function SHALL include flow score and transition style
2. WHEN transition style is "abrupt", THE meta-prompt SHALL instruct the AI to use short, direct transitions
3. WHEN parenthetical frequency is high, THE meta-prompt SHALL instruct the AI to use parenthetical asides
4. WHEN flow score is above 80, THE meta-prompt SHALL instruct the AI to maintain smooth, connected prose
5. THE buildMetaPrompt function SHALL translate numeric scores into actionable writing instructions

### Requirement 5

**User Story:** As a user without advanced analysis data, I want the system to gracefully fall back to basic style profile, so that the AI still works when advanced analysis is unavailable

#### Acceptance Criteria

1. WHEN styleProfile.advanced is null or undefined, THE buildMetaPrompt function SHALL use only basic writing and coding style properties
2. WHEN styleProfile.advanced exists but is empty, THE buildMetaPrompt function SHALL use only basic style properties
3. THE buildMetaPrompt function SHALL not throw errors when advanced analysis data is missing
4. THE buildMetaPrompt function SHALL log when falling back to basic profile mode
5. THE meta-prompt SHALL remain coherent and functional with or without advanced analysis data
