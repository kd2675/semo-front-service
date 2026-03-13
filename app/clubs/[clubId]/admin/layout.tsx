import { AdminChrome } from "./AdminChrome";

type ClubAdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminLayout({ children, params }: ClubAdminLayoutProps) {
  const { clubId } = await params;

  return <AdminChrome clubId={clubId}>{children}</AdminChrome>;
}
