import { useState, useEffect, useCallback } from 'react';

export interface RandomEvent {
  id: string;
  name: string;
  multiplier: number;
  duration: number; // in seconds
  color: string;
  icon: string;
}

const EVENTS: RandomEvent[] = [
  { id: 'crash', name: 'Krach boursier', multiplier: 0.5, duration: 30, color: 'hsl(0, 70%, 50%)', icon: '📉' },
  { id: 'bonus', name: 'Bonus fiscal', multiplier: 2, duration: 20, color: 'hsl(120, 60%, 45%)', icon: '💰' },
  { id: 'bull', name: 'Marché haussier', multiplier: 4, duration: 15, color: 'hsl(45, 90%, 50%)', icon: '🐂' },
  { id: 'jackpot', name: 'Jackpot bancaire', multiplier: 10, duration: 10, color: 'hsl(280, 70%, 55%)', icon: '🎰' },
  { id: 'miracle', name: 'Miracle financier', multiplier: 100, duration: 5, color: 'hsl(320, 80%, 60%)', icon: '✨' },
];

// Weighted random selection - negative events more frequent, miracle very rare
const EVENT_WEIGHTS = [
  { event: EVENTS[0], weight: 25 },  // crash x0.5 - 25%
  { event: EVENTS[1], weight: 40 },  // bonus x2 - 40%
  { event: EVENTS[2], weight: 20 },  // bull x4 - 20%
  { event: EVENTS[3], weight: 10 },  // jackpot x10 - 10%
  { event: EVENTS[4], weight: 5 },   // miracle x100 - 5%
];

function getRandomEvent(): RandomEvent {
  const totalWeight = EVENT_WEIGHTS.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { event, weight } of EVENT_WEIGHTS) {
    random -= weight;
    if (random <= 0) return event;
  }
  
  return EVENT_WEIGHTS[0].event;
}

// Random time between min and max seconds
function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
}

export function useRandomEvent() {
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [nextEventIn, setNextEventIn] = useState<number | null>(null);

  // Start a new event
  const triggerEvent = useCallback(() => {
    const event = getRandomEvent();
    setActiveEvent(event);
    setTimeRemaining(event.duration);
  }, []);

  // Schedule next event
  useEffect(() => {
    if (activeEvent) return; // Don't schedule if event is active

    const delay = getRandomDelay(30, 120); // Between 30 seconds and 2 minutes
    setNextEventIn(Math.floor(delay / 1000));

    const timer = setTimeout(() => {
      triggerEvent();
    }, delay);

    return () => clearTimeout(timer);
  }, [activeEvent, triggerEvent]);

  // Countdown for next event
  useEffect(() => {
    if (activeEvent || nextEventIn === null) return;

    const interval = setInterval(() => {
      setNextEventIn(prev => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEvent, nextEventIn]);

  // Countdown for active event duration
  useEffect(() => {
    if (!activeEvent) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setActiveEvent(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEvent]);

  return {
    activeEvent,
    timeRemaining,
    nextEventIn,
    multiplier: activeEvent?.multiplier ?? 1,
  };
}
