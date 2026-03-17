import { ClubChrome } from "./ClubChrome";

type ClubLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubLayout({ children, params }: ClubLayoutProps) {
  const { clubId } = await params;
  return <ClubChrome clubId={clubId}>{children}</ClubChrome>;
}
