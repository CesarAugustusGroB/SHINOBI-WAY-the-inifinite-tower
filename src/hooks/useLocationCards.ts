import { useCallback } from 'react';
import {
  GameState, Region, Location, LocationPath, LogEntry,
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel, BranchingFloor
} from '../game/types';
import {
  getCurrentLocation,
  choosePath,
  enterLocationFromCard,
  locationToBranchingFloor,
  drawLocationCards,
  evaluateIntel,
} from '../game/systems/RegionSystem';
import {
  logLocationSelect, logLocationEnter, logLocationLeave,
  logPathChoice, logIntelReset
} from '../game/utils/explorationDebug';

/**
 * State needed for location card operations
 */
export interface LocationCardState {
  region: Region | null;
  locationDeck: LocationDeck | null;
  intelPool: IntelPool;
  drawnCards: LocationCard[];
  selectedCardIndex: number | null;
  currentIntel: number;
  // Setters
  setRegion: React.Dispatch<React.SetStateAction<Region | null>>;
  setSelectedLocation: React.Dispatch<React.SetStateAction<Location | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setDrawnCards: React.Dispatch<React.SetStateAction<LocationCard[]>>;
  setSelectedCardIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Dependencies for location card operations
 */
export interface LocationCardDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  setGameState: (state: GameState) => void;
}

/**
 * Return type for location cards hook
 */
export interface UseLocationCardsReturn {
  handleCardSelect: (index: number) => void;
  handleEnterSelectedLocation: () => void;
  handlePathChoice: (path: LocationPath) => void;
  handleLeaveLocation: () => void;
}

/**
 * Hook that handles card selection and location navigation.
 * Manages the region map card-based location selection system.
 */
export function useLocationCards(
  state: LocationCardState,
  deps: LocationCardDeps
): UseLocationCardsReturn {
  const {
    region,
    locationDeck,
    intelPool,
    drawnCards,
    selectedCardIndex,
    currentIntel,
    setRegion,
    setSelectedLocation,
    setLocationFloor,
    setDrawnCards,
    setSelectedCardIndex,
    setCurrentIntel,
  } = state;

  const { addLog, setGameState } = deps;

  /**
   * Select a card on the region map
   */
  const handleCardSelect = useCallback((index: number) => {
    if (index >= 0 && index < drawnCards.length) {
      const card = drawnCards[index];
      logLocationSelect(card.locationId, card.location.name);
      setSelectedCardIndex(index);
      setSelectedLocation(card.location);
    }
  }, [drawnCards, setSelectedCardIndex, setSelectedLocation]);

  /**
   * Enter the selected location from a card
   */
  const handleEnterSelectedLocation = useCallback(() => {
    if (!region || !locationDeck || selectedCardIndex === null) return;

    const selectedCard = drawnCards[selectedCardIndex];
    if (!selectedCard) return;

    // Reset intel for new location
    setCurrentIntel(0);
    logIntelReset(selectedCard.location.name);

    const locationToEnter = selectedCard.location;

    logLocationEnter(locationToEnter.id, locationToEnter.name, locationToEnter.dangerLevel);
    const updatedRegion = enterLocationFromCard(region, locationToEnter.id);
    setRegion(updatedRegion);
    setSelectedLocation(locationToEnter);

    const locationFloorData = locationToBranchingFloor(updatedRegion);
    setLocationFloor(locationFloorData);

    addLog(`Entering ${locationToEnter.name}${selectedCard.isRevisit ? ' (Revisit)' : ''}...`, 'info');
    setGameState(GameState.LOCATION_EXPLORE);
  }, [
    region, locationDeck, selectedCardIndex, drawnCards,
    setCurrentIntel, setRegion, setSelectedLocation, setLocationFloor,
    addLog, setGameState
  ]);

  /**
   * Choose a path to travel to next location
   */
  const handlePathChoice = useCallback((path: LocationPath) => {
    if (!region || !locationDeck) return;
    const targetLoc = region.locations.find(l => l.id === path.targetLocationId);
    logPathChoice(path.id, targetLoc?.name || 'Unknown', path.pathType);
    const updatedRegion = choosePath(region, path.id);
    setRegion(updatedRegion);

    const { cardCount, revealedCount } = evaluateIntel(currentIntel);

    const rawCards = drawLocationCards(updatedRegion, locationDeck, intelPool, cardCount);
    const newCards = rawCards.map((card, index) => ({
      ...card,
      intelLevel: index < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE,
    }));
    setDrawnCards(newCards);
    setSelectedCardIndex(null);

    addLog(`Traveling to the next location...`, 'info');
    setGameState(GameState.REGION_MAP);
  }, [
    region, locationDeck, intelPool, currentIntel,
    setRegion, setDrawnCards, setSelectedCardIndex, addLog, setGameState
  ]);

  /**
   * Leave the current location and return to region map
   */
  const handleLeaveLocation = useCallback(() => {
    if (!region || !locationDeck) return;
    const location = getCurrentLocation(region);

    if (location?.isCompleted) {
      logLocationLeave(location.id, location.name, 'completed');

      const { cardCount, revealedCount } = evaluateIntel(currentIntel);

      const rawCards = drawLocationCards(region, locationDeck, intelPool, cardCount);
      const newCards = rawCards.map((card, index) => ({
        ...card,
        intelLevel: index < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE,
      }));
      setDrawnCards(newCards);
      setSelectedCardIndex(null);

      addLog('Location cleared. Choose your next destination.', 'info');
      setGameState(GameState.REGION_MAP);
    } else {
      addLog('Complete the location before leaving.', 'danger');
    }
  }, [
    region, locationDeck, intelPool, currentIntel,
    setDrawnCards, setSelectedCardIndex, addLog, setGameState
  ]);

  return {
    handleCardSelect,
    handleEnterSelectedLocation,
    handlePathChoice,
    handleLeaveLocation,
  };
}
