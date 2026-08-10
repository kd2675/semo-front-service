import { NotificationsClient } from "./NotificationsClient";

type NotificationsPageProps = {
  searchParams: Promise<{
    from?: string | string[];
  }>;
};

function resolveBackHref(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }
  return candidate.startsWith("/notifications") ? "/" : candidate;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const { from } = await searchParams;
  return <NotificationsClient backHref={resolveBackHref(from)} />;
}
