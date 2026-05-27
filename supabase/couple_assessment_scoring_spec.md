# Couple Assessment Scoring Spec

## Purpose
This spec defines the partner-to-partner scoring layer that sits on top of each individual assessment profile.

## Inputs
For each partner:
- assessment_id
- individual profile
- raw dimension scores
- band per dimension
- overall individual score

## Outputs
For the couple:
- couple compatibility score
- dimension-by-dimension comparisons
- shared strengths
- shared growth areas
- asymmetry flags
- relationship pattern label
- action plan
- conversation scripts
- short narrative summary

## Core calculation
For each shared dimension:
- leftScore = Partner A dimension score
- rightScore = Partner B dimension score
- gap = abs(leftScore - rightScore)
- alignment = 100 - gap
- average = (leftScore + rightScore) / 2
- floor = min(leftScore, rightScore)

### Default couple score formula
```
coupleScore = (average * averageWeight) + (alignment * alignmentWeight) + (floor * floorWeight)
```

### Default weights
- averageWeight = 0.40
- alignmentWeight = 0.35
- floorWeight = 0.25

## Assessment-specific tuning
Use stronger floor weighting for:
- attachment-style
- trust-vulnerability
- intimacy-closeness
- gottman-four-horsemen
- conflict-resolution
- sexual-compatibility

Use stronger alignment weighting for:
- love-languages
- values-alignment
- shared-meaning
- financial-values

## Shared strengths
A dimension is a shared strength when:
- both partners score >= shared_strength_threshold
- gap <= high_gap_threshold / 2

## Shared growth areas
A dimension is a shared growth area when:
- either partner score <= shared_growth_threshold
- or gap >= high_gap_threshold

## Asymmetry flags
Create a flag when:
- gap >= high_gap_threshold
- or one partner is above 70 and the other is below 50

## Relationship patterns
Pattern detection should classify the couple into one main pattern when possible:
- secure-foundation
- pursue-withdraw
- repair-deficit
- values-drift
- trust-fragile
- reconnection-opportunity

## Feedback rules
### Attachment-style
- anxious + avoidant high => pursue/withdraw
- both low => secure foundation
- high mismatch => reassure + space plan

### Love languages
- score by alignment and reciprocity
- surface the top 1-2 love languages for each partner
- explain how to express care in the other person’s preferred language

### Conflict / Horsemen
- lower scores are more important than the average
- strong warning if contempt or stonewalling is elevated
- always include a repair step

### Trust / Vulnerability / Intimacy
- floor score matters most
- if either partner is low, call out safety work first

### Values / Shared Meaning
- compare direction, not just intensity
- offer a shared operating plan

## Required storage
Persist the couple result in `couple_results` with:
- compatibility score
- partner profiles
- dimension comparisons
- pattern key/title/summary
- shared strengths/growth areas
- action plan
- scripts
- narrative summary

## Recommended implementation order
1. Compute both individual profiles
2. Compute per-dimension comparisons
3. Detect pattern
4. Generate action plan and scripts
5. Store result
6. Render the couple result screen
