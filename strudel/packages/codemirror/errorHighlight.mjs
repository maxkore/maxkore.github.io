import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';

// Effect to set/clear error location
export const setErrorLocation = StateEffect.define();

// StateField that manages error decoration
export const errorField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    // Clear decorations if doc changed (error may no longer be valid)
    if (tr.docChanged) {
      return Decoration.none;
    }

    for (let e of tr.effects) {
      if (e.is(setErrorLocation)) {
        if (e.value) {
          const { from, to } = e.value;
          // Clamp to document length
          const clampedTo = Math.min(to, tr.newDoc.length);
          const clampedFrom = Math.min(from, clampedTo);

          if (clampedFrom < clampedTo) {
            const mark = Decoration.mark({
              class: 'cm-error-highlight',
            });
            return Decoration.set([mark.range(clampedFrom, clampedTo)]);
          }
        }
        // Clear on null/undefined
        return Decoration.none;
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Theme for the error highlight
const errorTheme = EditorView.baseTheme({
  '.cm-error-highlight': {
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    borderBottom: '3px wavy red',
    outline: '2px solid rgba(255, 0, 0, 0.6)',
  },
});

// Helper to highlight error in editor
export const highlightError = (view, from, to) => {
  // Ensure at least 1 character is highlighted, expand slightly for visibility
  const minSize = 1;
  const adjustedTo = Math.max(to, from + minSize);
  view.dispatch({ effects: setErrorLocation.of({ from, to: adjustedTo }) });
};

// Helper to clear error highlight
export const clearErrorHighlight = (view) => {
  view.dispatch({ effects: setErrorLocation.of(null) });
};

// Extension to enable error highlighting
export const errorHighlightExtension = [errorField, errorTheme];
