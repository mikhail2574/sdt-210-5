import Link from "next/link";

type ApplicationHeaderProps = {
  application: {
    customerSummary: {
      address: string;
      name: string;
    };
    tenantId: string;
  };
  applicationId: string;
  downloadPdfLabel: string;
  locale: string;
  openCustomerViewLabel: string;
};

export function ApplicationHeader({
  application,
  applicationId,
  downloadPdfLabel,
  locale,
  openCustomerViewLabel
}: ApplicationHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <h2>{application.customerSummary.name}</h2>
        <p>{application.customerSummary.address}</p>
      </div>
      <div className="panel-header-actions">
        <a className="secondary-button" href={`/api/tenants/${application.tenantId}/applications/${applicationId}/pdf?kind=APPLICATION_PDF`}>
          {downloadPdfLabel}
        </a>
        <Link className="inline-link" href={`/${locale}/applications/${applicationId}`}>
          {openCustomerViewLabel}
        </Link>
      </div>
    </div>
  );
}
