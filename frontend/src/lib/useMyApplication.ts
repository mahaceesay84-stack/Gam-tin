"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Application } from "./types";

function pickCurrent(list: Application[]): Application | null {
  return list.find((a) => a.status !== "rejected") ?? list[0] ?? null;
}

/** Loads the student's current application (latest non-rejected, else latest). */
export function useMyApplication() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const list = await api.get<Application[]>("/clearance/applications/");
      setApp(pickCurrent(list));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Application[]>("/clearance/applications/")
      .then((list) => !cancelled && setApp(pickCurrent(list)))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { app, setApp, loading, error, reload };
}
