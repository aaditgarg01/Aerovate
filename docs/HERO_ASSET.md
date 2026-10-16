# Aerovate sunset hero

The hero matches the supplied sunset reference with responsive HTML text and navigation over a clean photographic plate. The rocket in this image is static; the separate rocket and scroll modules remain available for the team’s future work.

## Asset provenance

- Mode: built-in ImageGen, editing the user-supplied reference to remove UI overlays.
- Input: codex-clipboard-4a853dff-df50-4554-9207-89582442404c.png.
- Original generated output: exec-691ef9b7-e0ce-4664-92ae-4f7290203fd3.png, 1740 × 904.
- Website assets: public/assets/hero/aerovate-launch-sunset.webp (about 74 KB), with JPEG fallback (about 100 KB).
- This is a generated design background based on a reference, not documentary Aerovate event photography.
- Encoding: quality 85, no creative alteration after generation.

## Exact generation prompt

Use case: precise-object-edit. Asset type: clean photographic background for the existing Aerovate website hero. Input image 1 is the edit target and composition reference. Remove ALL website UI overlays from this image: the top-left Aerovate icon, wordmark and tagline, every navigation link, the circular arrow button, the cyan dot and small label, the large 'Ideas take flight.' headline, the small all-caps event label, and the two-line paragraph. Inpaint those areas naturally with the matching dark blue sunset sky. Preserve the original photograph, composition and framing: a tall narrow white and black model rocket with red fins on its black launch rail/tripod at about 74% of image width, rocket top at 20% height and tripod touching the bottom edge; a campus field with trees and a distant low building, warm orange-pink sunset near the right horizon, navy-blue sky, and out-of-focus notebook and tools in the bottom-left foreground. Preserve the small vertical VIT STELLAR lettering physically printed on the rocket. Keep the left half mostly open dark-blue sky for live HTML text later. Do not add new text, symbols, UI, people, additional rockets, stars, planets or watermarks. Produce a polished natural photographic plate, landscape approximately 1.925:1 matching the reference. Keep everything except the UI removal unchanged. Opaque image, not transparent.

## Validation

Seven integration tests passed. TypeScript and Vite production build passed. Desktop and 390 × 844 phone layouts checked: no horizontal overflow, readable headline, mobile menu Escape handling, POCs navigation and direct refresh. Browser console showed no errors or warnings.
