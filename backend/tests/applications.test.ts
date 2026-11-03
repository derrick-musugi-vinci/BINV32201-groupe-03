import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { APPLICATION, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const studentToken = (id = STUDENT.LUCAS_DUPONT) => tokenFor("STUDENT", id);

describe("applications étudiant", () => {
  it("liste uniquement les candidatures de l'étudiant connecté", async () => {
    const response = await request(app).get("/applications").set("Authorization", studentToken());

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: APPLICATION.LUCAS_FLEET_APP,
      offerId: OFFER.FLEET_APP,
      status: "IN_PROGRESS",
    });
  });

  it("crée une candidature sur une offre publiée", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.BILLING_API, message: "  Mon message  " });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.BILLING_API,
      message: "Mon message",
      status: "IN_PROGRESS",
    });
  });

  it("refuse une offre non publiée et les doublons actifs", async () => {
    const nonPublished = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.CLIENT_PORTAL });
    expect(nonPublished.status).toBe(409);
    expect(nonPublished.body.error.code).toBe("OFFER_NOT_PUBLISHED");

    const duplicate = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.FLEET_APP });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("APPLICATION_EXISTS");
  });

  it("retire une candidature en cours et permet une nouvelle candidature", async () => {
    const created = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.BILLING_API });

    const withdrawn = await request(app)
      .delete(`/applications/${created.body.id}`)
      .set("Authorization", studentToken());
    expect(withdrawn.status).toBe(204);

    const replacement = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.BILLING_API });
    expect(replacement.status).toBe(201);
  });

  it("refuse le retrait d'une candidature traitée", async () => {
    const response = await request(app)
      .delete(`/applications/${APPLICATION.MATEUSZ_CLOUD_MIGRATION}`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.MATEUSZ_KOWALSKI));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_PROCESSED");
  });

  it("réserve les candidatures aux étudiants", async () => {
    const response = await request(app)
      .get("/applications")
      .set("Authorization", tokenFor("ADMIN", 1));

    expect(response.status).toBe(403);
  });
});
