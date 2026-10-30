import { BallGroup, groupOf } from './types';

// Pure 8-ball rules (8 Ball Pool flavour). No Phaser dependency.
//  - Break from behind the head string. Potting on the break keeps the table open.
//  - The first ball legally potted after the break decides the groups.
//  - Fouls (scratch, no hit, wrong ball first, shot clock) give ball in hand anywhere.
//  - The 8 must go in the called pocket after clearing your group.
//  - The 8 on the break is re-spotted.

export type PlayerIndex = 0 | 1;
export type Group = 'solid' | 'stripe';
export type BallInHand = 'none' | 'kitchen' | 'anywhere';

export interface GameState {
  turn: PlayerIndex;
  groups: [Group | null, Group | null];
  isBreak: boolean;
  ballInHand: BallInHand;
  winner: PlayerIndex | null;
}

export interface Potted {
  num: number;
  pocket: number;
}

export interface ShotEvents {
  firstContact: number | null;   // number of the first ball the cue ball touched
  potted: Potted[];              // in the order they dropped
  calledPocket: number | null;
}

export type Remaining = Record<Group, number>;

export interface ShotOutcome {
  state: GameState;
  foul: string | null;        // why the shot was a foul
  lossReason: string | null;  // set when the shooter lost on this shot
  won: boolean;               // shooter legally potted the 8
  keepsTurn: boolean;
  assigned: Group | null;     // group the shooter was just given
  respotEight: boolean;
}

export function newGame(breaker: PlayerIndex = 0): GameState {
  return { turn: breaker, groups: [null, null], isBreak: true, ballInHand: 'kitchen', winner: null };
}

export function opponent(p: PlayerIndex): PlayerIndex {
  return p === 0 ? 1 : 0;
}

export function otherGroup(g: Group): Group {
  return g === 'solid' ? 'stripe' : 'solid';
}

export function isOnEight(state: GameState, player: PlayerIndex, remaining: Remaining): boolean {
  const g = state.groups[player];
  return g !== null && remaining[g] === 0;
}

// Ball groups the shooter may legally hit first.
export function legalTargets(state: GameState, remaining: Remaining): BallGroup[] {
  if (state.isBreak) return ['solid', 'stripe', 'eight'];
  const g = state.groups[state.turn];
  if (g === null) return ['solid', 'stripe'];
  return remaining[g] === 0 ? ['eight'] : [g];
}

export function resolveShot(state: GameState, ev: ShotEvents, before: Remaining): ShotOutcome {
  const me = state.turn;
  const opp = opponent(me);
  const scratched = ev.potted.some(p => p.num === 0);
  const eight = ev.potted.find(p => p.num === 8);
  const objects = ev.potted.filter(p => p.num !== 0 && p.num !== 8);
  const onEight = isOnEight(state, me, before);
  const firstGroup = ev.firstContact === null ? null : groupOf(ev.firstContact);

  let foul: string | null = null;
  if (scratched) foul = 'Scratch';
  else if (firstGroup === null) foul = 'No ball hit';
  else if (!legalTargets(state, before).includes(firstGroup)) {
    if (onEight) foul = 'Must hit the 8 first';
    else if (firstGroup === 'eight') foul = 'Hit the 8 first';
    else foul = 'Wrong ball hit first';
  }

  // --- The 8 went down ---
  if (eight && !state.isBreak) {
    let lossReason: string | null = null;
    if (!onEight) lossReason = 'Potted the 8 too early';
    else if (scratched) lossReason = 'Scratched on the 8';
    else if (foul) lossReason = `Foul on the 8 — ${foul.toLowerCase()}`;
    else if (ev.calledPocket !== eight.pocket) lossReason = 'The 8 went in the wrong pocket';

    const winner = lossReason ? opp : me;
    return {
      state: { ...state, winner },
      foul,
      lossReason,
      won: lossReason === null,
      keepsTurn: false,
      assigned: null,
      respotEight: false,
    };
  }

  const respotEight = !!eight && state.isBreak;
  const groups: [Group | null, Group | null] = [state.groups[0], state.groups[1]];
  let assigned: Group | null = null;
  let keepsTurn = false;

  if (!foul) {
    if (state.isBreak) {
      keepsTurn = objects.length > 0 || respotEight;
    } else if (groups[me] === null) {
      if (objects.length > 0) {
        assigned = groupOf(objects[0].num) as Group;
        groups[me] = assigned;
        groups[opp] = otherGroup(assigned);
        keepsTurn = true;
      }
    } else {
      const mine = groups[me];
      keepsTurn = objects.some(o => groupOf(o.num) === mine);
    }
  }

  return {
    state: {
      turn: keepsTurn ? me : opp,
      groups,
      isBreak: false,
      ballInHand: foul ? 'anywhere' : 'none',
      winner: null,
    },
    foul,
    lossReason: null,
    won: false,
    keepsTurn,
    assigned,
    respotEight,
  };
}

// The shot clock ran out: a foul, but the break (if it hadn't happened) passes over.
export function resolveTimeout(state: GameState): ShotOutcome {
  return {
    state: {
      ...state,
      turn: opponent(state.turn),
      ballInHand: state.isBreak ? 'kitchen' : 'anywhere',
    },
    foul: 'Time ran out',
    lossReason: null,
    won: false,
    keepsTurn: false,
    assigned: null,
    respotEight: false,
  };
}
