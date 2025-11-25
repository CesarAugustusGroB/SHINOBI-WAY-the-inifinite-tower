# 🎮 SHINOBI WAY - Developer Quick Reference Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Where to Find What?

### Adding a New Game System
**Location:** `src/game/systems/`

```typescript
// src/game/systems/MyNewSystem.ts
export const myFunction = (params: Type): ReturnType => {
  // Pure game logic here (no React)
};
```

### Adding a New UI Component
**Location:** `src/components/`

```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { Player } from '../game/types';

interface MyComponentProps {
  player: Player;
}

const MyComponent: React.FC<MyComponentProps> = ({ player }) => {
  return <div>{/* JSX here */}</div>;
};

export default MyComponent;
```

### Adding a New Game Screen
**Location:** `src/scenes/`

```typescript
// src/scenes/MyScene.tsx
import React from 'react';
import { GameState } from '../game/types';

interface MySceneProps {
  onNavigate: (state: GameState) => void;
}

const MyScene: React.FC<MySceneProps> = ({ onNavigate }) => {
  return <div>{/* Scene JSX here */}</div>;
};

export default MyScene;
```

### Adding a Custom Hook
**Location:** `src/hooks/`

```typescript
// src/hooks/useMyHook.ts
import { useState, useCallback } from 'react';

export const useMyHook = () => {
  const [state, setState] = useState(initialValue);

  const action = useCallback(() => {
    // Hook logic
  }, []);

  return { state, action };
};
```

### Adding Entity Logic
**Location:** `src/game/entities/`

```typescript
// src/game/entities/MyEntity.ts
import { MyType } from '../types';

export const myEntityFunction = (entity: MyType): void => {
  // Entity-specific logic
};
```

---

## 🔄 Common Patterns

### Using Game Systems in a Scene

```typescript
import { calculateDamage } from '../game/systems/StatSystem';
import { generateItem } from '../game/systems/LootSystem';

// Use the functions
const damage = calculateDamage(playerStats, enemyStats, skill, ...);
const item = generateItem(floor, difficulty);
```

### Accessing Game State

```typescript
import { useGameStore } from '../game/state/useGameStore';

const MyComponent = () => {
  // Access individual state slices if using Zustand pattern:
  // const player = useGameStore((state) => state.player);

  // For now, receive as props from App.tsx
};
```

### Adding a New Constant

```typescript
// src/game/constants/index.ts
export const MY_NEW_CONSTANT = {
  value: 100,
  label: 'My Constant'
};

// Import it
import { MY_NEW_CONSTANT } from '../game/constants';
```

### Adding a New Type

```typescript
// src/game/types.ts
export interface MyNewType {
  id: string;
  name: string;
  // ... properties
}

// Import it
import { MyNewType } from '../game/types';
```

---

## 📊 Data Flow Example

### User Clicks "Attack" Skill in Combat

```
1. Combat.tsx (Scene)
   └─ onClick={useSkill(skill)}

2. App.tsx (Controller)
   └─ useSkill() function

3. CombatSystem.ts (Pure Logic)
   └─ Calls StatSystem.calculateDamage()

4. StatSystem.ts (Pure Logic)
   └─ Returns DamageResult

5. App.tsx (Update State)
   └─ setEnemy with new HP
   └─ setTurnState('ENEMY_TURN')

6. useGameLoop Hook
   └─ Waits 800ms
   └─ Calls processEnemyTurn()

7. CombatSystem.ts (Pure Logic)
   └─ Calculates enemy turn

8. App.tsx (Update State)
   └─ Updates player/enemy
   └─ Add log entries
   └─ Check for victory/defeat
```

---

## 🧪 Testing Strategy

### Testing Systems (Pure Logic)

```typescript
// test/game/systems/StatSystem.test.ts
import { calculateDerivedStats } from '../../../src/game/systems/StatSystem';
import { CLAN_STATS } from '../../../src/game/constants';

describe('StatSystem', () => {
  it('should calculate derived stats correctly', () => {
    const stats = calculateDerivedStats(CLAN_STATS.UCHIHA, {});
    expect(stats.derived.maxHp).toBeGreaterThan(0);
  });
});
```

### Testing Entities

```typescript
// test/game/entities/Player.test.ts
import { createPlayer, checkLevelUp } from '../../../src/game/entities/Player';
import { Clan } from '../../../src/game/types';

describe('Player', () => {
  it('should create player with correct initial stats', () => {
    const player = createPlayer(Clan.UCHIHA);
    expect(player.level).toBe(1);
  });
});
```

### Testing Hooks

```typescript
// test/hooks/useGameLoop.test.ts
import { renderHook } from '@testing-library/react';
import { useGameLoop } from '../../../src/hooks/useGameLoop';

describe('useGameLoop', () => {
  it('should process enemy turn after delay', () => {
    // Test implementation
  });
});
```

---

## 🚀 Performance Tips

### 1. Memoize Heavy Computations
```typescript
const playerStats = useMemo(() => {
  if (!player) return null;
  return getPlayerFullStats(player);
}, [player]);
```

