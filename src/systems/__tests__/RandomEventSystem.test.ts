import { describe, it, expect } from 'vitest';
import {
  createEventState,
  rollForEvent,
  updateEvent,
  getActiveEvent,
  type RandomEventState,
  type RandomEvent,
} from '../RandomEventSystem';

describe('RandomEventSystem', () => {
  describe('createEventState', () => {
    it('starts with no active event', () => {
      const state = createEventState();
      expect(state.activeEvent).toBeNull();
      expect(state.eventsTriggered).toBe(0);
      expect(state.warningTimer).toBe(0);
      expect(state.eventTimer).toBe(0);
    });
  });

  describe('rollForEvent', () => {
    it('can trigger an event (30% chance)', () => {
      let triggered = 0;
      for (let i = 0; i < 1000; i++) {
        const result = rollForEvent(createEventState());
        if (result.activeEvent !== null || result.warningTimer > 0) triggered++;
      }
      // 30% chance, expect roughly 250-350 triggers
      expect(triggered).toBeGreaterThan(200);
      expect(triggered).toBeLessThan(400);
    });

    it('does not trigger more than 2 events per match', () => {
      let state = createEventState();
      state = { ...state, eventsTriggered: 2 };
      const result = rollForEvent(state);
      expect(result.activeEvent).toBeNull();
      expect(result.warningTimer).toBe(0);
    });

    it('does not trigger while an event is active', () => {
      let state = createEventState();
      state = { ...state, activeEvent: 'lightning', eventTimer: 3 };
      const result = rollForEvent(state);
      expect(result.activeEvent).toBe('lightning');
    });

    it('starts with a warning timer before the event activates', () => {
      // Force trigger by testing many times
      let found = false;
      for (let i = 0; i < 1000; i++) {
        const result = rollForEvent(createEventState());
        if (result.warningTimer > 0) {
          expect(result.warningTimer).toBeGreaterThanOrEqual(1);
          expect(result.warningTimer).toBeLessThanOrEqual(2);
          expect(result.pendingEvent).toBeTruthy();
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('updateEvent', () => {
    it('counts down warning timer', () => {
      let state = createEventState();
      state = { ...state, warningTimer: 1.5, pendingEvent: 'lightning' };
      const result = updateEvent(state, 0.5);
      expect(result.warningTimer).toBeCloseTo(1.0);
      expect(result.activeEvent).toBeNull();
    });

    it('activates event when warning expires', () => {
      let state = createEventState();
      state = { ...state, warningTimer: 0.1, pendingEvent: 'lightning' };
      const result = updateEvent(state, 0.5);
      expect(result.activeEvent).toBe('lightning');
      expect(result.eventTimer).toBeGreaterThan(0);
      expect(result.warningTimer).toBe(0);
    });

    it('counts down event timer', () => {
      let state = createEventState();
      state = { ...state, activeEvent: 'poison_rain', eventTimer: 5 };
      const result = updateEvent(state, 1);
      expect(result.eventTimer).toBeCloseTo(4);
      expect(result.activeEvent).toBe('poison_rain');
    });

    it('ends event when timer expires', () => {
      let state = createEventState();
      state = { ...state, activeEvent: 'poison_rain', eventTimer: 0.1, eventsTriggered: 1 };
      const result = updateEvent(state, 0.5);
      expect(result.activeEvent).toBeNull();
      expect(result.eventTimer).toBe(0);
      expect(result.eventsTriggered).toBe(1);
    });
  });

  describe('getActiveEvent', () => {
    it('returns null when no event active', () => {
      expect(getActiveEvent(createEventState())).toBeNull();
    });

    it('returns event definition when active', () => {
      let state = createEventState();
      state = { ...state, activeEvent: 'lightning' };
      const event = getActiveEvent(state);
      expect(event).toBeDefined();
      expect(event!.id).toBe('lightning');
      expect(event!.name).toBeTruthy();
    });

    it('all 4 event types exist', () => {
      const types: RandomEvent['id'][] = ['super_weapon', 'lightning', 'poison_rain', 'seagull'];
      for (const id of types) {
        let state = createEventState();
        state = { ...state, activeEvent: id };
        const event = getActiveEvent(state);
        expect(event).toBeDefined();
        expect(event!.id).toBe(id);
      }
    });
  });
});
