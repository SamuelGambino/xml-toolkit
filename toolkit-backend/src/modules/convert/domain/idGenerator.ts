/**
 * ID generator utility for generating unique IDs
 */

let idCounter = 0;

/**
 * Generates a unique ID
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateId(prefix: string = 'id'): string {
  idCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}_${idCounter}`;
}

/**
 * Resets the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}
