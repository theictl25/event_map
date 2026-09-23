# AGENTS.md

## Project Overview
- **Type**: Event Map web application
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Core Scripts**: `js/`
- **Backend / API**: Google Apps Script API
- **Roles**: User, Admin/Manager
- **Languages**: Lao and English (i18n)
- **Key Features**: Interactive map and map layout

## Codex Directives & Constraints

### Token & Context Optimization
- **Targeted Reading**: Inspect only files directly relevant to the current task. Never scan the repository broadly or read unrelated files.
- **Direct Entry**: If target files are known, start directly from those files.
- **Minimal Dependency Checks**: Check imports and dependencies only when strictly relevant.
- **Clarification First**: If requirements or context are insufficient, ask the user first rather than scanning multiple repository files.

### Modification Rules
- **Minimal Changes**: Modify only what is explicitly requested using minimal diffs.
- **No Unrelated Refactoring**: Do not reformat, reorganize, or refactor code outside the scope of the task.
- **Preserve Architecture & APIs**: Preserve existing architecture, behavior, and API contracts. Maintain backward compatibility.
- **No Unsolicited Files or Dependencies**: Do not add new external dependencies or create new files unless explicitly requested.
- **Preserve Existing Code**: Do not delete seemingly unused code without verifying references across the project.

### Verification & Reporting
- **Scoped Verification**: After modifications, check only syntax, imports, and references of the changed files.
- **Concise Reporting**: Do not explain the whole codebase. Report results briefly, clearly, and directly to the point.

## Workflow
1. **Understand Task**: Confirm requirements and identify target scope.
2. **Inspect Minimally**: Open only strictly necessary files.
3. **Apply Minimal Diff**: Implement exact changes required.
4. **Targeted Verification**: Verify only modified code and references.
5. **Brief Summary**: Provide a short, direct summary of the changes.
