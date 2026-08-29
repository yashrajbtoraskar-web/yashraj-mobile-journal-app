// =====================================================================
// uuid.js - Tiny unique ID generator
// -----------------------------------------------------------------
// We avoid adding a heavy uuid library. This function is good enough
// to generate unique IDs for notes and attachments on a single device.
// =====================================================================

export function generateId() {
  // Combines current timestamp + random string -> practically unique
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).substring(2, 10)
  );
}