### 2. Use useCallback for Event Handlers
```typescript
const handleUseSkill = useCallback((skill: Skill) => {
  // Handle skill usage
}, [player, enemy]);
```

### 3. Split Large Components
Instead of one giant Combat scene, split into:
- CombatHeader.tsx (Enemy info)
- SkillGrid.tsx (Skills panel)
- CombatLog.tsx (Log display)

### 4. Lazy Load Scenes
```typescript
const Combat = lazy(() => import('./scenes/Combat'));
```

---

## 🐛 Debugging Tips

### Enable React DevTools
```bash
# Install browser extension:
# Chrome: React Developer Tools
# Firefox: React Developer Tools
```

### Console Logging Strategy
```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', variable);
}

// Or use a debug utility
const debug = (label: string, data: any) => {
  if (import.meta.env.DEV) {
    console.log(`[${label}]`, data);
  }
};
```

### Check Game State
```typescript
// In Chrome DevTools console
// If using Zustand:
// store.getState()

// If using Context:
// Check React DevTools "Context" tab
```

---

## 📋 Checklist for New Features

- [ ] Create/update types in `src/game/types.ts`
- [ ] Add constants in `src/game/constants/index.ts` if needed
- [ ] Implement game logic in appropriate system (`src/game/systems/`)
- [ ] Create components in `src/components/` if needed
- [ ] Update scenes in `src/scenes/` to use new feature
- [ ] Add to App.tsx if state management needed
- [ ] Test in development (`npm run dev`)
- [ ] Build production bundle (`npm run build`)
- [ ] Verify no console errors
- [ ] Test on mobile (if applicable)

---

## 🔍 Code Review Checklist

- [ ] Imports use correct relative paths
- [ ] No hardcoded values (use constants)
- [ ] Types are properly defined
- [ ] Functions have single responsibility
- [ ] No console.log left in code (use proper debugging)
- [ ] Comments explain WHY, not WHAT
- [ ] Tests written for new logic
- [ ] No prop drilling (use context/store if needed)
- [ ] Performance considered (memoization, callbacks)
- [ ] Accessibility considered (alt text, ARIA labels)

---

## 🆘 Troubleshooting

### "Cannot find module" Error
```
Solution: Check the relative path
- From src/components: use '../game/types'
- From src/scenes: use '../game/types'
- From src/App: use './game/types'
```

### Build Fails
```bash
# Clean build
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Types Not Recognized
```typescript
// Make sure types are exported in src/game/types.ts
export interface MyType {
  // properties
}

// And imported correctly
import { MyType } from '../game/types';
```

### State Not Updating
- Check that you're using setState, not mutating
- Verify the update function has correct dependencies
- Use React DevTools to see state changes

---

## 📚 Resources

### Vite Documentation
https://vitejs.dev/

### React Documentation
https://react.dev/

### TypeScript Handbook
https://www.typescriptlang.org/docs/

### Zustand (if upgrading state management)
https://github.com/pmndrs/zustand

---

## ✅ Code Standards

### Naming Conventions
- **Files:** PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)
- **Functions:** camelCase (e.g., `calculateDamage`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_LEVEL`)
- **Types/Interfaces:** PascalCase (e.g., `PlayerStats`)

### Import Order
```typescript
// 1. React/External libraries
import React from 'react';
import { Component } from 'lucide-react';

// 2. Game types and constants
import { Player } from '../game/types';
import { SKILLS } from '../game/constants';

// 3. Game systems
import { calculateDamage } from '../game/systems/StatSystem';

// 4. Components
import MyComponent from '../components/MyComponent';

// 5. Local imports
import { helper } from './helper';
```

### Comment Style
```typescript
// ❌ BAD: Comments that repeat code
const x = y + z; // Add y and z

// ✅ GOOD: Comments that explain WHY
const damage = baseDamage + strengthBonus; // Scale damage by player strength

// ✅ GOOD: Section headers for large functions
// --- Calculate Critical Hit ---
const isCrit = Math.random() < critChance;
```

---

## 🎓 Learning Path

1. **Understand the Architecture**
   - Read `PROJECT_STRUCTURE.txt`
   - Review `REFACTORING_COMPLETE.md`

2. **Explore Game Systems**
   - Start with `src/game/systems/StatSystem.ts`
   - Study `src/game/systems/CombatSystem.ts`

3. **Review Components**
   - Look at `src/components/StatBar.tsx` (simple)
   - Then `src/components/CharacterSheet.tsx` (complex)

4. **Examine Scenes**
   - Start with `src/scenes/MainMenu.tsx`
   - Progress to `src/scenes/Combat.tsx`

5. **Modify Something**
   - Change a constant value
   - Add a log message
   - Adjust a formula

6. **Build & Deploy**
   - Run `npm run build`
   - Test the production build

---

**Happy Coding! 🎮✨**

Remember: The architecture is designed to make your life easier. Use it!
