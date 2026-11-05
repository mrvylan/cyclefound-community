import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "How to ask, answer, and share in Cycle Found Community — fair, accurate, and respectful.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      eyebrow="Community"
      title="Community Guidelines"
      effectiveDate="November 5, 2026"
    >
      <p className="m-0 rounded-[10px] border border-accent-soft-border bg-accent-soft px-3.5 py-3 text-[14px] leading-[1.5] text-ink">
        <strong className="font-semibold">Pre-Alpha · Demo.</strong> Community is early
        access. Some screens use mock or sample data for testing. Treat advice as
        member-to-member knowledge-sharing — not a substitute for a qualified mechanic on
        safety-critical work. Tagline: Ask · Share · Ride.
      </p>
      <p className="m-0">
        Cycle Found is a service operated by Fault Board Co., LLC (“Cycle Found,” “we,”
        “us,” or “our”). Cycle Found Community is where riders ask repair and parts
        questions, document garages, and share what they know. These guidelines explain
        how to participate in a way that is fair, accurate, and safer for everyone.
      </p>
      <p className="m-0">
        They work alongside our{" "}
        <Link href={LEGAL.terms} className="font-semibold text-accent-hover underline-offset-2 hover:underline">
          Terms of Service
        </Link>
        ,{" "}
        <Link href={LEGAL.privacy} className="font-semibold text-accent-hover underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        , and{" "}
        <a
          href={LEGAL.marketplaceGuidelines}
          className="font-semibold text-accent-hover underline-offset-2 hover:underline"
        >
          Marketplace Guidelines
        </a>
        . Buying and selling bikes is covered by the Marketplace Guidelines; this page
        covers Community features (questions, answers, garages, profiles, and related
        tools).
      </p>

      <LegalSection title="1. Purpose of the community">
        <p className="m-0">
          Community helps people ask and answer bicycle questions, document bikes and
          parts in garages, and build reputation through helpful contributions. Advice
          here is member-to-member. Cycle Found does not guarantee that any answer is
          complete or correct — verify safety-critical work with a qualified mechanic
          when needed.
        </p>
      </LegalSection>

      <LegalSection title="2. Who can participate">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>You must be 18 or older.</li>
          <li>Create an account with accurate information.</li>
          <li>Verify your email before posting when the Service requires it.</li>
          <li>
            Use Community for real bicycle knowledge-sharing — not scams, spam, or
            unrelated content.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Questions and answers">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>Ask clear questions. Include what you’ve tried, bike year/make when relevant, and what a good answer looks like.</li>
          <li>Answer helpfully and honestly. Say when you’re unsure.</li>
          <li>Do not post intentionally false, dangerous, or misleading repair advice.</li>
          <li>
            Safety-critical topics (brakes, forks, carbon damage, steerer/ headset issues,
            torque, structural cracks) deserve extra care — disclose risks and limits of
            your experience.
          </li>
          <li>
            Accept an answer only when it solved your problem. Useful votes should reflect
            genuine helpfulness, not popularity contests.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Garages, items, and photographs">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>Document bikes and parts you own or are clearly authorized to represent.</li>
          <li>Use current photos of the actual item when you can.</li>
          <li>Get brand, model, size, and year as close as you can.</li>
          <li>Do not use photos or text you do not have the right to use.</li>
          <li>
            Status labels (for sale, open to offers, trade only, not for sale) must be
            honest. Marketplace listing rules still apply when you sell through Cycle
            Found — see the{" "}
            <a
              href={LEGAL.marketplaceGuidelines}
              className="font-semibold text-accent-hover underline-offset-2 hover:underline"
            >
              Marketplace Guidelines
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Ownership, stolen property, and prohibited content">
        <p className="m-0">
          Do not use Community to fence stolen goods, identify theft targets, or bypass
          marketplace rules. Stolen bikes are not allowed — ever. If you suspect stolen
          property, email{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="font-semibold text-accent-hover underline-offset-2 hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          and, when appropriate, local authorities.
        </p>
        <p className="m-0">Also prohibited:</p>
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>Harassment, hate speech, threats, or doxxing</li>
          <li>Spam, scams, phishing, or malware links</li>
          <li>Impersonation of other members or of Cycle Found</li>
          <li>Weapons, illegal goods, or anything prohibited by law</li>
          <li>Content that intentionally infringes others’ intellectual property</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Respectful communication">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>Be polite and direct — disagree with ideas, not people.</li>
          <li>Respond within a reasonable time when you can.</li>
          <li>No pile-ons, bullying, or baiting beginners.</li>
          <li>
            Use Cycle Found’s contact tools as intended. Do not harvest emails or personal
            data from profiles for spam.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Reputation, Useful votes, and Spokes">
        <p className="m-0">
          Reputation signals (Useful votes, accepted answers, reviews, and any Spokes or
          level badges we show) exist to highlight helpful members. Do not game votes,
          create fake accounts, or trade acceptance for unrelated favors. We may reverse
          manipulated signals and restrict accounts that abuse them.
        </p>
      </LegalSection>

      <LegalSection title="8. AI and automated tools">
        <p className="m-0">
          If you use AI to draft a question or answer, review every detail before you post.
          You are responsible for the final content. AI-generated information may contain
          inaccuracies — especially on torque, compatibility, and structural safety.
        </p>
      </LegalSection>

      <LegalSection title="9. Privacy and personal information">
        <p className="m-0">
          Do not post other people’s private contact details, serial numbers tied to theft
          reports without a legitimate reason, or sensitive personal information in public
          threads. See our{" "}
          <Link href={LEGAL.privacy} className="font-semibold text-accent-hover underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          for how Cycle Found handles account data.
        </p>
      </LegalSection>

      <LegalSection title="10. Reporting problems">
        <p className="m-0">
          If you see content that looks stolen, scammy, abusive, unsafe, or otherwise
          against these guidelines, email{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="font-semibold text-accent-hover underline-offset-2 hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          with the page link and a short explanation. Reports help keep Community healthier
          for everyone.
        </p>
      </LegalSection>

      <LegalSection title="11. Account restrictions and enforcement">
        <p className="m-0">
          Depending on the issue, Cycle Found may remove posts, limit posting or messaging,
          or suspend or terminate accounts. Serious problems — especially stolen property,
          fraud, or harassment — may result in permanent loss of access across Cycle Found
          services. We may not be able to share every detail of an investigation.
        </p>
      </LegalSection>

      <LegalSection title="12. Contacting Cycle Found support">
        <p className="m-0">
          Questions about Community, accounts, or these guidelines:{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="font-semibold text-accent-hover underline-offset-2 hover:underline"
          >
            {LEGAL.supportEmail}
          </a>
        </p>
        <p className="m-0 text-[14px] text-muted">
          Fault Board Co., LLC · DBA Cycle Found
          <br />
          171 Branham Ln, Ste 10 POB 1074, San Jose, CA 95136, United States
        </p>
        <p className="m-0 text-[14px] text-muted">
          Looking for buying and selling rules? See the{" "}
          <a
            href={LEGAL.marketplaceGuidelines}
            className="font-semibold text-accent-hover underline-offset-2 hover:underline"
          >
            Marketplace Guidelines
          </a>
          .{" "}
          <Link
            href="/"
            className="font-semibold text-accent-hover underline-offset-2 hover:underline"
          >
            Back to Community
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
