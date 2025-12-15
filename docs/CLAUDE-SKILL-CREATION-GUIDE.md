# Claude Code Skill Creation Guide

A comprehensive guide for creating effective Claude Code skills that extend Claude's capabilities with specialized knowledge, workflows, and tool integrations.

---

## Table of Contents

1. [What Are Skills?](#1-what-are-skills)
2. [Skills vs Slash Commands](#2-skills-vs-slash-commands)
3. [Skill Architecture](#3-skill-architecture)
4. [SKILL.md Anatomy](#4-skillmd-anatomy)
5. [Bundled Resources](#5-bundled-resources)
6. [Progressive Disclosure Pattern](#6-progressive-disclosure-pattern)
7. [Core Design Principles](#7-core-design-principles)
8. [Step-by-Step Creation Process](#8-step-by-step-creation-process)
9. [Real-World Examples](#9-real-world-examples)
10. [Common Patterns & Templates](#10-common-patterns--templates)
11. [Validation Checklist](#11-validation-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What Are Skills?

**Claude Code Skills** are modular, self-contained packages that transform Claude from a general-purpose agent into a specialized expert for specific domains or tasks.

### Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Self-contained** | Single skill = one focused capability |
| **Model-invoked** | Claude autonomously decides when to use them |
| **Progressive loading** | Metadata always loaded, body on trigger, resources as needed |
| **Reusable** | Scripts, references, and assets can be used repeatedly |

### What Skills Provide

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL CAPABILITIES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SPECIALIZED WORKFLOWS                                   │
│     └─ Multi-step procedures for specific domains           │
│                                                             │
│  2. TOOL INTEGRATIONS                                       │
│     └─ Instructions for specific file formats/APIs          │
│                                                             │
│  3. DOMAIN EXPERTISE                                        │
│     └─ Company-specific knowledge, schemas, business logic  │
│                                                             │
│  4. BUNDLED RESOURCES                                       │
│     └─ Scripts, references, and assets for complex tasks    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mental Model

Think of skills as **"onboarding guides"** for specific domains—they give Claude procedural knowledge that no model can fully possess out of the box.

---

## 2. Skills vs Slash Commands

Understanding when to use each:

| Feature | Skills | Slash Commands |
|---------|--------|----------------|
| **Invocation** | Model-invoked (automatic) | User-invoked (`/command`) |
| **Trigger** | Metadata description match | Explicit user request |
| **File Location** | `.claude/skills/skill-name/` | `.claude/commands/` |
| **Primary File** | `SKILL.md` | `command-name.md` |
| **Use Case** | Autonomous domain expertise | User-facing utilities |
| **Context Loading** | Progressive (3 levels) | Full file on invocation |

### Decision Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                  WHEN TO USE WHAT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USE SKILLS when:                                           │
│  ├─ Claude should autonomously apply domain expertise       │
│  ├─ Multiple triggers could invoke the same workflow        │
│  ├─ Context should be loaded progressively                  │
│  └─ Resources need lazy loading (scripts, references)       │
│                                                             │
│  USE SLASH COMMANDS when:                                   │
│  ├─ User explicitly requests a specific workflow            │
│  ├─ Action requires user confirmation/initiation            │
│  ├─ One-off utilities (git commit message, PR creation)     │
│  └─ Simple prompts without bundled resources                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Skill Architecture

### Directory Structure

```
skill-name/
├── SKILL.md                    # REQUIRED: Core skill definition
│   ├── YAML frontmatter        #   ├─ name (required)
│   │                           #   └─ description (required)
│   └── Markdown body           #   └─ Instructions & workflows
│
├── scripts/                    # OPTIONAL: Executable code
│   ├── process_data.py
│   ├── validate_input.sh
│   └── transform.js
│
├── references/                 # OPTIONAL: Documentation loaded into context
│   ├── api_docs.md
│   ├── schema.md
│   └── workflows.md
│
└── assets/                     # OPTIONAL: Files used in output (not loaded)
    ├── template.html
    ├── boilerplate/
    └── logo.png
```

### File Organization Rules

**DO include:**
- `SKILL.md` (required)
- Scripts that are reused repeatedly
- Reference documentation Claude needs
- Assets/templates for output generation

**DO NOT include:**
- `README.md` (redundant with SKILL.md)
- `INSTALLATION_GUIDE.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- Any auxiliary documentation

> **Rule**: If a file doesn't directly help Claude execute tasks, it doesn't belong in the skill.

---

## 4. SKILL.md Anatomy

### Structure Overview

```markdown
---
name: skill-name
description: What this skill does and when to use it
---

# Skill Title

[Markdown body with instructions, workflows, and references]
```

### Frontmatter (YAML)

The frontmatter is **critically important**—it's the primary trigger mechanism.

#### Required Fields

| Field | Limit | Purpose |
|-------|-------|---------|
| `name` | 64 chars, lowercase, hyphens/numbers only | Unique skill identifier |
| `description` | 1,024 chars | **Primary trigger mechanism** |

#### Name Conventions

```
✅ GOOD:
   jutsu-creator
   pdf-processor
   bigquery-analyst
   react-component-builder

❌ BAD:
   JutsuCreator          (no camelCase)
   pdf processor         (no spaces)
   pdf_processor         (no underscores)
   my-awesome-skill!!!   (no special chars)
```

#### Description Best Practices

The description must include:
1. **What** the skill does
2. **When** to use it (specific triggers)
3. **Scope** of capabilities

```yaml
# ❌ BAD: Vague, no triggers
description: Helps with PDF files

# ❌ BAD: Only what, no when
description: Processes PDF documents including extraction, rotation, and merging

# ✅ GOOD: What + When + Scope
description: >
  Comprehensive PDF processing including text extraction, page rotation,
  merging, splitting, and form filling. Use when user wants to:
  (1) Extract text or images from PDFs,
  (2) Rotate, merge, or split PDF pages,
  (3) Fill out PDF forms programmatically,
  (4) Convert PDFs to other formats.
```

### Markdown Body

The body contains instructions that load **only after** the skill triggers.

#### Body Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Keep under 500 lines | Minimize context bloat |
| Use imperative form | "Extract text" not "Extracting text" |
| Reference bundled resources | Point to scripts/, references/, assets/ |
| Include examples | Concrete > verbose explanations |
| Structure with headers | Easy navigation and scanning |

#### Body Structure Template

```markdown
# Skill Name

Brief one-line description.

## Quick Start

[Most common workflow in 3-5 steps]

## Workflows

### Workflow A
[Step-by-step instructions]

### Workflow B
[Step-by-step instructions]

## Reference Files

- [api_docs.md](references/api_docs.md) - API specifications
- [examples.md](references/examples.md) - Usage examples

## Scripts

- `scripts/process.py` - Main processing script
- `scripts/validate.sh` - Input validation

## Output Format

[Expected output structure/format]
```

---

## 5. Bundled Resources

### Scripts (`scripts/`)

**Purpose**: Executable code for deterministic, repeatable operations.

#### When to Include Scripts

```
┌─────────────────────────────────────────────────────────────┐
│                 SCRIPT DECISION TREE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Is the same code being rewritten repeatedly?               │
│  ├─ YES → Create a script                                   │
│  └─ NO  → Continue...                                       │
│                                                             │
│  Is deterministic reliability critical?                     │
│  ├─ YES → Create a script                                   │
│  └─ NO  → Continue...                                       │
│                                                             │
│  Are operations fragile/error-prone?                        │
│  ├─ YES → Create a script                                   │
│  └─ NO  → Text instructions may suffice                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Script Examples

```
scripts/
├── rotate_pdf.py           # PDF page rotation
├── extract_text.py         # Text extraction
├── validate_schema.js      # JSON schema validation
├── compress_images.sh      # Batch image compression
└── deploy.sh               # Deployment automation
```

#### Script Benefits

- **Token efficient**: Execute without loading into context
- **Deterministic**: Same input = same output
- **Testable**: Can be validated independently
- **Reusable**: Called multiple times without rewriting

---

### References (`references/`)

**Purpose**: Documentation loaded into context as needed.

#### When to Include References

| Include | Don't Include |
|---------|---------------|
| Database schemas | General programming knowledge |
| API documentation | Common library docs (public) |
| Domain-specific knowledge | Information Claude already knows |
| Company policies/procedures | Obvious instructions |
| Detailed workflow guides | Duplicate of SKILL.md content |

#### Reference Organization Patterns

**Pattern A: By Domain**
```
references/
├── finance.md      # Financial metrics and schemas
├── sales.md        # Sales pipeline definitions
├── product.md      # Product analytics
└── marketing.md    # Campaign tracking
```

**Pattern B: By Complexity**
```
references/
├── quick-start.md  # Basic usage
├── advanced.md     # Complex scenarios
├── api-reference.md # Full API docs
└── troubleshooting.md # Common issues
```

**Pattern C: By Framework/Variant**
```
references/
├── aws.md          # AWS deployment
├── gcp.md          # GCP deployment
├── azure.md        # Azure deployment
└── kubernetes.md   # K8s orchestration
```

#### Reference Best Practices

1. **Keep SKILL.md lean** - Move details to references
2. **No duplication** - Info lives in ONE place
3. **Clear navigation** - Reference files linked from SKILL.md
4. **Table of contents** - For files >100 lines
5. **One level deep** - No nested reference chains

---

### Assets (`assets/`)

**Purpose**: Files used in output, never loaded into context.

#### Asset Types

| Type | Examples | Use Case |
|------|----------|----------|
| **Templates** | HTML, PPTX, DOCX | Document generation |
| **Boilerplate** | React app scaffold | Project initialization |
| **Images** | Logos, icons | Brand assets |
| **Fonts** | TTF, WOFF | Typography |
| **Configs** | JSON, YAML templates | Configuration files |

#### Asset Directory Example

```
assets/
├── templates/
│   ├── report.html
│   ├── invoice.docx
│   └── presentation.pptx
├── boilerplate/
│   ├── react-app/
│   ├── express-api/
│   └── python-cli/
├── brand/
│   ├── logo.png
│   ├── logo.svg
│   └── colors.json
└── fonts/
    └── custom-font.ttf
```

---

## 6. Progressive Disclosure Pattern

Skills use **three-level loading** to manage context efficiently:

```
┌─────────────────────────────────────────────────────────────┐
│              PROGRESSIVE DISCLOSURE LEVELS                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LEVEL 1: METADATA (Always in context)                      │
│  ├─ name + description                                      │
│  ├─ ~100 words                                              │
│  └─ Used for trigger decisions                              │
│                                                             │
│  LEVEL 2: SKILL.MD BODY (Loaded on trigger)                 │
│  ├─ Instructions and workflows                              │
│  ├─ <5,000 words recommended                                │
│  └─ Loaded ONLY after skill triggers                        │
│                                                             │
│  LEVEL 3: BUNDLED RESOURCES (Loaded as needed)              │
│  ├─ scripts/ - Can execute without reading                  │
│  ├─ references/ - Loaded when Claude needs them             │
│  └─ assets/ - Used in output, never loaded                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Context Budget Analogy

Think of context like a **shared budget**:

```
TOTAL CONTEXT WINDOW
├─ System prompt           (fixed cost)
├─ Conversation history    (grows over time)
├─ Other skills metadata   (fixed cost per skill)
├─ YOUR SKILL              (variable cost)
│   ├─ Metadata            (~100 tokens, always)
│   ├─ Body                (~2000 tokens, on trigger)
│   └─ References          (~1000+ tokens, as needed)
└─ User request + response (variable)
```

**Goal**: Minimize your skill's cost while maximizing usefulness.

### Disclosure Patterns

#### Pattern 1: High-Level Guide with References

```markdown
# PDF Processing

## Quick Start
[3-step basic workflow]

## Advanced Features
- **Form Filling**: See [forms.md](references/forms.md)
- **OCR Processing**: See [ocr.md](references/ocr.md)
- **Batch Operations**: See [batch.md](references/batch.md)
```

#### Pattern 2: Conditional Loading

```markdown
# Document Processing

## Creating Documents
Use docx-js for new documents.
Basic example: [inline code]

**For complex formatting**: See [formatting.md](references/formatting.md)
**For tracked changes**: See [redlining.md](references/redlining.md)
```

#### Pattern 3: Domain-Specific Organization

```markdown
# Analytics Skill

## Overview
This skill handles analytics queries across multiple domains.

## Domains
- **Finance queries**: Load [finance.md](references/finance.md)
- **Sales queries**: Load [sales.md](references/sales.md)
- **Product queries**: Load [product.md](references/product.md)
```

---

## 7. Core Design Principles

### Principle 1: Concise is Key

```
┌─────────────────────────────────────────────────────────────┐
│                   CONCISENESS CHECKLIST                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  For EVERY piece of content, ask:                           │
│                                                             │
│  □ Does Claude really need this?                            │
│  □ Does Claude already know this?                           │
│  □ Does this justify its token cost?                        │
│  □ Can this be shorter without losing meaning?              │
│  □ Is this a concrete example vs verbose explanation?       │
│                                                             │
│  DEFAULT ASSUMPTION: Claude is already very smart.          │
│  Only add context Claude doesn't have.                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Principle 2: Appropriate Freedom Levels

Match specificity to task fragility:

| Freedom Level | When to Use | Implementation |
|---------------|-------------|----------------|
| **HIGH** | Multiple valid approaches, context-dependent | Text instructions |
| **MEDIUM** | Preferred pattern exists, some variation OK | Pseudocode, parameters |
| **LOW** | Operations fragile, consistency critical | Specific scripts |

#### Freedom Level Examples

```
HIGH FREEDOM (text instructions):
"Edit the image to improve visual appeal. Consider
brightness, contrast, and color balance."

MEDIUM FREEDOM (pseudocode):
"Resize image to max 1920px width, maintaining aspect ratio.
Apply sharpening filter with strength 0.3-0.5."

LOW FREEDOM (script):
"Run: scripts/resize_image.py --max-width 1920 --sharpen 0.4"
```

### Principle 3: Focused Scope

```
┌─────────────────────────────────────────────────────────────┐
│                    SCOPE GUIDELINES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ONE SKILL = ONE FOCUSED CAPABILITY                         │
│                                                             │
│  ✅ GOOD: Separate, focused skills                          │
│     ├─ pdf-processor                                        │
│     ├─ image-editor                                         │
│     └─ document-writer                                      │
│                                                             │
│  ❌ BAD: One monolithic skill                               │
│     └─ file-processor (PDF + images + docs + spreadsheets)  │
│                                                             │
│  WHY: Focused skills trigger more accurately and            │
│       load only relevant context.                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Principle 4: Clear Trigger Descriptions

All "when to use" information goes in the **description**, not the body.

```yaml
# ❌ WRONG: Triggers in body (body loads AFTER triggering)
---
name: jutsu-creator
description: Creates jutsu for the game.
---
# When to Use
Use this skill when the user wants to create new abilities...

# ✅ CORRECT: Triggers in description
---
name: jutsu-creator
description: >
  Create new jutsu/skills for SHINOBI WAY game.
  Use when user wants to add abilities, techniques,
  jutsu, or combat skills. Guides through all
  parameters and generates TypeScript code.
---
```

---

## 8. Step-by-Step Creation Process

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│               SKILL CREATION WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Understand ──────────────────────────────────────► │
│          Gather concrete usage examples                     │
│                                                             │
│  STEP 2: Plan ────────────────────────────────────────────► │
│          Identify reusable resources                        │
│                                                             │
│  STEP 3: Initialize ──────────────────────────────────────► │
│          Create skill directory structure                   │
│                                                             │
│  STEP 4: Implement ───────────────────────────────────────► │
│          Write SKILL.md and bundled resources               │
│                                                             │
│  STEP 5: Validate ────────────────────────────────────────► │
│          Check structure, test scripts                      │
│                                                             │
│  STEP 6: Iterate ─────────────────────────────────────────► │
│          Refine based on real usage                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 1: Understand with Concrete Examples

**Goal**: Clearly understand how the skill will be used.

#### Questions to Ask

```
FUNCTIONALITY:
- "What functionality should this skill support?"
- "What are the core capabilities needed?"

EXAMPLES:
- "Can you give examples of how this would be used?"
- "What would a user say that should trigger this skill?"

EDGE CASES:
- "What variations might users request?"
- "What should this skill NOT handle?"
```

#### Example: Planning a `pdf-processor` Skill

```
User Examples Gathered:
1. "Help me extract text from this PDF"
2. "Rotate page 3 by 90 degrees"
3. "Merge these 5 PDFs into one"
4. "Fill out this PDF form with my data"
5. "Convert this PDF to images"

Triggers Identified:
- extract, text, content from PDF
- rotate, turn, flip PDF pages
- merge, combine, join PDFs
- fill, complete PDF forms
- convert PDF to image/PNG/JPG
```

---

### Step 2: Plan Reusable Contents

**Goal**: Identify what scripts, references, and assets would help.

#### Analysis Framework

For each example, ask:
1. How would I execute this from scratch?
2. What code would be rewritten each time?
3. What documentation would I need to reference?
4. What templates or assets would help?

#### Example Analysis

```
EXAMPLE: "Rotate page 3 by 90 degrees"

FROM SCRATCH:
1. Install pypdf library
2. Write rotation code
3. Handle page indexing
4. Save output

REUSABLE CONTENT:
- scripts/rotate_pdf.py (same code every time)

---

EXAMPLE: "Fill out this PDF form"

FROM SCRATCH:
1. Identify form fields
2. Map user data to fields
3. Fill and flatten form

REUSABLE CONTENT:
- scripts/fill_form.py
- references/form_field_types.md (field type documentation)
```

#### Planned Structure

```
pdf-processor/
├── SKILL.md
├── scripts/
│   ├── rotate_pdf.py
│   ├── merge_pdfs.py
│   ├── extract_text.py
│   ├── fill_form.py
│   └── convert_to_images.py
└── references/
    ├── form_field_types.md
    └── advanced_operations.md
```

---

### Step 3: Initialize the Skill

**Goal**: Create the skill directory structure.

#### Manual Initialization

```bash
# Create directory structure
mkdir -p .claude/skills/my-skill/{scripts,references,assets}

# Create SKILL.md
touch .claude/skills/my-skill/SKILL.md
```

#### SKILL.md Starter Template

```markdown
---
name: my-skill
description: [WHAT it does]. Use when user wants to [TRIGGER 1], [TRIGGER 2], or [TRIGGER 3].
---

# My Skill

Brief description of what this skill does.

## Quick Start

1. [First step]
2. [Second step]
3. [Third step]

## Workflows

### Workflow A

[Instructions]

### Workflow B

[Instructions]

## Reference Files

- [reference-name.md](references/reference-name.md) - Description

## Scripts

- `scripts/script-name.py` - Description

## Output Format

[Expected output structure]
```

---

### Step 4: Implement the Skill

**Goal**: Write SKILL.md and create bundled resources.

#### Implementation Order

```
1. CREATE BUNDLED RESOURCES FIRST
   ├─ Write scripts (test them!)
   ├─ Write reference documentation
   └─ Add assets/templates

2. THEN WRITE SKILL.MD
   ├─ Frontmatter (name, description)
   ├─ Quick start workflow
   ├─ Detailed workflows
   ├─ References to bundled resources
   └─ Output format specification
```

#### Writing Guidelines

**Frontmatter:**
- `name`: lowercase, hyphens, max 64 chars
- `description`: Include WHAT + WHEN + SCOPE

**Body:**
- Use imperative form ("Extract text" not "Extracting text")
- Prefer examples over explanations
- Keep under 500 lines
- Reference bundled resources clearly

**Scripts:**
- Test every script before including
- Include usage comments at top
- Handle errors gracefully

---

### Step 5: Validate the Skill

**Goal**: Ensure the skill is properly structured and functional.

#### Validation Checklist

```
STRUCTURE:
□ SKILL.md exists at root
□ Frontmatter has name and description
□ Name follows conventions (lowercase, hyphens)
□ Description includes triggers

CONTENT:
□ Body under 500 lines
□ No duplicate information
□ References linked correctly
□ No extraneous files (README, CHANGELOG, etc.)

SCRIPTS:
□ All scripts tested and working
□ Scripts have usage documentation
□ Scripts handle errors appropriately

REFERENCES:
□ Files >100 lines have table of contents
□ No deeply nested references
□ Clear descriptions of when to load each
```

---

### Step 6: Iterate Based on Usage

**Goal**: Refine the skill based on real-world performance.

#### Iteration Workflow

```
1. USE the skill on real tasks

2. OBSERVE struggles or inefficiencies
   - Did Claude find the right workflow?
   - Were scripts reliable?
   - Was context overloaded?

3. IDENTIFY improvements
   - Add missing workflows
   - Fix buggy scripts
   - Trim unnecessary content

4. IMPLEMENT changes

5. TEST again

6. REPEAT
```

---

## 9. Real-World Examples

### Example 1: jutsu-creator (Domain-Specific Generator)

```yaml
---
name: jutsu-creator
description: Create new jutsu/skills for SHINOBI WAY game. Use when user wants to add abilities, techniques, jutsu, or combat skills. Guides through all parameters and generates TypeScript code.
---
```

**Structure:**
```
jutsu-creator/
├── SKILL.md              # 9-step workflow for creating jutsu
└── references/
    ├── skill-interface.md  # Full TypeScript interface
    └── examples.md         # Example jutsu from game
```

**Key Features:**
- Step-by-step guided workflow (9 steps)
- Balance guidelines with tier-based tables
- Output format templates for different skill types
- Reference files for detailed type definitions

---

### Example 2: combat-system-creator (Architecture Guide)

```yaml
---
name: combat-system-creator
description: Create and modify combat system components for SHINOBI WAY game following the dual-system architecture (CombatCalculationSystem + CombatWorkflowSystem). Use when user wants to add new combat mechanics, damage formulas, status effects, mitigation logic, turn phases, or refactor existing combat code.
---
```

**Structure:**
```
combat-system-creator/
├── SKILL.md              # Architecture overview + workflows
└── references/
    ├── calculation-system.md   # Pure math functions
    ├── workflow-system.md      # State management
    ├── balance-constants.md    # Game balance numbers
    └── templates.md            # Code templates
```

**Key Features:**
- Dual-system architecture pattern
- Separation of concerns (pure vs stateful)
- Code templates for common additions
- Balance constants reference

---

### Example 3: exploration-creator (Content Generator)

```yaml
---
name: exploration-creator
description: Create exploration content for SHINOBI WAY game with node-based path navigation. Use when user wants to add new regions, locations, room layouts, intel missions, path networks, or exploration mechanics.
---
```

**Structure:**
```
exploration-creator/
├── SKILL.md              # Content creation workflows
└── references/
    ├── region-structure.md     # Region→Location→Room hierarchy
    ├── path-system.md          # Node-based navigation
    └── intel-mechanics.md      # Intel-gated progression
```

**Key Features:**
- Hierarchical content structure
- Node-based path system documentation
- Intel gating mechanics
- Room activity configurations

---

## 10. Common Patterns & Templates

### Pattern A: Code Generator Skill

For skills that generate code output.

```markdown
---
name: component-generator
description: Generate [COMPONENT TYPE] for [PROJECT]. Use when user wants to create new [TRIGGERS].
---

# Component Generator

Generate [components] following project conventions.

## Quick Start

1. Gather requirements (name, type, properties)
2. Determine variant (see Variants section)
3. Generate code using template
4. Output ready-to-use code

## Variants

### Variant A
[When to use, key characteristics]

### Variant B
[When to use, key characteristics]

## Output Format

\`\`\`typescript
// Generated [component] code
[TEMPLATE]
\`\`\`

## Reference Files

- [types.md](references/types.md) - Type definitions
- [examples.md](references/examples.md) - Example components
```

---

### Pattern B: Processing Skill

For skills that process files or data.

```markdown
---
name: data-processor
description: Process [DATA TYPE] including [OPERATION 1], [OPERATION 2], [OPERATION 3]. Use when user wants to [TRIGGERS].
---

# Data Processor

Process [data type] with various operations.

## Operations

### Operation A
\`\`\`bash
scripts/operation_a.py --input FILE --output RESULT
\`\`\`

### Operation B
\`\`\`bash
scripts/operation_b.py --input FILE --config CONFIG
\`\`\`

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `operation_a.py` | [Purpose] | `--input FILE` |
| `operation_b.py` | [Purpose] | `--input FILE --config CONFIG` |

## Reference Files

- [formats.md](references/formats.md) - Supported formats
- [advanced.md](references/advanced.md) - Complex operations
```

---

### Pattern C: Domain Knowledge Skill

For skills providing specialized domain expertise.

```markdown
---
name: domain-expert
description: [DOMAIN] expertise for [CONTEXT]. Use when user asks about [TRIGGER 1], [TRIGGER 2], or needs help with [TRIGGER 3].
---

# Domain Expert

Specialized knowledge for [domain].

## Overview

[Brief domain introduction]

## Key Concepts

### Concept A
[Explanation]

### Concept B
[Explanation]

## Common Tasks

### Task 1: [Name]
[Step-by-step guide]

### Task 2: [Name]
[Step-by-step guide]

## Reference Files

- [terminology.md](references/terminology.md) - Domain terms
- [procedures.md](references/procedures.md) - Standard procedures
- [regulations.md](references/regulations.md) - Compliance rules
```

---

### Pattern D: Multi-Variant Skill

For skills supporting multiple frameworks/platforms.

```markdown
---
name: deployment-skill
description: Deploy applications to cloud platforms (AWS, GCP, Azure). Use when user wants to deploy, configure infrastructure, or set up CI/CD.
---

# Deployment Skill

Deploy to multiple cloud platforms.

## Platform Selection

| Platform | Best For | Reference |
|----------|----------|-----------|
| AWS | Enterprise, broad services | [aws.md](references/aws.md) |
| GCP | ML/Data, Kubernetes | [gcp.md](references/gcp.md) |
| Azure | Microsoft ecosystem | [azure.md](references/azure.md) |

## Quick Start

1. Identify target platform
2. Load platform-specific reference
3. Follow deployment workflow

## Common Workflows

### Basic Deployment
[Platform-agnostic steps]

### CI/CD Setup
[Platform-agnostic steps]

Load platform-specific reference for detailed configuration.
```

---

## 11. Validation Checklist

Use this checklist before finalizing any skill:

### Structure Validation

```
□ SKILL.md exists at skill root directory
□ Frontmatter contains 'name' field
□ Frontmatter contains 'description' field
□ Name is lowercase with hyphens only
□ Name is ≤64 characters
□ Description is ≤1,024 characters
□ No extraneous files (README.md, CHANGELOG.md, etc.)
```

### Content Validation

```
□ Description includes WHAT the skill does
□ Description includes WHEN to use (triggers)
□ Body is <500 lines
□ Body uses imperative form
□ No "When to Use" section in body (belongs in description)
□ No duplicate information between body and references
□ All reference files linked from SKILL.md
□ Reference files >100 lines have table of contents
```

### Resource Validation

```
□ All scripts tested and functional
□ Scripts include usage documentation
□ Scripts handle errors gracefully
□ References are one level deep (no nested chains)
□ Assets are actually used in output
□ No empty directories
```

### Quality Validation

```
□ Skill has focused scope (one capability)
□ Content is concise (no unnecessary verbosity)
□ Examples preferred over explanations
□ Freedom level matches task fragility
□ Progressive disclosure implemented correctly
```

---

## 12. Troubleshooting

### Skill Not Triggering

**Symptoms**: Claude doesn't use the skill when expected.

**Solutions**:
1. Check description includes trigger phrases
2. Make triggers more specific/explicit
3. Ensure description is <1,024 chars
4. Test with exact trigger phrases from description

---

### Context Overload

**Symptoms**: Slow responses, truncated output, Claude "forgetting" instructions.

**Solutions**:
1. Move content from SKILL.md to references
2. Split large references into domain-specific files
3. Remove unnecessary content
4. Use scripts instead of inline code

---

### Scripts Failing

**Symptoms**: Scripts error when Claude runs them.

**Solutions**:
1. Test scripts manually first
2. Check file paths (relative vs absolute)
3. Verify dependencies installed
4. Add error handling to scripts
5. Include usage examples in script comments

---

### Wrong Reference Loaded

**Symptoms**: Claude loads irrelevant reference files.

**Solutions**:
1. Add clearer descriptions of when to load each reference
2. Organize references by domain/variant
3. Use conditional language ("For X operations, see...")
4. Reduce number of reference files

---

### Inconsistent Output

**Symptoms**: Skill produces varying output quality.

**Solutions**:
1. Add output format templates
2. Include concrete examples
3. Use lower freedom level (more specific instructions)
4. Add validation steps to workflow

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 SKILL CREATION QUICK REF                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STRUCTURE:                                                 │
│  skill-name/                                                │
│  ├── SKILL.md (required)                                    │
│  ├── scripts/ (optional)                                    │
│  ├── references/ (optional)                                 │
│  └── assets/ (optional)                                     │
│                                                             │
│  FRONTMATTER:                                               │
│  ---                                                        │
│  name: lowercase-with-hyphens (≤64 chars)                   │
│  description: WHAT + WHEN + SCOPE (≤1024 chars)             │
│  ---                                                        │
│                                                             │
│  BODY LIMITS:                                               │
│  • <500 lines                                               │
│  • Imperative form                                          │
│  • Examples > explanations                                  │
│                                                             │
│  PROGRESSIVE DISCLOSURE:                                    │
│  L1: Metadata (always) → L2: Body (on trigger) →            │
│  L3: Resources (as needed)                                  │
│                                                             │
│  PRINCIPLES:                                                │
│  • Concise is key                                           │
│  • One skill = one capability                               │
│  • Triggers in description, not body                        │
│  • Test all scripts                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Additional Resources

- **Existing Skills**: Check `.claude/skills/` for working examples
- **Slash Commands**: See `.claude/commands/` for comparison
- **Project Instructions**: See `CLAUDE.md` for project-specific guidance

---

*Last Updated: 2024*
