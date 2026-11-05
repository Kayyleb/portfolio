import { PoolPhysics, type SimBall } from './physics';
import { TABLE_GEOM } from './geometry';
import { planShot, type Difficulty } from './ai';
import type { GameState } from './rules';

// Runs the computer's shot search off the main thread, so the game keeps animating
// while it thinks. The table is at rest between shots, so the ball positions are all
// the physics state a fresh engine needs (strike() resets spin before every simulation).

export interface AiRequest {
  id: number;
  balls: SimBall[];
  state: GameState;
  difficulty: Difficulty;
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { id, balls, state, difficulty } = event.data;
  const shot = planShot(new PoolPhysics(TABLE_GEOM, balls), state, difficulty);
  self.postMessage({ id, shot });
};
