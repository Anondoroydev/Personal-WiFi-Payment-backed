/**
 * Copy text to clipboard with fallback support
 * Works even when Clipboard API is blocked
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // Fall back to the legacy copy method.
    }
  }

  // Fallback method for older browsers or when Clipboard API is blocked
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Try to copy using execCommand
    const successful = document.execCommand('copy');
    textArea.remove();
    
    return successful;
  } catch (_err) {
    return false;
  }
}
