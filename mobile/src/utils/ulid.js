/**
 * ULID (Universally Unique Lexicographically Sortable Identifier) Generator
 * Generates 26-character time-sortable unique IDs
 * Compatible with backend ULID implementation
 */

// Crockford's Base32 alphabet (excludes I, L, O, U to avoid confusion)
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * Generate a ULID
 * @param {number} seedTime - Optional timestamp in milliseconds (defaults to Date.now())
 * @returns {string} 26-character ULID
 */
export function generateULID(seedTime) {
  if (seedTime != null && (seedTime > TIME_MAX || seedTime < 0)) {
    throw new Error('Time must be between 0 and ' + TIME_MAX);
  }

  const time = seedTime != null ? seedTime : Date.now();

  return encodeTime(time, TIME_LEN) + encodeRandom(RANDOM_LEN);
}

/**
 * Encode time portion of ULID
 */
function encodeTime(now, len) {
  if (now > TIME_MAX) {
    throw new Error('Cannot encode time greater than ' + TIME_MAX);
  }

  let str = '';
  for (let i = len; i > 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }

  return str;
}

/**
 * Encode random portion of ULID
 */
function encodeRandom(len) {
  let str = '';

  for (let i = 0; i < len; i++) {
    const rand = Math.floor(Math.random() * ENCODING_LEN);
    str += ENCODING.charAt(rand);
  }

  return str;
}

/**
 * Extract timestamp from ULID
 * @param {string} ulid - ULID string
 * @returns {number} Timestamp in milliseconds
 */
export function decodeTime(ulid) {
  if (ulid.length !== TIME_LEN + RANDOM_LEN) {
    throw new Error('Invalid ULID length');
  }

  const time = ulid.substring(0, TIME_LEN);

  let timestamp = 0;
  for (let i = 0; i < time.length; i++) {
    const char = time.charAt(i);
    const encodedChar = ENCODING.indexOf(char);

    if (encodedChar === -1) {
      throw new Error('Invalid ULID character: ' + char);
    }

    timestamp = timestamp * ENCODING_LEN + encodedChar;
  }

  return timestamp;
}

/**
 * Validate ULID format
 * @param {string} ulid - ULID string to validate
 * @returns {boolean}
 */
export function isValidULID(ulid) {
  if (typeof ulid !== 'string') {
    return false;
  }

  if (ulid.length !== TIME_LEN + RANDOM_LEN) {
    return false;
  }

  // Check if all characters are valid
  for (let i = 0; i < ulid.length; i++) {
    if (ENCODING.indexOf(ulid.charAt(i)) === -1) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two ULIDs lexicographically
 * @param {string} a - First ULID
 * @param {string} b - Second ULID
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareULID(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Generate a ULID for a specific timestamp
 * Useful for cursor-based pagination
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} ULID
 */
export function ulidFromDate(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  return generateULID(timestamp);
}

// Export default
export default {
  generate: generateULID,
  decodeTime,
  isValid: isValidULID,
  compare: compareULID,
  fromDate: ulidFromDate,
};
