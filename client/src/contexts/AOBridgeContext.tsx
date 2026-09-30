import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AOBridgeContextValue = {
  house: string;
  houseName: string;
  mount: string;
  returnUrl: string;
  source: string;
  mission: string;
  eventId: string;
};

type AOBridgeApi = AOBridgeContextValue & {
  decorateUrl: (rawUrl: string, options?: { houseAware?: boolean; returnUrl?: string; source?: string; mission?: string; eventId?: string }) => string;
};

const STORAGE = {
  house: "anom_selectedHouse",
  houseName: "anom_selectedHouseName",
  mount: "anom_selectedMount",
  returnUrl: "ao_return_url",
  source: "ao_source",
  mission: "ao_mission",
  eventId: "ao_event_id",
} as const;

const HOUSES: Record<string, string> = {
  "1": "Pixel & Dot",
  "2": "Clifford & Tater",
  "3": "Mood Buddies",
  "4": "Patrol Guardians",
};

const FALLBACK_RETURN_URL = "https://anomartsy.xyz/";
const AOBridgeContext = createContext<AOBridgeApi | undefined>(undefined);

function readStorage(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage should not break the app.
  }
}

function safeReturn(value: string | null) {
  if (!value) return FALLBACK_RETURN_URL;
  try {
    const parsed = new URL(value, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : FALLBACK_RETURN_URL;
  } catch {
    return FALLBACK_RETURN_URL;
  }
}

function readContext(): AOBridgeContextValue {
  const params = new URLSearchParams(window.location.search);
  const house = params.get("house") || readStorage(STORAGE.house, "1");
  const mount = params.get("mount") || readStorage(STORAGE.mount, "aurora");
  const returnUrl = safeReturn(params.get("return") || readStorage(STORAGE.returnUrl, FALLBACK_RETURN_URL));
  const source = params.get("source") || readStorage(STORAGE.source, "homeworld");
  const mission = params.get("mission") || readStorage(STORAGE.mission, "");
  const eventId = params.get("event") || readStorage(STORAGE.eventId, "");
  const houseName = HOUSES[house] || readStorage(STORAGE.houseName, house);

  writeStorage(STORAGE.house, house);
  writeStorage(STORAGE.houseName, houseName);
  writeStorage(STORAGE.mount, mount);
  writeStorage(STORAGE.returnUrl, returnUrl);
  writeStorage(STORAGE.source, source);
  writeStorage(STORAGE.mission, mission);
  writeStorage(STORAGE.eventId, eventId);

  return { house, houseName, mount, returnUrl, source, mission, eventId };
}

export function AOBridgeProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AOBridgeContextValue>(() => readContext());

  useEffect(() => {
    const sync = () => setContext(readContext());
    window.addEventListener("popstate", sync);
    document.body.dataset.aoHouse = context.house;
    document.body.dataset.aoMount = context.mount;
    document.body.dataset.aoSource = context.source;
    window.dispatchEvent(new CustomEvent("ao:bridge-ready", { detail: context }));
    return () => window.removeEventListener("popstate", sync);
  }, [context]);

  const api = useMemo<AOBridgeApi>(() => ({
    ...context,
    decorateUrl(rawUrl, options = {}) {
      if (options.houseAware === false) return rawUrl;
      try {
        const url = new URL(rawUrl, window.location.href);
        url.searchParams.set("house", context.house);
        url.searchParams.set("mount", context.mount);
        url.searchParams.set("return", options.returnUrl || context.returnUrl || window.location.href);
        url.searchParams.set("source", options.source || context.source);
        if (options.mission || context.mission) url.searchParams.set("mission", options.mission || context.mission);
        if (options.eventId || context.eventId) url.searchParams.set("event", options.eventId || context.eventId);
        return url.href;
      } catch {
        return rawUrl;
      }
    },
  }), [context]);

  return <AOBridgeContext.Provider value={api}>{children}</AOBridgeContext.Provider>;
}

export function useAOBridge() {
  const context = useContext(AOBridgeContext);
  if (!context) throw new Error("useAOBridge must be used within AOBridgeProvider");
  return context;
}
