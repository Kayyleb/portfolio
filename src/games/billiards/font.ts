import { Baloo_2 } from 'next/font/google';

// Chunky rounded face for the game UI. Phaser draws text to canvas, so the
// game waits for this font to load before booting (see BilliardsGame.tsx).
export const gameFont = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});
