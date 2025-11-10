# Requirements Document: Multi-Source Style Merging

## Introduction

The Multi-Source Style Merging feature addresses a critical limitation in the current DigitalMe system: the priority-based selection of writing styles from multiple data sources. Currently, when a user provides multiple sources (Gmail, Text samples, Blog posts), the system uses only the highest-priority source's style analysis and discards the others. This results in lost data and less accurate style profiles.

This feature will implement an intelligent weighted averaging algorithm that blends writing styles from all available sources, producing a more accurate and nuanced representation of the user's writing patterns. The system will assign quality-based weights to different source types, merge style attributes using appropriate strategies, and provide confidence scoring to indicate profile accuracy.

## Glossary

- **StyleAnalyzer**: The frontend service responsible for analyzing user-provided data sources and building style profiles
- **Writing Style Profile**: A structured object containing tone, formality, sentence length, vocabulary preferences, and avoidance patterns
- **Data Source**: A type of user input (Gmail, Text Sample, Blog, GitHub) that provides writing or coding samples
- **Priority Selection**: The current algorithm that selects only the highest-priority source's style and ignores others
- **Weighted Averaging**: The proposed algorithm that blends multiple sources using quality-based weights
- **Source Quality Weight**: A numerical value (0.0-1.0) representing the reliability of a data source type
- **Confidence Score**: A percentage (0-100%) indicating the system's confidence in the accuracy of the style profile
- **Style Attribute**: A specific component of writing style (tone, formality, sentence length, vocabulary, avoidance)
- **Merge Strategy**: The algorithm used to combine a specific style attribute from multiple sources

## Requirements

### Requirement 1: Source Quality Weighting

**User Story:** As a user who provides multiple data sources, I want the system to intelligently weight each source based on its quality, so that more reliable sources have greater influence on my style profile.

#### Acceptance Criteria

1. WHEN the StyleAnalyzer processes multiple writing sources, THE StyleAnalyzer SHALL assign a quality weight to each source type based on predefined quality values
2. THE StyleAnalyzer SHALL assign Gmail sources a quality weight of 1.0
3. THE StyleAnalyzer SHALL assign Text Sample sources a quality weight of 0.8
4. THE StyleAnalyzer SHALL assign Blog sources a quality weight of 0.6
5. WHEN calculating the final weight for a source, THE StyleAnalyzer SHALL multiply the quality weight by a quantity factor based on word count

### Requirement 2: Quantity-Based Weight Adjustment

**User Story:** As a user who provides sources with varying amounts of content, I want larger samples to have more influence on my profile, so that the system prioritizes sources with more data.

#### Acceptance Criteria

1. WHEN a writing source contains fewer than 500 words, THE StyleAnalyzer SHALL apply a quantity factor of 0.5 to that source's weight
2. WHEN a writing source contains between 500 and 1500 words, THE StyleAnalyzer SHALL apply a quantity factor of 1.0 to that source's weight
3. WHEN a writing source contains more than 1500 words, THE StyleAnalyzer SHALL apply a quantity factor of 1.5 to that source's weight
4. THE StyleAnalyzer SHALL calculate the final source weight as quality weight multiplied by quantity factor
5. THE StyleAnalyzer SHALL normalize all source weights so they sum to 1.0 before merging

### Requirement 3: Tone Attribute Merging

**User Story:** As a user with multiple writing sources, I want the system to determine my overall tone by considering all sources, so that my profile reflects my most common tone across contexts.

#### Acceptance Criteria

1. WHEN merging tone attributes from multiple sources, THE StyleAnalyzer SHALL use a weighted voting strategy
2. THE StyleAnalyzer SHALL calculate the total weight for each unique tone value across all sources
3. THE StyleAnalyzer SHALL select the tone value with the highest total weight as the merged tone
4. WHEN two or more tone values have equal total weights, THE StyleAnalyzer SHALL select the tone from the highest-quality source
5. THE StyleAnalyzer SHALL support tone values of "conversational", "professional", and "neutral"

### Requirement 4: Formality Attribute Merging

**User Story:** As a user with varying formality levels across sources, I want the system to calculate an average formality level, so that my profile represents my typical formality rather than a single extreme.

#### Acceptance Criteria

1. WHEN merging formality attributes from multiple sources, THE StyleAnalyzer SHALL use a weighted averaging strategy
2. THE StyleAnalyzer SHALL map formality values to numeric scores where casual equals 0, balanced equals 1, and formal equals 2
3. THE StyleAnalyzer SHALL calculate the weighted average of formality scores across all sources
4. THE StyleAnalyzer SHALL map the averaged score back to a formality value where scores less than 0.5 equal casual, scores between 0.5 and 1.5 equal balanced, and scores greater than 1.5 equal formal
5. THE StyleAnalyzer SHALL round the averaged score to two decimal places before mapping

### Requirement 5: Sentence Length Attribute Merging

**User Story:** As a user with different sentence lengths across sources, I want the system to determine my typical sentence length, so that my profile reflects my most common writing pattern.

#### Acceptance Criteria

1. WHEN merging sentence length attributes from multiple sources, THE StyleAnalyzer SHALL use a weighted voting strategy
2. THE StyleAnalyzer SHALL calculate the total weight for each unique sentence length value across all sources
3. THE StyleAnalyzer SHALL select the sentence length value with the highest total weight as the merged sentence length
4. WHEN two or more sentence length values have equal total weights, THE StyleAnalyzer SHALL select the value from the highest-quality source
5. THE StyleAnalyzer SHALL support sentence length values of "short", "medium", and "long"

### Requirement 6: Vocabulary Attribute Merging

