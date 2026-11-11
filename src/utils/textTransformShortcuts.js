/**
 * Utility functions for keyboard-driven text transformation and clinical timestamp injection
 * in active inputs, textareas, and rich content editors.
 */

export const toTitleCase = (str = '') => {
  return str.replace(/\b[a-z]/gi, (char) => char.toUpperCase());
};

/**
 * Converts alphanumeric characters to Unicode Mathematical Sans-Serif Bold glyphs.
 * These render as visibly bold, larger/heavier font across all standard inputs,
 * textareas, tables, printed summaries, and databases without needing HTML tags.
 */
export const toBoldText = (str = '') => {
  if (!str) return '';
  let result = '';
  for (const char of str) {
    const cp = char.codePointAt(0);
    // Uppercase A-Z (65 - 90) -> Mathematical Sans-Serif Bold (0x1D5D4 - 0x1D5ED)
    if (cp >= 65 && cp <= 90) {
      result += String.fromCodePoint(0x1D5D4 + (cp - 65));
    }
    // Lowercase a-z (97 - 122) -> Mathematical Sans-Serif Bold (0x1D5EE - 0x1D607)
    else if (cp >= 97 && cp <= 122) {
      result += String.fromCodePoint(0x1D5EE + (cp - 97));
    }
    // Digits 0-9 (48 - 57) -> Mathematical Sans-Serif Bold (0x1D7EC - 0x1D7F5)
    else if (cp >= 48 && cp <= 57) {
      result += String.fromCodePoint(0x1D7EC + (cp - 48));
    } else {
      result += char;
    }
  }
  return result;
};

/**
 * Converts Unicode bold glyphs (Sans-Serif and Serif) back to standard plain ASCII characters.
 * Also strips enclosing markdown bold asterisks if present.
 */
export const toNormalText = (str = '') => {
  if (!str) return '';
  let result = '';
  for (const char of str) {
    const cp = char.codePointAt(0);
    // Sans-Serif Bold A-Z
    if (cp >= 0x1D5D4 && cp <= 0x1D5ED) {
      result += String.fromCharCode(65 + (cp - 0x1D5D4));
    }
    // Sans-Serif Bold a-z
    else if (cp >= 0x1D5EE && cp <= 0x1D607) {
      result += String.fromCharCode(97 + (cp - 0x1D5EE));
    }
    // Sans-Serif Bold 0-9
    else if (cp >= 0x1D7EC && cp <= 0x1D7F5) {
      result += String.fromCharCode(48 + (cp - 0x1D7EC));
    }
    // Serif Bold A-Z
    else if (cp >= 0x1D400 && cp <= 0x1D419) {
      result += String.fromCharCode(65 + (cp - 0x1D400));
    }
    // Serif Bold a-z
    else if (cp >= 0x1D41A && cp <= 0x1D433) {
      result += String.fromCharCode(97 + (cp - 0x1D41A));
    }
    // Serif Bold 0-9
    else if (cp >= 0x1D7CE && cp <= 0x1D7D7) {
      result += String.fromCharCode(48 + (cp - 0x1D7CE));
    } else {
      result += char;
    }
  }

  // Strip markdown bold asterisks if present
  if (result.startsWith('**') && result.endsWith('**') && result.length >= 4) {
    result = result.slice(2, -2);
  }
  return result;
};

/**
 * Checks whether the string contains Unicode bold characters.
 */
export const isBoldText = (str = '') => {
  if (!str) return false;
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (
      (cp >= 0x1D5D4 && cp <= 0x1D607) ||
      (cp >= 0x1D7EC && cp <= 0x1D7F5) ||
      (cp >= 0x1D400 && cp <= 0x1D433) ||
      (cp >= 0x1D7CE && cp <= 0x1D7D7)
    ) {
      return true;
    }
  }
  return false;
};

export const hasActiveTextSelection = () => {
  const el = document.activeElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    if (el.selectionStart != null && el.selectionEnd != null && el.selectionStart !== el.selectionEnd) {
      return true;
    }
    if (el.value && el.value.length > 0) {
      return true;
    }
  }
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const text = sel.toString().trim();
    if (text.length > 0) {
      const anchorNode = sel.anchorNode;
      const element = anchorNode && (anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement);
      if (element && (element.isContentEditable || element.closest('[contenteditable="true"]'))) {
        return true;
      }
    }
  }
  return false;
};

