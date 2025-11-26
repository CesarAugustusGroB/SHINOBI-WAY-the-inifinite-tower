import { Room, GameEventDefinition } from '../types';
import { EVENTS, BOSS_NAMES } from '../constants';
import { generateEnemy, getStoryArc } from './EnemySystem';

export const generateRooms = (currentFloor: number, diff: number): Room[] => {
  const rooms: Room[] = [];
  const arc = getStoryArc(currentFloor);

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

  for (let i = 0; i < 3; i++) {
    const roll = Math.random();
    const rivalChance = arc.name === 'ROGUE_ARC' ? 0.15 : 0.05;

    if (roll < rivalChance && currentFloor > 5) {
      rooms.push({
        type: 'ELITE',
        description: 'Your rival has found you...',
        enemy: { ...generateEnemy(currentFloor, 'ELITE', diff + 20), name: 'Rival Ninja', tier: 'Fated Rival', dropRateBonus: 100 }
      });
      continue;
    }

    if (i === 0) {
      const restThreshold = arc.name === 'EXAMS_ARC' ? 0.2 : 0.4;
      if (Math.random() < restThreshold) {
        if (Math.random() < 0.1) {
          rooms.push({
            type: 'EVENT',
            description: 'A hidden Ramen stand!',
            eventDefinition: { id: 'ramen_shop', title: 'Ichiraku Ramen', description: 'Teuchi offers you a special bowl.', choices: [{ label: 'Eat Ramen', type: 'HEAL_ALL', description: 'Full Heal' }] }
          });
        } else {
          rooms.push({ type: 'REST', description: 'A brief respite in the shadows.' });
        }
      } else {
        rooms.push({
          type: 'EVENT',
          description: 'A quiet spot for training.',
          eventDefinition: { id: 'training_tree', title: 'Tree Climbing Practice', description: 'Focus your chakra.', choices: [{ label: 'Train Hard', type: 'GAIN_XP', value: 50 + (currentFloor * 5), description: 'Gain XP' }, { label: 'Meditate', type: 'HEAL_CHAKRA', description: 'Restore Chakra' }] }
        });
      }
      continue;
    }

    let ambushRate = 0.1 + (diff * 0.002);
    if (arc.name === 'WAR_ARC') ambushRate += 0.2;

    if (roll < ambushRate) {
      rooms.push({ type: 'AMBUSH', description: 'Killer Intent spikes nearby!', enemy: generateEnemy(currentFloor, 'AMBUSH', diff) });
    } else if (roll < ambushRate + 0.3) {
      const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      rooms.push({ type: 'EVENT', description: 'An odd occurrence.', eventDefinition: eventDef });
    } else {
      const enemy = generateEnemy(currentFloor, 'NORMAL', diff);
      let combatDesc = "A rogue ninja blocks the path.";
      if (arc.name === 'EXAMS_ARC') combatDesc = "Another team wants your scroll.";
      rooms.push({ type: 'COMBAT', description: combatDesc, enemy });
    }
  }

  return rooms;
};
