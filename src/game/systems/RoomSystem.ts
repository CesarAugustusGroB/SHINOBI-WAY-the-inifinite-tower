import { Room, GameEventDefinition, Player, EnhancedGameEventDefinition } from '../types';
import { EVENTS, BOSS_NAMES, ENHANCED_EVENTS } from '../constants';
import { generateEnemy, getStoryArc } from './EnemySystem';
import { getEventsForArc } from './EventSystem';

/**
 * Analyze player state to determine their current condition
 * Returns assessment for adaptive room generation
 */
const analyzePlayerState = (player: Player, maxHp: number) => {
  const lowHp = player.currentHp < maxHp * 0.3;
  const healthyHp = player.currentHp > maxHp * 0.7;

  return {
    needsHealing: lowHp,
    isStrong: healthyHp,
  };
};

/**
 * Generate adaptive rooms based on player state
 * Slot 1: Responds to player condition (rest if struggling, challenge if thriving)
 * Slot 2: Always combat (guaranteed challenge)
 * Slot 3: Wild card (ambush, elite, or event room)
 */
export const generateRooms = (currentFloor: number, diff: number, player?: Player, maxHp?: number): Room[] => {
  const rooms: Room[] = [];
  const arc = getStoryArc(currentFloor);

  // Boss floor logic - unchanged
  if (BOSS_NAMES[currentFloor as keyof typeof BOSS_NAMES]) {
    let bossDesc = "A terrifying chakra pressure crushes the air.";

    if (arc.name === 'WAVES_ARC') {
      if (currentFloor === 8) bossDesc = "Two chained shinobi emerge from a puddle!";
      else if (currentFloor === 17) bossDesc = "The air grows cold. A masked hunter blocks your path.";
      else if (currentFloor === 25) bossDesc = "The Demon of the Hidden Mist stands before you.";
    } else if (arc.name === 'ACADEMY_ARC') {
      bossDesc = "A rogue sensei blocks your graduation.";
    } else if (arc.name === 'EXAMS_ARC') {
      bossDesc = "The Proctor blocks your path.";
    }

    rooms.push({ type: 'BOSS', description: bossDesc, enemy: generateEnemy(currentFloor, 'BOSS', diff) });
    return rooms;
  }

  // Analyze player state for adaptive generation
  const playerState = player && maxHp ? analyzePlayerState(player, maxHp) : null;

  // SLOT 1: Adaptive response to player condition
  if (playerState?.needsHealing) {
    // Player struggling: offer healing/rest
    if (Math.random() < 0.6) {
      rooms.push({ type: 'REST', description: 'A safe haven appears. Your body begs for rest.' });
    } else {
      rooms.push({ type: 'REST', description: 'A hidden cache of supplies provides respite.' });
    }
  } else if (playerState?.isStrong) {
    // Player thriving: offer high-risk challenge
    rooms.push(generateHighRiskEvent(currentFloor, arc.name));
  } else {
    // Player balanced: offer story event
    rooms.push(generateStoryEvent(currentFloor, arc.name));
  }

  // SLOT 2: Always combat (guaranteed challenge)
  const enemy = generateEnemy(currentFloor, 'NORMAL', diff);
  let combatDesc = "A rogue ninja blocks the path.";
  if (arc.name === 'EXAMS_ARC') combatDesc = "Another team wants your scroll.";
  if (arc.name === 'ACADEMY_ARC') combatDesc = "A rival student challenges you.";
  rooms.push({ type: 'COMBAT', description: combatDesc, enemy });

  // SLOT 3: Wild card
  const wildRoll = Math.random();
  if (wildRoll < 0.15 && currentFloor > 5) {
    // Elite encounter
    rooms.push({
      type: 'ELITE',
      description: 'A formidable opponent emerges from the shadows.',
      enemy: { ...generateEnemy(currentFloor, 'ELITE', diff + 20), name: 'Rival Ninja', tier: 'Fated Rival', dropRateBonus: 100 }
    });
  } else if (wildRoll < 0.3) {
    // Ambush
    let ambushRate = 0.1 + (diff * 0.002);
    if (arc.name === 'WAR_ARC') ambushRate += 0.2;
    if (Math.random() < ambushRate) {
      rooms.push({ type: 'AMBUSH', description: 'Killer Intent spikes nearby! An ambush!', enemy: generateEnemy(currentFloor, 'AMBUSH', diff) });
    } else {
      rooms.push(generateStoryEvent(currentFloor, arc.name));
    }
  } else {
    rooms.push(generateStoryEvent(currentFloor, arc.name));
  }

  return rooms;
};

/**
 * Generate a story-specific event for the current arc
 */
const generateStoryEvent = (floor: number, arcName: string): Room => {
  const arcEvents = getEventsForArc(ENHANCED_EVENTS, arcName);

  if (arcEvents.length === 0) {
    // Fallback to legacy events
    const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    return {
      type: 'EVENT',
      description: 'An odd occurrence.',
      eventDefinition: eventDef,
    };
  }

  const selectedEvent = arcEvents[Math.floor(Math.random() * arcEvents.length)];
  return {
    type: 'EVENT',
    description: selectedEvent.description,
    eventDefinition: selectedEvent as any, // Type bridge for now
  };
};

/**
 * Generate a high-risk event for players in good condition
 */
const generateHighRiskEvent = (floor: number, arcName: string): Room => {
  const arcEvents = getEventsForArc(ENHANCED_EVENTS, arcName);
  const highRiskEvents = arcEvents.filter((e) => {
    const hasExtremeChoice = e.choices.some((c: any) => c.riskLevel === 'EXTREME' || c.riskLevel === 'HIGH');
    return hasExtremeChoice;
  });

  if (highRiskEvents.length > 0) {
    const selectedEvent = highRiskEvents[Math.floor(Math.random() * highRiskEvents.length)];
    return {
      type: 'EVENT',
      description: `A dangerous opportunity presents itself: "${selectedEvent.title}"`,
      eventDefinition: selectedEvent as any,
    };
  }

  return generateStoryEvent(floor, arcName);
};

