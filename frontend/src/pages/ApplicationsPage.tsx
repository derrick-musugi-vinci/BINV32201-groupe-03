import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import ApplicationTable from "../components/ApplicationTable.tsx";
import { useApplications } from "../hooks/useApplications.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdraw } = useApplications(token, onUnauthorized);

  return (
    <section>
      <h1>Mes candidatures</h1>
      {error && <ErrorState message={error} />}
      {isLoading && <LoadingState />}
      {!isLoading && !error && applications.length === 0 && (
        <EmptyState message="Aucune candidature à afficher." />
      )}
      {!isLoading && !error && applications.length > 0 && (
        <ApplicationTable applications={applications} onWithdraw={withdraw} />
      )}
    </section>
  );
};

export default ApplicationsPage;
