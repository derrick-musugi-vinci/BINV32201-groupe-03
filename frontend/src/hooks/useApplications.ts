import { useCallback, useEffect, useState } from "react";
import type { Application } from "../models/application.ts";
import {
  createApplication,
  getApplications,
  withdrawApplication,
} from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (
  token: string,
  onUnauthorized: () => void,
  enabled = true,
) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setApplications(await getApplications(token));
      setError(null);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    getApplications(token)
      .then(setApplications)
      .catch((reason: unknown) => {
        if (isUnauthorized(reason)) onUnauthorized();
        else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      })
      .finally(() => setIsLoading(false));
  }, [token, onUnauthorized, enabled]);

  const apply = async (offerId: number, message: string): Promise<void> => {
    try {
      await createApplication(token, offerId, message);
      await reload();
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      throw reason;
    }
  };

  const withdraw = async (id: number): Promise<void> => {
    try {
      await withdrawApplication(token, id);
      await reload();
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      throw reason;
    }
  };

  return { applications, isLoading, error, reload, apply, withdraw };
};
