import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

const parsePositiveInteger = (value: unknown, field: string): number => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new HttpError(400, "INVALID_BODY", `${field} doit être un entier positif`);
  }
  return value;
};

const parseBody = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_BODY", "Le corps de la requête doit être un objet");
  }
  return value as Record<string, unknown>;
};

export const createApplicationsRouter = (service: ApplicationsService) => {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(service.listApplications(getCurrentUser(req)).map(toApplicationDto));
  });

  router.post("/", (req, res) => {
    const body = parseBody(req.body);
    const offerId = parsePositiveInteger(body.offerId, "offerId");
    const message = body.message === undefined || body.message === null ? null : body.message;
    if (message !== null && typeof message !== "string") {
      throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
    }
    const application = service.createApplication(getCurrentUser(req), offerId, message);
    res.status(201).json(toApplicationDto(application));
  });

  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "INVALID_QUERY", "L'identifiant de candidature est invalide");
    }
    service.withdrawApplication(getCurrentUser(req), id);
    res.status(204).send();
  });

  return router;
};
