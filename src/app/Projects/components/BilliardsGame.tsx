"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { gameFont } from "../../../games/billiards/font";

// Web Billiards (copied from the web_billiards repo) running inside the project page.
// Phaser only loads once the visitor presses Play, so it doesn't slow the page down,
// and the game's keyboard capture (space, arrow keys) only applies while it's running.
export default function BilliardsGame() {
    const [playing, setPlaying] = useState(false);
    const frameRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<HTMLDivElement>(null);
    const family = gameFont.style.fontFamily;

    useEffect(() => {
      if (!playing) return;
      let game: Phaser.Game | null = null;
      let cancelled = false;

      const boot = async () => {
        const [{ default: PhaserLib }, { CONFIG, FONT }, { MenuScene }, { GameScene }] = await Promise.all([
          import("phaser"),
          import("../../../games/billiards/config"),
          import("../../../games/billiards/scenes/MenuScene"),
          import("../../../games/billiards/scenes/GameScene"),
        ]);
        // Canvas text renders with whatever font is ready at draw time, so wait for ours.
        await Promise.all(["500", "700", "800"].map((w) => document.fonts.load(`${w} 32px ${family}`))).catch(() => undefined);
        if (cancelled || !gameRef.current) return;

        FONT.family = `${family}, system-ui, sans-serif`;
        game = new PhaserLib.Game({
          type: PhaserLib.AUTO,
          width: CONFIG.W,
          height: CONFIG.H,
          parent: gameRef.current,
          backgroundColor: "#040c18",
          antialias: true,
          scale: {
            mode: PhaserLib.Scale.FIT,
            autoCenter: PhaserLib.Scale.CENTER_BOTH,
          },
          scene: [MenuScene, GameScene],
        });
      };
      void boot();

      // The mouse wheel fine-tunes aim, so don't let it scroll the page while over the game
      const frame = frameRef.current;
      const stopScroll = (event: WheelEvent) => event.preventDefault();
      frame?.addEventListener("wheel", stopScroll, { passive: false });

      // Strict Mode double-mounts in dev; this cleanup prevents duplicate canvases.
      return () => {
        cancelled = true;
        frame?.removeEventListener("wheel", stopScroll);
        game?.destroy(true);
        game = null;
      };
    }, [playing, family]);

    const exit = () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      setPlaying(false);
    };

    return (
      <div>
      <div
        ref={frameRef}
        className={`${gameFont.className} relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-[#040c18]`}
      >
        {playing ? (
          <div ref={gameRef} className="h-full w-full touch-none select-none" />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group flex h-full w-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,#123b66_0%,#040c18_70%)] text-[#e6f1ff]"
          >
            <span className="text-4xl font-extrabold tracking-[0.3em] sm:text-6xl">8 BALL</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#35c4ff] px-6 py-2.5 text-lg font-bold text-[#040c18] transition-transform group-hover:scale-105">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </span>
            <span className="font-sans text-sm text-[#e6f1ff]/70">
              Play the computer or a friend. Best with a mouse or touch screen.
            </span>
          </button>
        )}
      </div>

      {/* Kept outside the game frame so it never covers the game's own HUD */}
      {playing && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => frameRef.current?.requestFullscreen?.()}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-forest hover:border-forest"
          >
            Full screen
          </button>
          <button
            onClick={exit}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-forest hover:border-forest"
          >
            Exit game
          </button>
        </div>
      )}
      </div>
  )
}
