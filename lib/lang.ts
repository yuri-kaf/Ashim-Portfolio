/**
 * Whether a run of text is mostly Nepali, going by script.
 *
 * Posts mix Nepali and English paragraph by paragraph, and Markdown has no
 * way to mark which is which. Marking the Nepali ones `lang="ne"` is what
 * lets a screen reader switch voice and lets `:lang(ne)` CSS give Devanagari
 * the extra size and leading it needs. English loanwords written in Latin
 * inside a Nepali sentence ("Facebook मा post boost गर्नु") are normal, so
 * this counts letters rather than asking for purity.
 */
export const isMostlyDevanagari = (text: string): boolean => {
  const devanagari = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  if (!devanagari) return false;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return devanagari >= latin;
};
