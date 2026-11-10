import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { APPLICATION, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const studentToken = (id: number = STUDENT.LUCAS_DUPONT) => tokenFor("STUDENT", id);

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

  it("accepte un message vide et refuse un message trop long", async () => {
    const emptyMessage = await request(app)
      .post("/applications")
      .set("Authorization", studentToken())
      .send({ offerId: OFFER.BILLING_API, message: "   " });

    expect(emptyMessage.status).toBe(201);
    expect(emptyMessage.body.message).toBeNull();

    const longMessage = await request(app)
      .post("/applications")
      .set("Authorization", studentToken(STUDENT.INES_HADDAD))
      .send({ offerId: OFFER.BILLING_API, message: "a".repeat(2001) });

    expect(longMessage.status).toBe(400);
    expect(longMessage.body.error.code).toBe("INVALID_BODY");
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

    const listed = await request(app)
      .get("/applications")
      .set("Authorization", studentToken());
    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, status: "WITHDRAWN" }),
      ]),
    );

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

  it("refuse la création et le retrait par un administrateur", async () => {
    const adminToken = tokenFor("ADMIN", 1);
    const createResponse = await request(app)
      .post("/applications")
      .set("Authorization", adminToken)
      .send({ offerId: OFFER.BILLING_API });
    expect(createResponse.status).toBe(403);
    expect(createResponse.body.error.code).toBe("FORBIDDEN");

    const withdrawResponse = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", adminToken);
    expect(withdrawResponse.status).toBe(403);
    expect(withdrawResponse.body.error.code).toBe("FORBIDDEN");
  });
});
