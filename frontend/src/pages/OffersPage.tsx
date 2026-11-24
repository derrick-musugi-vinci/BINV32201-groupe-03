import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import SearchField from "../components/SearchField.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import { useApplications } from "../hooks/useApplications.ts";
import type { PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | "">("");
  const [search, setSearch] = useState("");
  const { offers, isLoading, error } = useOffers(token, period || undefined, onUnauthorized);
  const query = search.trim().toLocaleLowerCase();
  const filteredOffers = offers.filter((offer) => offer.title.toLocaleLowerCase().includes(query));
  const {
    applications,
    isLoading: applicationsLoading,
    error: applicationsError,
    apply: applyApplication,
  } = useApplications(token, onUnauthorized, user.kind === "STUDENT");
  const [applyingOfferId, setApplyingOfferId] = useState<number | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const apply = async (offerId: number, message: string): Promise<void> => {
    setApplyingOfferId(offerId);
    setApplicationError(null);
    try {
      await applyApplication(offerId, message);
    } catch (reason: unknown) {
      setApplicationError(reason instanceof Error ? reason.message : "Erreur inconnue");
    } finally {
      setApplyingOfferId(null);
    }
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (applicationsError && user.kind === "STUDENT") return <ErrorState message={applicationsError} />;
    if (isLoading || (user.kind === "STUDENT" && applicationsLoading)) return <LoadingState />;
    if (filteredOffers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {filteredOffers.length} offre{filteredOffers.length > 1 ? "s" : ""}
        </p>
        {applicationError && <ErrorState message={applicationError} />}
        <OfferTable
          offers={filteredOffers}
          onApply={user.kind === "STUDENT" ? apply : undefined}
          applyingOfferId={applyingOfferId}
          applicationStatuses={Object.fromEntries(
            applications.map((application) => [application.offerId, application.status]),
          )}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <label>
        <span>Période</span>
        <select
          aria-label="Filtrer par période"
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodCode | "")}
        >
          <option value="">Toutes les périodes</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="OTHER">Autre période</option>
        </select>
      </label>
      <SearchField label="Rechercher par titre" value={search} onChange={setSearch} />
      {renderContent()}
    </section>
  );
};

export default OffersPage;
