# Changelog

All notable changes to SHINOBI WAY: THE INFINITE TOWER will be documented in this file.

## [Unreleased]

### Changed

- Remove Ryo option from revealed treasure choices (players now pick only from items)

## 2025-12-29

### Added

- Dual Treasure System with Locked Chests (reveal-or-blind) and Treasure Hunter (map pieces)
- TreasureChoice scene for treasure selection UI
- TreasureHuntReward scene for map completion rewards
- useTreasureHandlers hook extracting treasure logic from App.tsx
- Treasure balance constants in featureFlags.ts (config, dice odds, trap damage, map pieces)
- DEV_MODE feature flag for development-only features
- ImageTest scene for AI image generation testing (dev-only)

### Changed

- Extract treasure handlers to dedicated hook for better separation of concerns
- Use TreasureType enum instead of string literals
- Gate ImageTest behind DEV_MODE flag

### Fixed

- TreasureChoice card sizing (all options now same size)
- Type safety improvements (removed `any` types in ImageTest and TreasureHuntReward)

## 2025-12-24

### Added

- Centralized feature flags system (`src/config/featureFlags.ts`)
- Combat keyboard shortcuts (1-4 for skills, Space to pass turn)
- Shortcut key badges on skill cards

## 2025-12-17

### Added

- Intel system integration with story events

### Changed

- Import scaling functions directly from ScalingSystem
- Extract combat types to eliminate circular imports
- Major code modularization and separation of concerns

## 2025-12-16

### Added

- Wealth level and intel gathering system

### Changed

- Enforce separation of concerns between RegionSystem and LocationSystem

### Fixed

- Elite escape infinite loop
- Remove CombatSystem barrel export causing issues

## 2025-12-15

### Added

- Region-based exploration system (Region -> Location -> Room hierarchy)

### Changed

- Rename BranchingFloorSystem to LocationSystem
- Reorganize components into categorized subdirectories

## 2025-12-13

### Added

- Exploration creator skill for adding regions/locations/rooms
- RightSidebarPanel component

### Changed

- Refactor bag system to fixed-slot array architecture
- Align PlayerHUD width with BranchingExplorationMap

## 2025-12-11

### Added

- Artifact passive effects integrated into combat system

### Changed

- Refactor event system to use enhanced events with outcome modal

## 2025-12-10

### Added

- Combat Calculation and Workflow Systems (dual-system architecture)
- Unit tests for EventSystem, LootSystem, StatSystem
- Combat mechanics documentation and combat-system-creator skill
- Detailed buff tooltips and mechanics breakdown in PlayerHUD
- Comprehensive combat logging

### Changed

- Revamp combat mechanics with nerfed stealth ambush
- Improved enemy AI skill selection
- Refined damage calculations
- Enhance Stat System with Passive Skill Bonuses

## 2025-12-09

### Added

- Comprehensive Jutsu card system
- Simulation progression mode with confidence intervals

### Changed

- Revamp project structure
