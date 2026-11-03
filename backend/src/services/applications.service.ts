import { toApplication } from "../mappers/application.mapper.ts";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import type { OffersRepository } from "../repositories/offers.repository.ts";
import { isStudent } from "./permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_MESSAGE_LENGTH = 2000;

const requireStudent = (viewer: User): void => {
  if (!isStudent(viewer)) {
    throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut gérer ses candidatures");
  }
};

export const createApplicationsService = (
  repository: ApplicationsRepository,
  offersRepository: OffersRepository,
) => ({
  listApplications: (viewer: User): Application[] => {
    requireStudent(viewer);
    return repository.findByStudent(viewer.id).map(toApplication);
  },

  createApplication: (viewer: User, offerId: number, message: string | null): Application => {
    requireStudent(viewer);
    const offer = offersRepository.findById(offerId);
    if (offer === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (offer.status !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "L'offre n'est pas publiée");
    }
    if (repository.hasActiveForOffer(offerId, viewer.id)) {
      throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
    }
    const normalizedMessage = message?.trim() || null;
    if (normalizedMessage !== null && normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new HttpError(
        400,
        "INVALID_BODY",
        `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`,
      );
    }
    const application = repository.findById(repository.create(offerId, viewer.id, normalizedMessage), viewer.id);
    if (application === undefined) {
      throw new HttpError(500, "INTERNAL_ERROR", "La candidature n'a pas pu être créée");
    }
    return toApplication(application);
  },

  withdrawApplication: (viewer: User, id: number): void => {
    requireStudent(viewer);
    const application = repository.findById(id, viewer.id);
    if (application === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Candidature introuvable");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(409, "APPLICATION_PROCESSED", "Cette candidature a déjà été traitée");
    }
    if (!repository.withdraw(id, viewer.id)) {
      throw new HttpError(500, "INTERNAL_ERROR", "La candidature n'a pas pu être retirée");
    }
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
