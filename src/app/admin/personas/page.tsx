import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonaAccounts } from "@/components/admin/PersonaAccounts";
import { PersonaRunner } from "@/components/admin/PersonaRunner";
import { createClient } from "@/lib/supabase/server";
import { isPersonaAdminEmail } from "@/lib/bots/admin";
import { authHref } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

export default async function AdminPersonasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(authHref("login", "/admin/personas"));
  }
  if (!isPersonaAdminEmail(user.email)) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-8 py-10 pb-16">
      <div>
        <p className="m-0 font-mono text-[12px] tracking-[0.12em] uppercase text-muted">
          Admin
        </p>
        <h1 className="section-title m-0 mt-2 text-[clamp(32px,4vw,44px)]">
          Personas
        </h1>
        <p className="m-0 mt-2 text-[16px] leading-[1.55] text-muted-2">
          Sign in as a persona, copy credentials, or run engagement now. Cron still
          runs on its own schedule.
        </p>
      </div>

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="section-title m-0 mb-4 text-[20px]">Accounts</h2>
        <PersonaAccounts />
      </section>

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="section-title m-0 mb-4 text-[20px]">Run engagement</h2>
        <PersonaRunner />
      </section>

      <p className="m-0 text-[14px] text-muted">
        After a message run, open{" "}
        <Link href="/messages" className="font-semibold text-accent">
          Messages
        </Link>{" "}
        while signed in as a persona, or check the Community feed for new asks.
      </p>
    </div>
  );
}