export const transformActiveInputSelection = (mode = 'bold') => {
  const el = document.activeElement;
  const sel = window.getSelection();

  // 1. If inside an <input> or <textarea>
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const fullVal = el.value || '';

    let targetStart = start;
    let targetEnd = end;

    // If no text is explicitly highlighted, capture word at cursor
    if (start === end) {
      if (!fullVal) return false;
      let left = start;
      let right = start;
      while (left > 0 && /\S/.test(fullVal[left - 1])) left--;
      while (right < fullVal.length && /\S/.test(fullVal[right])) right++;
      if (left === right) return false;

      // Ensure boundary doesn't split a surrogate pair
      if (left > 0) {
        const prevCode = fullVal.charCodeAt(left - 1);
        if (prevCode >= 0xD800 && prevCode <= 0xDBFF) {
          left--;
        }
      }
      if (right < fullVal.length) {
        const nextCode = fullVal.charCodeAt(right);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          right++;
        }
      }

      targetStart = left;
      targetEnd = right;
    }

    const selectedText = fullVal.slice(targetStart, targetEnd);
    if (!selectedText) return false;

    const action = mode === 'bold' ? (isBoldText(selectedText) ? 'normal' : 'bold') : mode;
    let transformed = selectedText;
    if (mode === 'bold') {
      // Toggle bold if already bold; otherwise apply bold
      transformed = isBoldText(selectedText) ? toNormalText(selectedText) : toBoldText(selectedText);
    } else if (mode === 'unbold' || mode === 'normal') {
      transformed = toNormalText(selectedText);
    } else if (mode === 'upper') {
      transformed = selectedText.toUpperCase();
    } else if (mode === 'lower') {
      transformed = selectedText.toLowerCase();
    } else if (mode === 'title') {
      transformed = toTitleCase(selectedText);
    }

    el.focus();
    el.setSelectionRange(targetStart, targetEnd);

    // Try document.execCommand first for proper undo/redo history
    let success = false;
    try {
      success = document.execCommand && document.execCommand('insertText', false, transformed);
    } catch {
      success = false;
    }

    if (!success) {
      const newVal = fullVal.slice(0, targetStart) + transformed + fullVal.slice(targetEnd);
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(el, newVal);
      } else {
        el.value = newVal;
      }
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }
      el.setSelectionRange(targetStart, targetStart + transformed.length);

      // Dispatch input and change events for React state sync
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      // Keep the text highlighted so pressing Ctrl+B again immediately toggles/undoes it!
      el.setSelectionRange(targetStart, targetStart + transformed.length);
    }

    return { success: true, action };
  }

  // 2. If inside a contenteditable or general document selection (e.g. Slate/rich editor)
  if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
    if (mode === 'bold') {
      try {
        document.execCommand('bold', false, null);
        return true;
      } catch {
        // Fallback to unicode bold text replacement
        const selectedText = sel.toString();
        const transformed = isBoldText(selectedText) ? toNormalText(selectedText) : toBoldText(selectedText);
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(transformed));
        return true;
      }
    } else if (mode === 'unbold' || mode === 'normal') {
      try {
        document.execCommand('removeFormat', false, null);
      } catch {
        // Fallback
      }
      const selectedText = sel.toString();
      const transformed = toNormalText(selectedText);
      try {
        document.execCommand('insertText', false, transformed);
        return true;
      } catch {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(transformed));
        return true;
      }
    } else {
      const selectedText = sel.toString();
      let transformed = selectedText;
      if (mode === 'upper') transformed = selectedText.toUpperCase();
      else if (mode === 'lower') transformed = selectedText.toLowerCase();
      else if (mode === 'title') transformed = toTitleCase(selectedText);

      try {
        document.execCommand('insertText', false, transformed);
        return true;
      } catch {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(transformed));
        return true;
      }
    }
  }

  return false;
};

export const insertClinicalTimestamp = (staffName = '') => {
  const el = document.activeElement;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const namePart = staffName ? ` - ${staffName}` : '';
  const stamp = `[${dateStr} ${timeStr}${namePart}]: `;

  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    el.focus();
    let success = false;
    try {
      success = document.execCommand && document.execCommand('insertText', false, stamp);
    } catch {
      success = false;
    }

    if (!success) {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const fullVal = el.value || '';
      const newVal = fullVal.slice(0, start) + stamp + fullVal.slice(end);
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) {
        setter.call(el, newVal);
      } else {
        el.value = newVal;
      }
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }
      el.setSelectionRange(start + stamp.length, start + stamp.length);

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  }

  // Contenteditable insertion
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    try {
      document.execCommand('insertText', false, stamp);
      return true;
    } catch {
      const range = sel.getRangeAt(0);
      range.insertNode(document.createTextNode(stamp));
      return true;
    }
  }

  return false;
};
