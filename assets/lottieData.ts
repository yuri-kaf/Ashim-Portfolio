// RECOVERY NOTE: the original Lottie JSON for the Digital Marketing service
// card (~40KB) was never captured as text anywhere in this session's transcript
// (only a few structural fields were inspected via node -e, never the full
// blob), so it could not be reconstructed byte-for-byte after the folder was
// deleted. This stub exports null, which SafeLottie's sanitizer already
// treats as "no usable animation" and falls back to the service's static
// image — so nothing crashes, you just lose the bespoke animation itself.
// Re-export the original export name so existing imports keep working.
export const DIGITAL_MARKETING_LOTTIE: any = null;
