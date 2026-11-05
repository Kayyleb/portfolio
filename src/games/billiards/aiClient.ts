import type { PoolPhysics } from './physics';
import type { GameState } from './rules';
import { planShot, type AiShot, type Difficulty } from './ai';
import type { AiRequest } from './ai.worker';

// Hands the computer's shot search to a Web Worker. If workers aren't available
// (or the worker fails), the search runs on the main thread like before.

interface Waiting {
  resolve: (shot: AiShot) => void;
  phys: PoolPhysics;
  state: GameState;
  difficulty: Difficulty;
}

let worker: Worker | null | undefined;
let nextId = 0;
const waiting = new Map<number, Waiting>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; shot: AiShot }>) => {
      waiting.get(event.data.id)?.resolve(event.data.shot);
      waiting.delete(event.data.id);
    };
    worker.onerror = () => {
      // Fall back to the main thread for anything in flight, and from now on
      worker?.terminate();
      worker = null;
      for (const w of waiting.values()) w.resolve(planShot(w.phys, w.state, w.difficulty));
      waiting.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function requestAiShot(phys: PoolPhysics, state: GameState, difficulty: Difficulty): Promise<AiShot> {
  const w = getWorker();
  if (!w) return Promise.resolve(planShot(phys, state, difficulty));
  return new Promise(resolve => {
    const id = ++nextId;
    waiting.set(id, { resolve, phys, state, difficulty });
    const request: AiRequest = { id, balls: phys.balls, state, difficulty };
    w.postMessage(request);
  });
}

// Called when the game shuts down, so the worker doesn't linger.
export function stopAiWorker(): void {
  worker?.terminate();
  worker = undefined;
  waiting.clear();
}
