"use client";

// Mock-first Liveblocks replacement: in-memory pub/sub + presence.
// Swap with @liveblocks/react RoomProvider when API keys are provisioned.
import { useSyncExternalStore, useCallback } from "react";

type Listener = () => void;

class MockRoom {
  private listeners = new Set<Listener>();
  private presence: Record<string, string> = {};

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  snapshot = (): Record<string, string> => ({ ...this.presence });

  getSnapshot = (): Record<string, string> => this.snapshot();

  setPresence(user: string, location: string): void {
    this.presence[user] = location;
    this.listeners.forEach((l) => l());
  }

  broadcast(): void {
    this.listeners.forEach((l) => l());
  }
}

export const mockRoom = new MockRoom();

export function useMockPresence(user: string, location: string): Record<string, string> {
  const subscribe = useCallback(
    (fn: Listener) => mockRoom.subscribe(fn),
    []
  );
  const getSnapshot = useCallback(() => mockRoom.getSnapshot(), []);
  const presence = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Register presence lazily on mount via effect in callers if needed.
  // Keep function pure; callers call mockRoom.setPresence in useEffect.
  void user;
  void location;
  return presence;
}

export function announcePresence(user: string, location: string): void {
  mockRoom.setPresence(user, location);
}
