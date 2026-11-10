/**
 * Utility functions for keyboard-driven text transformation and clinical timestamp injection
 * in active inputs/textareas.
 */

export const toTitleCase = (str = '') => {
  return str.replace(/\b[a-z]/gi, (char) => char.toUpperCase());
};

export const transformActiveInputSelection = (mode = 'upper') => {
  const el = document.activeElement;
  if (!el) return false;

  const isInput = el.tagName === 'INPUT' && ['text', 'search', 'email', 'url', ''].includes(el.type);
  const isTextArea = el.tagName === 'TEXTAREA';

  if (!isInput && !isTextArea) return false;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const fullVal = el.value || '';

  // If no selection, check if cursor is inside a word to transform that single word
  let targetStart = start;
  let targetEnd = end;

  if (start === end) {
    if (!fullVal) return false;
    // Find boundaries of the word under cursor
    let left = start;
    let right = start;
    while (left > 0 && /\S/.test(fullVal[left - 1])) left--;
    while (right < fullVal.length && /\S/.test(fullVal[right])) right++;
    if (left === right) return false;
    targetStart = left;
    targetEnd = right;
  }

  const selectedText = fullVal.slice(targetStart, targetEnd);
  if (!selectedText) return false;

  let transformed = selectedText;
  if (mode === 'upper') {
    transformed = selectedText.toUpperCase();
  } else if (mode === 'lower') {
    transformed = selectedText.toLowerCase();
  } else if (mode === 'title') {
    transformed = toTitleCase(selectedText);
  }

  // Try document.execCommand first for proper undo/redo history
  el.focus();
  el.setSelectionRange(targetStart, targetEnd);
  const success = document.execCommand && document.execCommand('insertText', false, transformed);

  if (!success) {
    const newVal = fullVal.slice(0, targetStart) + transformed + fullVal.slice(targetEnd);
    el.value = newVal;
    el.setSelectionRange(targetStart, targetStart + transformed.length);

    // Dispatch input and change events for React state sync
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return true;
};

export const insertClinicalTimestamp = (staffName = '') => {
  const el = document.activeElement;
  if (!el) return false;

  const isInput = el.tagName === 'INPUT' && ['text', 'search', ''].includes(el.type);
  const isTextArea = el.tagName === 'TEXTAREA';

  if (!isInput && !isTextArea) return false;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const namePart = staffName ? ` - ${staffName}` : '';
  const stamp = `[${dateStr} ${timeStr}${namePart}]: `;

  el.focus();
  const success = document.execCommand && document.execCommand('insertText', false, stamp);

  if (!success) {
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const fullVal = el.value || '';
    const newVal = fullVal.slice(0, start) + stamp + fullVal.slice(end);
    el.value = newVal;
    el.setSelectionRange(start + stamp.length, start + stamp.length);

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return true;
};

