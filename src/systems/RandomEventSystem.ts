export interface RandomEvent {
  id: string;
  name: string;
  duration: number;  // seconds
  damage?: number;   // per-tick damage for hazard events
  warning: string;   // warning text shown during countdown
}

const EVENTS: RandomEvent[] = [
  {
    id: 'super_weapon',
    name: 'Super Weapon Spawn',
    duration: 8,
    warning: 'A powerful weapon appears!',
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    duration: 0.5,
    damage: 20,
    warning: 'Lightning incoming!',
  },
  {
    id: 'poison_rain',
    name: 'Poison Rain',
    duration: 7,
    damage: 2,
    warning: 'Toxic rain approaching!',
  },
  {
    id: 'seagull',
    name: 'Seagull Grab',
    duration: 4,
    warning: 'A seagull circles overhead!',
  },
];

export interface RandomEventState {
  activeEvent: string | null;
  pendingEvent?: string;
  warningTimer: number;
  eventTimer: number;
  eventsTriggered: number;
}

const EVENT_CHANCE = 0.3;
const MAX_EVENTS_PER_MATCH = 2;

export function createEventState(): RandomEventState {
  return {
    activeEvent: null,
    warningTimer: 0,
    eventTimer: 0,
    eventsTriggered: 0,
  };
}

export function rollForEvent(state: RandomEventState): RandomEventState {
  // Don't trigger if max events reached or one is already active/pending
  if (state.eventsTriggered >= MAX_EVENTS_PER_MATCH) return state;
  if (state.activeEvent !== null) return state;
  if (state.warningTimer > 0) return state;

  if (Math.random() > EVENT_CHANCE) return state;

  // Pick a random event
  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const warningTime = 1 + Math.random(); // 1-2 seconds

  return {
    ...state,
    pendingEvent: event.id,
    warningTimer: warningTime,
  };
}

export function updateEvent(state: RandomEventState, dt: number): RandomEventState {
  // Warning countdown
  if (state.warningTimer > 0) {
    const remaining = state.warningTimer - dt;
    if (remaining <= 0) {
      // Activate the pending event
      const event = EVENTS.find(e => e.id === state.pendingEvent);
      return {
        ...state,
        warningTimer: 0,
        activeEvent: state.pendingEvent || null,
        pendingEvent: undefined,
        eventTimer: event?.duration ?? 3,
        eventsTriggered: state.eventsTriggered + 1,
      };
    }
    return { ...state, warningTimer: remaining };
  }

  // Active event countdown
  if (state.activeEvent !== null && state.eventTimer > 0) {
    const remaining = state.eventTimer - dt;
    if (remaining <= 0) {
      return { ...state, activeEvent: null, eventTimer: 0 };
    }
    return { ...state, eventTimer: remaining };
  }

  return state;
}

export function getActiveEvent(state: RandomEventState): RandomEvent | null {
  if (!state.activeEvent) return null;
  return EVENTS.find(e => e.id === state.activeEvent) || null;
}
