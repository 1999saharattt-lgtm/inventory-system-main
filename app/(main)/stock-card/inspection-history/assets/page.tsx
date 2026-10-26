
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    fiscalYear?: string;
  }>;
};

export default async function AssetInspectionHistoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const fiscalYear = params.fiscalYear;

  const destination = fiscalYear
    ? `/assets/inspection-history?fiscalYear=${encodeURIComponent(fiscalYear)}`
    : "/assets/inspection-history";

  redirect(destination);
}
