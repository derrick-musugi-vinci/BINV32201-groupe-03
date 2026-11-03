import type { Offer } from "../models/offer.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  onApply?: (offerId: number, message: string) => Promise<void>;
  applyingOfferId?: number | null;
  applicationStatuses?: Record<number, "IN_PROGRESS" | "SELECTED" | "REJECTED" | "WITHDRAWN">;
}

const OfferTable = ({ offers, onApply, applyingOfferId, applicationStatuses = {} }: OfferTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {onApply && <th scope="col">Action</th>}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {onApply &&
              (applicationStatuses[offer.id] === undefined ||
                applicationStatuses[offer.id] === "REJECTED" ||
                applicationStatuses[offer.id] === "WITHDRAWN") && (
              <td>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const message = new FormData(form).get("message");
                    void onApply(offer.id, typeof message === "string" ? message : "");
                    form.reset();
                  }}
                >
                  <label>
                    <span className="visually-hidden">Message facultatif</span>
                    <textarea name="message" maxLength={2000} rows={2} placeholder="Message facultatif" />
                  </label>
                  <button className="button" type="submit" disabled={applyingOfferId === offer.id}>
                    {applyingOfferId === offer.id ? "Envoi…" : "Candidater"}
                  </button>
                </form>
              </td>
            )}
            {onApply &&
              applicationStatuses[offer.id] !== undefined &&
              applicationStatuses[offer.id] !== "REJECTED" &&
              applicationStatuses[offer.id] !== "WITHDRAWN" && (
              <td>Candidature déjà envoyée</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OfferTable;
