# Requirements Document

## Introduction

The Living Profile feature enables DigitalMe to continuously learn and adapt from user conversations in the Mirror Interface. Rather than relying solely on initial data source analysis (Gmail, GitHub, blogs), the system will collect user messages during ongoing conversations, periodically analyze them in batches, and refine the user's styleProfile to create an increasingly personalized AI reflection. This feature transforms DigitalMe from a static mirror into an evolving digital doppelgänger that becomes more accurate with every interaction.

## Glossary

- **Living Profile System**: The complete feature that enables continuous learning from user conversations
- **Message Collector**: Frontend component that accumulates user messages in browser memory
- **Refinement Batch**: A collection of user messages sent to the backend for style analysis
- **Profile Refiner**: Backend service that updates an existing styleProfile based on new text samples
- **Refinement Endpoint**: Backend API endpoint (`/api/profile/refine`) that processes refinement requests
- **Profile Completeness Score**: A percentage value (0-100) indicating how much data has been analyzed
- **Confidence Score**: A numeric value (0-1) indicating how stable each style attribute is
- **Learning Toggle**: UI control that enables or disables real-time learning
- **Delta Report**: A summary of changes made to the styleProfile during refinement
- **Quality Filter**: Logic that excludes low-quality messages from analysis
- **Frontend Client**: The React application running in the user's browser
- **Backend Service**: The Node.js/Express server that processes API requests

## Requirements

### Requirement 1

**User Story:** As a DigitalMe user, I want the AI to learn from my ongoing conversations, so that it becomes more personalized over time without requiring me to connect additional data sources.

#### Acceptance Criteria

1. WHEN the user sends a message in the Mirror Interface, THE Message Collector SHALL store the message text in browser memory
2. WHILE the Learning Toggle is enabled, THE Message Collector SHALL accumulate user messages into a Refinement Batch
3. WHEN the Refinement Batch contains 10 or more messages, THE Frontend Client SHALL send the batch to the Refinement Endpoint
4. WHEN 5 minutes of user inactivity have elapsed AND the Refinement Batch contains at least 1 message, THE Frontend Client SHALL send the batch to the Refinement Endpoint
5. WHEN the Refinement Endpoint returns an updated styleProfile, THE Frontend Client SHALL save the updated profile to localStorage

### Requirement 2

**User Story:** As a DigitalMe user, I want control over whether the system learns from my conversations, so that I can maintain privacy and control over my digital profile.

#### Acceptance Criteria

1. THE Settings Panel SHALL display a Learning Toggle control labeled "Enable Real-Time Learning"
2. WHEN the user disables the Learning Toggle, THE Message Collector SHALL stop accumulating new messages
3. WHEN the user disables the Learning Toggle, THE Frontend Client SHALL discard any pending Refinement Batch without sending it to the backend
4. WHEN the user enables the Learning Toggle, THE Message Collector SHALL resume accumulating messages from that point forward
5. THE Frontend Client SHALL persist the Learning Toggle state in localStorage

### Requirement 3

**User Story:** As a DigitalMe user, I want to see evidence that the system is learning from me, so that I understand the value of the feature and feel confident in its operation.

#### Acceptance Criteria

1. THE Profile Summary component SHALL display a Profile Completeness Score as a percentage value
2. WHEN the Refinement Endpoint successfully updates the styleProfile, THE Frontend Client SHALL display a subtle notification reading "Style profile updated based on recent conversation"
3. THE Profile Summary component SHALL display a "Words Analyzed" counter showing the total number of words processed
4. WHEN the Profile Completeness Score increases, THE Frontend Client SHALL animate the score change over 1 second
5. THE notification SHALL automatically dismiss after 5 seconds

### Requirement 4

**User Story:** As a backend developer, I want a dedicated API endpoint for profile refinement, so that the system can update existing profiles efficiently without re-analyzing all historical data.

#### Acceptance Criteria

1. THE Backend Service SHALL expose a POST endpoint at `/api/profile/refine`
2. WHEN the Refinement Endpoint receives a request, THE Backend Service SHALL validate that the request body contains a `currentProfile` object and a `newMessages` array
3. WHEN the request validation fails, THE Refinement Endpoint SHALL return a 400 status code with an error message
4. WHEN the request validation succeeds, THE Profile Refiner SHALL analyze the newMessages array and compute style adjustments
5. THE Refinement Endpoint SHALL return a JSON response containing the updated styleProfile and a Delta Report

### Requirement 5

