import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminState } from "@/lib/types";

const empty: AdminState = {
  users: [],
  counselors: [],
  telecallers: [],
  leads: [],
  documents: [],
  applications: [],
  shortlists: [],
  conversations: [],
  messages: [],
  leave: [],
  attendance: [],
  salary: [],
  notifications: [],
  universities: [],
  checklists: [],
  chatSessions: [],
  chatMessages: [],
};

const listeners = new Set<() => void>();
let cache: AdminState = empty;
let lastError = "";

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeStore(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getStore() {
  return cache;
}

export function getStoreError() {
  return lastError;
}

export async function refreshStore() {
  try {
    cache = await api<AdminState>("/state");
    lastError = "";
    emit();
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Could not load admin data";
    emit();
  }
}

export function useAdminStore() {
  const [data, setData] = useState(getStore);
  const [error, setError] = useState(getStoreError);
  useEffect(() => {
    void refreshStore();
    const unsub = subscribeStore(() => {
      setData({ ...getStore() });
      setError(getStoreError());
    });
    const poll = window.setInterval(() => {
      void refreshStore();
    }, 5000);
    return () => {
      unsub();
      window.clearInterval(poll);
    };
  }, []);
  return { ...data, error };
}
