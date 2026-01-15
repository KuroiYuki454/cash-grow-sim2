import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactElement, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface RandomEvent {
  id: string;
  name: string;
  multiplier: number;
  duration: number;
  color: string;
  icon: string;
}

const EVENTS: RandomEvent[] = [
  { id: 'crash', name: 'Krach boursier', multiplier: 0.5, duration: 60, color: 'hsl(0, 70%, 50%)', icon: '📉' },
  { id: 'bonus', name: 'Bonus fiscal', multiplier: 2, duration: 60, color: 'hsl(120, 60%, 45%)', icon: '💰' },
  { id: 'bull', name: 'Marché haussier', multiplier: 4, duration: 60, color: 'hsl(45, 90%, 50%)', icon: '🐂' },
  { id: 'jackpot', name: 'Jackpot bancaire', multiplier: 10, duration: 60, color: 'hsl(280, 70%, 55%)', icon: '🎰' },
  { id: 'miracle', name: 'Miracle financier', multiplier: 100, duration: 60, color: 'hsl(320, 80%, 60%)', icon: '✨' },
];

const EVENT_WEIGHTS = [
  { event: EVENTS[0], weight: 25 },
  { event: EVENTS[1], weight: 40 },
  { event: EVENTS[2], weight: 20 },
  { event: EVENTS[3], weight: 10 },
  { event: EVENTS[4], weight: 5 },
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

function getRandomDelayMs(minSeconds: number, maxSeconds: number): number {
  return (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
}

export interface RandomEventStateDto {
  account_id: string;
  active_event_id: string | null;
  multiplier: number;
  started_at: string | null;
  ends_at: string | null;
  next_event_at: string | null;
}

interface RandomEventContextType {
  activeEvent: RandomEvent | null;
  timeRemaining: number;
  nextEventIn: number | null;
  multiplier: number;
  loading: boolean;
}

const RandomEventContext = createContext<RandomEventContextType | undefined>(undefined);

export function RandomEventProvider({ children }: { children: ReactNode }): ReactElement {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [nextEventIn, setNextEventIn] = useState<number | null>(null);

  const timersRef = useRef<{ tick?: number; trigger?: number }>({});

  const clearTimers = () => {
    if (timersRef.current.tick) window.clearInterval(timersRef.current.tick);
    if (timersRef.current.trigger) window.clearTimeout(timersRef.current.trigger);
    timersRef.current = {};
  };

  const eventsById = useMemo(() => {
    const map = new Map<string, RandomEvent>();
    EVENTS.forEach(e => map.set(e.id, e));
    return map;
  }, []);

  useEffect(() => {
    clearTimers();
    setActiveEvent(null);
    setTimeRemaining(0);
    setNextEventIn(null);

    if (!user || !token) {
      setLoading(false);
      return;
    }

    const setup = async () => {
      try {
        const state = await api.getRandomEventState(user.id);
        const now = Date.now();

        if (state?.active_event_id && state.ends_at) {
          const endsAtMs = new Date(state.ends_at).getTime();
          const remaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));
          const event = eventsById.get(state.active_event_id) ?? null;

          if (event && remaining > 0) {
            setActiveEvent(event);
            setTimeRemaining(remaining);
            setNextEventIn(null);
            startTick(user.id, endsAtMs);
            setLoading(false);
            return;
          }
        }

        const nextAtMs = state?.next_event_at ? new Date(state.next_event_at).getTime() : null;
        const effectiveNextAtMs = nextAtMs && Number.isFinite(nextAtMs) ? nextAtMs : now + getRandomDelayMs(30, 120);

        await api.upsertRandomEventState(user.id, {
          active_event_id: null,
          multiplier: 1,
          started_at: null,
          ends_at: null,
          next_event_at: new Date(effectiveNextAtMs).toISOString(),
        });

        scheduleNext(user.id, effectiveNextAtMs);
        setLoading(false);
      } catch (error) {
        console.error('Failed to setup random event state:', error);
        setLoading(false);
      }
    };

    const startTick = (accountId: string, endsAtMs: number) => {
      timersRef.current.tick = window.setInterval(async () => {
        const nowMs = Date.now();
        const remaining = Math.max(0, Math.floor((endsAtMs - nowMs) / 1000));
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearTimers();
          setActiveEvent(null);
          setTimeRemaining(0);

          const nextAt = Date.now() + getRandomDelayMs(30, 120);
          setNextEventIn(Math.floor((nextAt - Date.now()) / 1000));

          await api.upsertRandomEventState(accountId, {
            active_event_id: null,
            multiplier: 1,
            started_at: null,
            ends_at: null,
            next_event_at: new Date(nextAt).toISOString(),
          });

          scheduleNext(accountId, nextAt);
        }
      }, 1000);
    };

    const scheduleNext = (accountId: string, nextAtMs: number) => {
      const now = Date.now();
      const seconds = Math.max(0, Math.floor((nextAtMs - now) / 1000));
      setNextEventIn(seconds);

      timersRef.current.tick = window.setInterval(() => {
        setNextEventIn(prev => {
          if (prev === null || prev <= 1) return null;
          return prev - 1;
        });
      }, 1000);

      timersRef.current.trigger = window.setTimeout(async () => {
        clearTimers();

        const event = getRandomEvent();
        const startedAt = Date.now();
        const endsAt = startedAt + event.duration * 1000;

        setActiveEvent(event);
        setTimeRemaining(event.duration);
        setNextEventIn(null);

        await api.upsertRandomEventState(accountId, {
          active_event_id: event.id,
          multiplier: event.multiplier,
          started_at: new Date(startedAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          next_event_at: null,
        });

        startTick(accountId, endsAt);
      }, Math.max(0, nextAtMs - now));
    };

    setup();

    return () => {
      clearTimers();
    };
  }, [eventsById, token, user]);

  const multiplier = activeEvent?.multiplier ?? 1;

  return (
    <RandomEventContext.Provider value={{ activeEvent, timeRemaining, nextEventIn, multiplier, loading }}>
      {children}
    </RandomEventContext.Provider>
  );
}

export function useRandomEventState() {
  const ctx = useContext(RandomEventContext);
  if (!ctx) throw new Error('useRandomEventState must be used within RandomEventProvider');
  return ctx;
}
