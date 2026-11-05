import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "How to use Cycle Found — ask and answer, document garages, and buy or sell fairly and safely.",
  alternates: { canonical: "https://community.cyclefound.com/community-guidelines" },
};

const linkClass =
  "font-semibold text-accent-hover underline-offset-2 hover:underline";

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      eyebrow="Cycle Found"
      title="Community Guidelines"
      effectiveDate="November 5, 2026"
    >
      <p className="m-0 rounded-[10px] border border-accent-soft-border bg-accent-soft px-3.5 py-3 text-[14px] leading-[1.5] text-ink">
        <strong className="font-semibold">Pre-Alpha · Demo.</strong> Cycle Found Community
        is early access. Some screens use mock or sample data for testing. Treat advice as
        member-to-member knowledge-sharing — not a substitute for a qualified mechanic on
        safety-critical work. Tagline: Ask · Share · Ride.
      </p>
      <p className="m-0">
        Cycle Found is a service operated by Fault Board Co., LLC (“Cycle Found,” “we,”
        “us,” or “our”). These guidelines cover how to use Cycle Found on this site —
        questions and answers, garages, profiles, and buying or selling when those features
        are available.
      </p>
      <p className="m-0">
        They work alongside our{" "}
        <Link href={LEGAL.terms} className={linkClass}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={LEGAL.privacy} className={linkClass}>
          Privacy Policy
        </Link>
        .
      </p>

      <LegalSection title="1. Purpose">
        <p className="m-0">
          Cycle Found helps people ask and answer bicycle questions, document bikes and
          parts in garages, build reputation through helpful contributions, and — when
          market features are available — connect about used bikes and parts. Advice here is
          member-to-member. Cycle Found does not guarantee that any answer is complete or
          correct — verify safety-critical work with a qualified mechanic when needed.
          Cycle Found does not currently process bike payments, hold funds, or inspect
          bikes.
        </p>
      </LegalSection>

      <LegalSection title="2. Who can participate">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>You must be 18 or older.</li>
          <li>Create an account with accurate information.</li>
          <li>
            Verify your email before posting, listing, or messaging when the Service
            requires it.
          </li>
          <li>
            Use Cycle Found for real bicycle knowledge-sharing and legitimate buying or
            selling — not scams, spam, or unrelated products.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Questions and answers">
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>
            Ask clear questions. Include what you’ve tried, bike year/make when relevant,
            and what a good answer looks like.
          </li>
          <li>Answer helpfully and honestly. Say when you’re unsure.</li>
          <li>Do not post intentionally false, dangerous, or misleading repair advice.</li>
          <li>
            Safety-critical topics (brakes, forks, carbon damage, steerer/headset issues,
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
            honest. Buying and selling rules in section 5 apply when an item is offered for
            sale or trade.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Buying and selling">
        <p className="m-0">
          When you buy, sell, or trade through Cycle Found, you and the other party complete
          the deal directly. Cycle Found is not a party to the sale and does not currently
          provide escrow.
        </p>
        <p className="m-0 font-semibold text-ink">Listings and ownership</p>
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>
            Only list a bike or part you own or are clearly authorized to sell. If you are
            selling for someone else, say so.
          </li>
          <li>
            Stolen bikes and fraudulently obtained goods are not allowed — ever. Report
            suspicions to{" "}
            <a href={`mailto:${LEGAL.supportEmail}`} className={linkClass}>
              {LEGAL.supportEmail}
            </a>{" "}
            and, when appropriate, local authorities.
          </li>
          <li>
            Use current photos of the actual item. Show the whole bike and close-ups of
            wear, damage, or custom parts.
          </li>
          <li>
            Disclose damage, repairs, crash history you know about, missing parts, and
            major modifications that affect value, fit, or safety.
          </li>
          <li>
            Set a clear asking price. No fake “was/now” pricing or bait prices you will not
            honor. Say if the price is firm or negotiable.
          </li>
          <li>
            If you use AI identification or listing copy, review every detail before you
            publish. You are responsible for the final listing.
          </li>
        </ul>
        <p className="m-0 font-semibold text-ink">Safety and fraud</p>
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>
            Meet in a public, well-lit place when you can. Consider bringing a friend.
            Inspect the bike before paying. Check serial numbers and that the seller appears
            authorized to sell.
          </li>
          <li>
            Be cautious with overpayment, fake payment apps, or pressure tactics. Cycle
            Found does not run background checks and is not present at meetups.
          </li>
          <li>
            For remote / shipping deals, agree clearly on cost, packaging, carrier, payment,
            and what happens if the item arrives damaged. Document condition before and
            after shipping when you can.
          </li>
        </ul>
        <p className="m-0">
          Market values shown on Cycle Found (when enabled) are estimates only — not
          appraisals or offers to buy or sell.
        </p>
      </LegalSection>

      <LegalSection title="6. Ownership, stolen property, and prohibited content">
        <p className="m-0">
          Do not use Cycle Found to fence stolen goods, identify theft targets, or run
          scams. Stolen bikes are not allowed — ever.
        </p>
        <p className="m-0">Also prohibited:</p>
        <ul className="m-0 list-disc space-y-1.5 pl-5">
          <li>Harassment, hate speech, threats, or doxxing</li>
          <li>Spam, scams, phishing, or malware links</li>
          <li>Impersonation of other members or of Cycle Found</li>
          <li>Weapons, illegal goods, or anything prohibited by law</li>
          <li>Intentionally false photos or specs on listings or garage items</li>
          <li>Content that intentionally infringes others’ intellectual property</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Respectful communication">
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

      <LegalSection title="8. Reputation, Useful votes, and accepted answers">
        <p className="m-0">
          Reputation on Cycle Found comes from what you contribute — especially Useful
          votes on questions and answers, answers the asker marks as accepted, and member
          reviews when those are shown. Do not game votes, create fake accounts, or trade
          acceptance for unrelated favors. We may reverse manipulated signals and restrict
          accounts that abuse them.
        </p>
      </LegalSection>

      <LegalSection title="9. AI and automated tools">
        <p className="m-0">
          If you use AI to draft a question, answer, or listing, review every detail before
          you post. You are responsible for the final content. AI-generated information may
          contain inaccuracies — especially on torque, compatibility, specs, and structural
          safety.
        </p>
      </LegalSection>

      <LegalSection title="10. Privacy and personal information">
        <p className="m-0">
          Do not post other people’s private contact details, serial numbers tied to theft
          reports without a legitimate reason, or sensitive personal information in public
          threads. See our{" "}
          <Link href={LEGAL.privacy} className={linkClass}>
            Privacy Policy
          </Link>{" "}
          for how Cycle Found handles account data.
        </p>
      </LegalSection>

      <LegalSection title="11. Reporting problems">
        <p className="m-0">
          If you see content that looks stolen, scammy, abusive, unsafe, or otherwise
          against these guidelines, email{" "}
          <a href={`mailto:${LEGAL.supportEmail}`} className={linkClass}>
            {LEGAL.supportEmail}
          </a>{" "}
          with the page link and a short explanation. Reports help keep Cycle Found
          healthier for everyone.
        </p>
      </LegalSection>

      <LegalSection title="12. Account restrictions and enforcement">
        <p className="m-0">
          Depending on the issue, Cycle Found may remove posts or listings, limit posting or
          messaging, or suspend or terminate accounts. Serious problems — especially stolen
          property, fraud, or harassment — may result in permanent loss of access. We may
          not be able to share every detail of an investigation.
        </p>
      </LegalSection>

      <LegalSection title="13. Contacting Cycle Found support">
        <p className="m-0">
          Questions about Cycle Found, accounts, or these guidelines:{" "}
          <a href={`mailto:${LEGAL.supportEmail}`} className={linkClass}>
            {LEGAL.supportEmail}
          </a>
        </p>
        <p className="m-0 text-[14px] text-muted">
          Fault Board Co., LLC · DBA Cycle Found
          <br />
          171 Branham Ln, Ste 10 POB 1074, San Jose, CA 95136, United States
        </p>
        <p className="m-0 text-[14px] text-muted">
          <Link href="/" className={linkClass}>
            Back to Community
          </Link>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
