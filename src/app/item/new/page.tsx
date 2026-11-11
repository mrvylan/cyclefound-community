import { redirect } from "next/navigation";

export const metadata = { title: "Add to garage" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Legacy Add URL — preserve status/type query and send to /garage/new chooser shell.
 */
export default async function ItemNewRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const key of ["status", "type", "photo"] as const) {
    const raw = sp[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) params.set(key, value);
  }
  const q = params.toString();
  redirect(q ? `/garage/new?${q}` : "/garage/new");
}