**User Story:** As a backend developer, I want the Profile Refiner to intelligently merge new data with existing profiles, so that the system refines rather than replaces user preferences.

#### Acceptance Criteria

1. WHEN the Profile Refiner processes a Refinement Batch, THE Profile Refiner SHALL apply a confidence-weighted adjustment to each style attribute
2. WHEN a style attribute has a Confidence Score above 0.8, THE Profile Refiner SHALL limit adjustments to a maximum of 5% change per refinement
3. WHEN a style attribute has a Confidence Score below 0.5, THE Profile Refiner SHALL allow adjustments up to 20% change per refinement
4. THE Profile Refiner SHALL increase the Confidence Score for each attribute by 0.05 after each successful refinement, capped at 1.0
5. THE Profile Refiner SHALL update the Profile Completeness Score based on the total word count analyzed

### Requirement 6

**User Story:** As a DigitalMe user, I want the system to ignore low-quality messages during learning, so that casual acknowledgments like "ok" or "lol" don't dilute my style profile.

#### Acceptance Criteria

1. WHEN the Message Collector receives a user message, THE Quality Filter SHALL check if the message contains 10 or more words
2. WHEN a message contains fewer than 10 words, THE Message Collector SHALL exclude it from the Refinement Batch
3. WHEN a message contains only whitespace or punctuation, THE Message Collector SHALL exclude it from the Refinement Batch
4. THE Quality Filter SHALL count contractions (e.g., "don't", "it's") as single words
5. THE Message Collector SHALL include messages that contain code blocks regardless of word count

### Requirement 7

**User Story:** As a DigitalMe user, I want the system to handle refinement failures gracefully, so that my existing profile is never corrupted or lost.

#### Acceptance Criteria

1. WHEN the Refinement Endpoint returns an error response, THE Frontend Client SHALL retain the current styleProfile without modification
2. WHEN the Refinement Endpoint returns an error response, THE Frontend Client SHALL display an error notification reading "Unable to update profile. Your current profile is unchanged."
3. WHEN a network error occurs during refinement, THE Frontend Client SHALL retry the request once after a 2-second delay
4. WHEN the retry fails, THE Frontend Client SHALL discard the Refinement Batch and log the error to the browser console
5. THE Backend Service SHALL validate the structure of the updated styleProfile before returning it to the Frontend Client

### Requirement 8

**User Story:** As a DigitalMe user, I want to see what changed in my profile after a refinement, so that I understand how the system is learning from me.

#### Acceptance Criteria

1. THE Refinement Endpoint SHALL include a Delta Report in the response body
2. THE Delta Report SHALL list each style attribute that changed, showing the old value and new value
3. WHEN the user clicks the profile update notification, THE Frontend Client SHALL display a modal showing the Delta Report
4. THE Delta Report modal SHALL display changes in a human-readable format (e.g., "Formality: 0.7 → 0.65")
5. THE Delta Report modal SHALL include a "Dismiss" button that closes the modal

### Requirement 9

**User Story:** As a backend developer, I want the Profile Refiner to use the existing StyleAnalyzer service, so that refinement analysis is consistent with initial profile creation.

#### Acceptance Criteria

1. THE Profile Refiner SHALL use the same text analysis logic as the existing StyleAnalyzer service
2. WHEN the Profile Refiner analyzes newMessages, THE Profile Refiner SHALL concatenate all messages into a single text sample
3. THE Profile Refiner SHALL extract tone, formality, sentence length, and vocabulary patterns from the text sample
4. THE Profile Refiner SHALL merge the extracted patterns with the currentProfile using confidence-weighted averaging
5. THE Profile Refiner SHALL preserve all coding style attributes from the currentProfile without modification

### Requirement 10

**User Story:** As a DigitalMe user, I want the learning feature to work seamlessly across browser sessions, so that my profile continues to improve even if I close and reopen the application.

#### Acceptance Criteria

1. WHEN the Frontend Client loads, THE Frontend Client SHALL retrieve the Learning Toggle state from localStorage
2. WHEN the Frontend Client loads, THE Frontend Client SHALL retrieve the current styleProfile from localStorage
3. WHEN the user closes the browser with a pending Refinement Batch, THE Frontend Client SHALL discard the batch without sending it
4. WHEN the user reopens the browser, THE Message Collector SHALL start with an empty Refinement Batch
5. THE Frontend Client SHALL persist the updated styleProfile to localStorage immediately after receiving it from the Refinement Endpoint
