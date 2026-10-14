// Correct two prose-only hints in the pinned runtime's generated prompt.
// Signatures, allowed names, examples and validation schema remain unchanged.
export const promptProseProjection = 'declaration-lines-root-position-and-trailing-space/2';
export function webChatPrompt(prompt) {
  const replacements = [
    ['1. Each statement is on its own line: `identifier = Expression`',
      '1. Start each declaration on a new line: `identifier = Expression`. A continued expression may span lines.'],
    ['1. root = Stack(...) is the FIRST line (for optimal streaming).',
      '1. Define root = Stack(...) exactly once. Its position is unrestricted in a complete document.'],
  ];
  for (const [before, after] of replacements) {
    if (!prompt.includes(before)) throw Error('Runtime prompt changed; review the prose projection before regenerating.');
    prompt = prompt.replace(before, after);
  }
  return prompt.replace(/[ \t]+$/gm, '');
}