**User Story:** As a user with diverse vocabulary across sources, I want the system to combine vocabulary terms from all sources, so that my profile captures the full range of my word choices.

#### Acceptance Criteria

1. WHEN merging vocabulary attributes from multiple sources, THE StyleAnalyzer SHALL use a union strategy
2. THE StyleAnalyzer SHALL collect all unique vocabulary terms from all sources
3. THE StyleAnalyzer SHALL calculate a weight score for each vocabulary term based on the sum of weights from sources containing that term
4. THE StyleAnalyzer SHALL sort vocabulary terms by their weight scores in descending order
5. THE StyleAnalyzer SHALL select the top 4 vocabulary terms with the highest weight scores for the merged profile

### Requirement 7: Avoidance Attribute Merging

**User Story:** As a user who consistently avoids certain writing elements, I want the system to identify only the elements I avoid across all sources, so that my profile accurately reflects my consistent avoidance patterns.

#### Acceptance Criteria

1. WHEN merging avoidance attributes from multiple sources, THE StyleAnalyzer SHALL use an intersection strategy
2. THE StyleAnalyzer SHALL identify avoidance terms that appear in at least 50% of sources
3. WHEN no avoidance terms meet the 50% threshold, THE StyleAnalyzer SHALL include avoidance terms from sources with total weight greater than 0.6
4. WHEN no avoidance terms are identified, THE StyleAnalyzer SHALL set the avoidance attribute to an array containing the single value "none"
5. THE StyleAnalyzer SHALL limit the merged avoidance list to a maximum of 3 terms

### Requirement 8: Confidence Score Calculation

**User Story:** As a user who wants to understand profile accuracy, I want the system to calculate a confidence score based on the number and quality of sources, so that I know how reliable my profile is.

#### Acceptance Criteria

1. WHEN building a style profile from merged sources, THE StyleAnalyzer SHALL calculate a confidence score between 0.0 and 1.0
2. THE StyleAnalyzer SHALL set the base confidence to 0.5 when only one source is available
3. THE StyleAnalyzer SHALL increase confidence by 0.15 for each additional source up to a maximum of 4 sources
4. THE StyleAnalyzer SHALL increase confidence by 0.05 when total word count exceeds 1000 words
5. THE StyleAnalyzer SHALL increase confidence by 0.05 when total word count exceeds 2000 words
6. THE StyleAnalyzer SHALL cap the maximum confidence score at 0.95
7. THE StyleAnalyzer SHALL round the confidence score to two decimal places

### Requirement 9: Source Attribution Metadata

**User Story:** As a user who wants transparency in my profile, I want the system to track which sources contributed to each style attribute, so that I can understand where my profile characteristics come from.

#### Acceptance Criteria

1. WHEN merging style attributes, THE StyleAnalyzer SHALL create a source attribution object for each attribute
2. THE StyleAnalyzer SHALL record the source type and weight contribution for each attribute in the attribution metadata
3. THE StyleAnalyzer SHALL calculate the percentage contribution of each source to each attribute
4. THE StyleAnalyzer SHALL store attribution metadata in the style profile object under a "sourceAttribution" field
5. THE StyleAnalyzer SHALL format attribution percentages as integers between 0 and 100

### Requirement 10: Backward Compatibility

**User Story:** As a user with an existing style profile, I want the new merging algorithm to work with my current data, so that I don't lose my existing profile when the system is updated.

#### Acceptance Criteria

1. WHEN the StyleAnalyzer encounters a single-source profile, THE StyleAnalyzer SHALL process it using the merging algorithm without errors
2. WHEN the StyleAnalyzer processes sources in the legacy format, THE StyleAnalyzer SHALL convert them to the new format before merging
3. THE StyleAnalyzer SHALL maintain the existing profile structure with additional fields for attribution metadata
4. WHEN a source lacks word count metadata, THE StyleAnalyzer SHALL estimate word count as 500 for weight calculation purposes
5. THE StyleAnalyzer SHALL preserve all existing profile fields when adding new attribution metadata

### Requirement 11: Error Handling for Invalid Sources

**User Story:** As a user whose data sources may have incomplete or invalid data, I want the system to handle errors gracefully, so that one bad source doesn't prevent profile creation.

#### Acceptance Criteria

1. WHEN a source lacks required style attributes, THE StyleAnalyzer SHALL exclude that source from merging and log a warning
2. WHEN all sources are invalid, THE StyleAnalyzer SHALL return a default style profile with confidence score of 0.3
3. WHEN a source has an unrecognized tone value, THE StyleAnalyzer SHALL map it to "neutral" before merging
4. WHEN a source has an unrecognized formality value, THE StyleAnalyzer SHALL map it to "balanced" before merging
5. WHEN a source has an unrecognized sentence length value, THE StyleAnalyzer SHALL map it to "medium" before merging

### Requirement 12: Merging Algorithm Integration

**User Story:** As a developer maintaining the codebase, I want the merging algorithm to integrate cleanly with the existing StyleAnalyzer, so that the refactor is maintainable and testable.

#### Acceptance Criteria

1. THE StyleAnalyzer SHALL implement a new function named "mergeWritingStyles" that accepts an array of source objects with metadata
2. THE StyleAnalyzer SHALL refactor the "buildStyleProfile" function to call "mergeWritingStyles" instead of using priority selection
3. THE StyleAnalyzer SHALL maintain the existing function signatures for "buildStyleProfile" to preserve API compatibility
4. THE StyleAnalyzer SHALL extract weight calculation logic into a separate helper function named "calculateSourceWeight"
5. THE StyleAnalyzer SHALL extract attribute merging logic into separate helper functions for each merge strategy
