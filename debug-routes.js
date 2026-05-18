/**
 * Debug script to test route extraction
 */

// Simulate a simple regex pattern that Express would create
const pattern1 = /^\/api\/v1\/?(?=\/|$)/i;
const pattern2 = /^\/auth\/?(?=\/|$)/i;
const pattern3 = /^\/discover\/?(?=\/|$)/i;

function extractMountPath(regexp) {
  if (typeof regexp === 'string') return regexp;
  if (!regexp) return '';

  const source = regexp.source || '';
  console.log(`Extracting path from: ${source}`);

  // Extract path from patterns like "^\/api\/v1\/?(?=\/|$)" or "^\/auth\/?(?=\/|$)"
  const match = source.match(/^\^(.+?)\\\/?/);
  if (match) {
    // Unescape the path
    const result = match[1].replace(/\\\//g, '/');
    console.log(`  -> Extracted: ${result}`);
    return result;
  }
  console.log(`  -> No match found`);
  return '';
}

console.log('Testing mount path extraction:\n');
extractMountPath(pattern1);
extractMountPath(pattern2);
extractMountPath(pattern3);
