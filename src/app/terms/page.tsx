import type { Metadata } from "next";
import {
  LegalAddress,
  LegalLink,
  LegalList,
  LegalP,
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Cycle Found on community.cyclefound.com — Ask · Share · Ride.",
  alternates: { canonical: "https://community.cyclefound.com/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" effectiveDate="November 5, 2026">
      <p className="m-0 rounded-[10px] border border-line bg-ground px-3.5 py-3 text-[14px] font-semibold leading-[1.5] text-ink">
        PLEASE READ SECTION 20. IT REQUIRES MOST DISPUTES TO BE RESOLVED BY INDIVIDUAL
        ARBITRATION AND WAIVES CLASS ACTIONS AND JURY TRIALS. YOU MAY OPT OUT WITHIN 30
        DAYS.
      </p>

      <LegalSection title="1. Introduction and agreement to terms">
        <LegalP>
          Welcome to Cycle Found. These Terms of Service (“Terms”) are a binding agreement
          between you and Fault Board Co., LLC. Cycle Found is a service operated by Fault
          Board Co., LLC (“Cycle Found,” “we,” “us,” or “our”). Cycle Found is a DBA / trade
          name of Fault Board Co., LLC, a California limited liability company. These Terms
          cover Cycle Found on community.cyclefound.com and related services we operate
          under the Cycle Found name (collectively, the “Service”). Tagline: Ask · Share ·
          Ride.
        </LegalP>
        <LegalP>
          Cycle Found helps people ask and answer bicycle questions, document garages
          (bikes, parts, tools, accessories, and related gear), build reputation through
          helpful contributions, and — when market features are available — browse, list,
          and connect about used bikes and gear. The Service is currently in beta /
          Pre-Alpha and focused on Northern California, while available to users in the
          United States.
        </LegalP>
        <LegalP>
          By creating an account, accessing the Service, or using any Cycle Found feature,
          you agree to these Terms and our{" "}
          <LegalLink href={LEGAL.privacy}>Privacy Policy</LegalLink>. If you do not agree,
          do not use the Service. Terms version identifier: 2026-11-05.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Pre-Alpha / beta service">
        <LegalP>
          Cycle Found is offered as a Pre-Alpha / early-access service. Features may change,
          be limited, or be discontinued without notice. The Service may contain errors,
          incomplete functionality, or demo / sample content used for product testing.
          During Pre-Alpha or beta, we do not make uptime, availability, or performance
          commitments. Your use of the Service during these stages is at your own risk,
          subject to these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. How the Service works (Ask · Share · Ride)">
        <LegalP>
          Members may ask and answer questions, document garage items, and share what they
          know. Content is member-generated. Cycle Found does not guarantee that any
          question, answer, garage entry, listing, or reputation signal is complete,
          accurate, or safe to follow.
        </LegalP>
        <LegalP>
          Repair, fit, torque, structural, braking, and similar advice is not professional
          mechanical service. For safety-critical work, verify with a qualified mechanic.
          Market values shown on the Service (when enabled) are estimates only — they are
          not appraisals or offers to buy or sell.
        </LegalP>
        <LegalP>
          When buying or selling features are available, Cycle Found is a platform that
          helps members connect. Cycle Found is not a party to sales negotiated or completed
          between users. Unless we clearly state otherwise for a specific feature:
        </LegalP>
        <LegalList>
          <li>Cycle Found does not sell the items listed by users</li>
          <li>
            Cycle Found does not currently process purchases, hold buyer funds, or provide
            escrow
          </li>
          <li>
            Cycle Found does not inspect, certify, authenticate, or guarantee items,
            sellers, or buyers
          </li>
          <li>
            Payment, pickup, shipping, title/ownership transfer, and related logistics are
            arranged directly between buyer and seller
          </li>
          <li>Basic listings, when offered, are free unless we disclose otherwise</li>
        </LegalList>
        <LegalP>
          How you use the Service is also subject to our{" "}
          <LegalLink href={LEGAL.communityGuidelines}>Community Guidelines</LegalLink>.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Eligibility and account registration">
        <LegalP>
          You must be at least 18 years old and able to form a binding contract under
          applicable law to create an account or use Cycle Found. The Service is intended
          for users in the United States, with a current focus on Northern California.
        </LegalP>
        <LegalP>When you register, you agree to:</LegalP>
        <LegalList>
          <li>Provide accurate registration information and keep it current</li>
          <li>
            Use a password that meets our minimum security requirements when one is set
          </li>
          <li>
            Verify your email address before posting, listing, or messaging when the Service
            requires it
          </li>
          <li>
            Accept these Terms and acknowledge our Privacy Policy as part of account
            creation
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Account security and user responsibilities">
        <LegalList>
          <li>You are responsible for activity that occurs under your account.</li>
          <li>Keep your login credentials confidential and do not share them.</li>
          <li>
            Notify us promptly at{" "}
            <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
              {LEGAL.supportEmail}
            </LegalLink>{" "}
            if you suspect unauthorized access.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms, create safety or
            fraud risk, or otherwise harm the Service or other users.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Seller and lister responsibilities">
        <LegalP>
          If you list a bike, part, tool, accessory, or related item for sale, trade, or
          public discovery, you represent and warrant that:
        </LegalP>
        <LegalList>
          <li>You own the item or are otherwise authorized to sell or offer it</li>
          <li>The item is not stolen and you have the legal right to transfer it</li>
          <li>
            You will provide accurate identifying information and respond honestly to
            reasonable buyer questions
          </li>
          <li>
            You will comply with applicable laws, including consumer and local sales rules
            that apply to your transaction
          </li>
        </LegalList>
        <LegalP>
          Cycle Found does not independently verify ownership or title. Sellers remain
          solely responsible for establishing their right to sell.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Listing and garage accuracy">
        <LegalP>When you publish a listing or garage item that others can see, you must:</LegalP>
        <LegalList>
          <li>
            Provide accurate titles, descriptions, photos, condition notes, pricing (if
            any), and location information
          </li>
          <li>
            Disclose known damage, mechanical issues, safety concerns, major repairs,
            modifications, and missing parts that a reasonable buyer would want to know
          </li>
          <li>
            Review and confirm any AI-suggested identification or copy before publishing —
            you are responsible for the final content
          </li>
          <li>Use photos that fairly represent the actual item</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="8. Buyer responsibilities">
        <LegalP>Buyers are responsible for:</LegalP>
        <LegalList>
          <li>Evaluating listings carefully and asking questions before buying</li>
          <li>
            Inspecting the item in person when reasonably possible (for bikes: frame,
            components, brakes, wheels, and fit)
          </li>
          <li>
            Verifying serial numbers, ownership, and other identifying information before
            completing a purchase
          </li>
          <li>Deciding whether an item is safe and suitable for their intended use</li>
          <li>
            Completing payment and meetup or shipping arrangements directly with the seller
          </li>
        </LegalList>
        <LegalP>
          AI recommendations and listing content are informational aids only when offered.
          They do not replace independent inspection or professional assessment.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Communications">
        <LegalP>
          Members may contact each other through tools Cycle Found provides (for example,
          email links, forms, or in-app messaging when those features are enabled). When
          in-app conversations are offered, we may store message text so participants can
          read and reply, and we may send a notification email that a message is waiting —
          without exposing the sender’s email as a reply-to.
        </LegalP>
        <LegalP>You agree not to use contact tools to:</LegalP>
        <LegalList>
          <li>Harass, threaten, spam, or defraud others</li>
          <li>Share unlawful content</li>
          <li>Bypass rate limits, safety controls, or account restrictions</li>
          <li>Solicit off-platform activity for fraudulent purposes</li>
        </LegalList>
        <LegalP>
          We may rate-limit, block, or disable messaging features to protect users and the
          Service. Cycle Found does not process payment.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Prohibited activities">
        <LegalP>You agree not to:</LegalP>
        <LegalList>
          <li>List stolen, counterfeit, or illegally obtained items</li>
          <li>Post false, misleading, or deceptive listings, answers, or prices</li>
          <li>Impersonate another person or misrepresent affiliation</li>
          <li>Engage in scams, phishing, payment fraud, or bait-and-switch tactics</li>
          <li>Harass, threaten, or discriminate against other users</li>
          <li>Game reputation signals (Useful votes, accepted answers, or reviews)</li>
          <li>Scrape, overload, reverse engineer, or interfere with the Service</li>
          <li>Upload malware or attempt unauthorized access to systems or data</li>
          <li>Use the Service for any unlawful purpose</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="11. User-generated content and photo licensing">
        <LegalP>
          You retain ownership of content you submit, including listing and garage photos,
          descriptions, profile details, questions and answers, and messages you send
          through the Service (“User Content”).
        </LegalP>
        <LegalP>
          By submitting User Content, you grant Cycle Found a worldwide, non-exclusive,
          royalty-free license to host, store, reproduce, display, distribute, and otherwise
          use that content as reasonably needed to operate, maintain, promote, and improve
          the Service. This license ends when your content is removed from the Service,
          except for reasonable residual copies kept for backups, legal compliance,
          security, or dispute resolution.
        </LegalP>
        <LegalP>
          You represent that you have all rights needed to submit the User Content and that
          it does not infringe others’ rights or violate law.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. AI-generated content (when offered)">
        <LegalP>
          Where Cycle Found offers AI-assisted features (for example, recommendations,
          photo-based identification suggestions, or listing copy assistance), those
          features may use third-party AI providers to process prompts, photos, and details
          you submit.
        </LegalP>
        <LegalP>
          AI output may be incomplete, outdated, or incorrect. Verify specifications,
          sizing, condition, pricing, torque, and compatibility before making decisions.
          You are responsible for reviewing AI-assisted copy before publishing. Cycle Found
          does not guarantee AI accuracy.
        </LegalP>
      </LegalSection>

      <LegalSection title="13. Optional future paid features">
        <LegalP>
          Basic use of the Service is free unless we disclose otherwise. Cycle Found may
          introduce optional paid features in the future. We will describe any paid feature,
          price, and applicable terms before you are charged. These Terms do not mean that
          subscriptions or paid plans are currently offered.
        </LegalP>
      </LegalSection>

      <LegalSection title="14. Payment, cancellation, and refund terms for paid services">
        <LegalP>
          If and when paid Cycle Found services are activated, the following principles will
          apply unless a specific offer states otherwise:
        </LegalP>
        <LegalList>
          <li>Fees for optional paid features will be disclosed before purchase</li>
          <li>
            Charges for activated paid services are generally non-refundable except where
            required by law or expressly stated at purchase
          </li>
          <li>
            If automatic renewal or subscription billing is ever offered, we will present
            clear consent and cancellation terms at the time of enrollment
          </li>
          <li>
            Purchase payments between buyers and sellers are not processed by Cycle Found
            under the current Service
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="15. Reporting, content removal, and account suspension">
        <LegalP>
          Email{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>{" "}
          about suspicious listings, abusive messages, unsafe advice, or other concerns
          (include a page link when you can). When in-product report tools are available,
          you may use those as well. We may investigate and take action we consider
          appropriate, including removing content, limiting features, or suspending or
          terminating accounts.
        </LegalP>
        <LegalP>
          We are not obligated to monitor all content or communications, and we do not
          guarantee that every report will result in a specific outcome.
        </LegalP>
      </LegalSection>

      <LegalSection title="16. Intellectual property">
        <LegalP>
          The Service — including Cycle Found branding, logos, site design, and software —
          is owned by Cycle Found or its licensors and is protected by intellectual property
          laws. You may not copy, modify, or distribute our branding or software except as
          expressly allowed by these Terms or with prior written permission.
        </LegalP>
        <LegalP>
          You are responsible for the photos and other content you upload. Do not post
          content you do not have the right to use.
        </LegalP>
      </LegalSection>

      <LegalSection title="17. Copyright complaints (DMCA)">
        <LegalP>
          If you believe content on the Service infringes your copyright, you may submit a
          notice under the Digital Millennium Copyright Act, 17 U.S.C. § 512(c)(3). The same
          process is described on our{" "}
          <LegalLink href={LEGAL.copyright}>Copyright / DMCA</LegalLink> page.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Designated agent.</strong> Fault Board
          Co., LLC · Attn: Copyright Agent · 171 Branham Ln, Ste 10 POB 1074, San Jose, CA
          95136, United States · Email:{" "}
          <LegalLink href={`mailto:${LEGAL.copyrightEmail}`}>
            {LEGAL.copyrightEmail}
          </LegalLink>{" "}
          · DMCA registration no. DMCA-1084361
        </LegalP>
        <LegalP>
          It is our policy to terminate, in appropriate circumstances, accounts of users who
          are repeat infringers.
        </LegalP>
      </LegalSection>

      <LegalSection title="18. Third-party services">
        <LegalP>
          The Service relies on third-party providers, which currently may include
          authentication/database/storage hosting, optional AI processing, transactional
          email, fonts, analytics (when you allow it), and other infrastructure. Your use of
          those services through Cycle Found may be subject to the providers’ terms and
          privacy practices. Cycle Found is not responsible for third-party outages, errors,
          or independent practices beyond our reasonable control.
        </LegalP>
      </LegalSection>

      <LegalSection title="19. Disclaimers and limitations of liability">
        <LegalP>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” INCLUDING DURING PRE-ALPHA /
          EARLY ACCESS. TO THE FULLEST EXTENT PERMITTED BY LAW, CYCLE FOUND DISCLAIMS ALL
          WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </LegalP>
        <LegalP>
          Without limiting the foregoing, Cycle Found does not warrant that listings or
          answers are accurate, that users are trustworthy, that items are safe or as
          described, that AI outputs are correct (when offered), or that the Service will be
          uninterrupted or error-free.
        </LegalP>
        <LegalP>
          To the fullest extent permitted by law, Cycle Found will not be liable for
          indirect, incidental, special, consequential, exemplary, or punitive damages; lost
          profits; lost data; personal injury; or property damage arising from your use of
          the Service or from transactions between users. To the fullest extent permitted by
          law, this limitation applies to Fault Board Co., LLC, its members, managers,
          officers, employees, and agents. Our aggregate liability for any claim relating to
          the Service will not exceed the greater of (a) the amount you paid Cycle Found for
          the Service in the 12 months before the claim or (b) USD $100.
        </LegalP>
        <LegalP>
          Some jurisdictions do not allow certain limitations. In those cases, the
          limitations apply to the maximum extent permitted by law. Nothing in these Terms
          is intended to exclude liability that cannot be limited under applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection title="20. Dispute resolution, binding individual arbitration, and class-action waiver">
        <LegalP>
          Please read this section carefully. It affects your legal rights, including your
          right to file a lawsuit in court and to have a jury trial. This Section 20 does
          not apply to disputes that arose or were filed before October 27, 2026.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Informal resolution.</strong> Before
          filing a claim in arbitration or court, you agree to contact us at{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>{" "}
          and attempt in good faith to resolve the dispute informally for 60 days after we
          receive your written notice describing the dispute and the relief sought.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Binding individual arbitration.</strong>{" "}
          Except for the carve-outs below, any dispute, claim, or controversy arising out of
          or relating to these Terms or the Service will be resolved by binding individual
          arbitration administered by the American Arbitration Association (“AAA”) under its
          Consumer Arbitration Rules (or Mass Arbitration Supplementary Rules, if
          applicable). The Federal Arbitration Act governs the interpretation and
          enforcement of this arbitration agreement.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Small-claims carve-out.</strong> Either
          party may bring an individual claim in small claims court if the claim qualifies.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Intellectual property carve-out.</strong>{" "}
          Either party may seek injunctive or other equitable relief in court to protect
          intellectual property rights (including copyright, trademark, and trade secrets).
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">
            Class-action and jury-trial waiver.
          </strong>{" "}
          You and Cycle Found agree that each may bring claims against the other only in an
          individual capacity, and not as a plaintiff or class member in any purported
          class, collective, consolidated, or representative proceeding. You and Cycle Found
          also waive any right to a jury trial to the fullest extent permitted by law.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">
            California public injunctive relief.
          </strong>{" "}
          If you seek public injunctive relief under California law (see McGill v. Citibank),
          that request for public injunctive relief is severed and may be brought in court.
          Any such court action will be stayed until the individual arbitration of remaining
          claims (if any) is completed, to the extent permitted by law.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Mass arbitration.</strong> If 25 or more
          similar demands for arbitration are filed against Cycle Found by or with the
          assistance of the same law firm, group of affiliated firms, or coordinated
          counsel, AAA’s mass-arbitration / batching procedures (including any bellwether or
          staged process) will apply to the extent permitted by the applicable rules.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Fees.</strong> We will pay the AAA
          consumer filing fee and arbitrator fees as required by the AAA Consumer
          Arbitration Rules for claims covered by those rules, unless the arbitrator
          determines your claim was filed for purposes of harassment or is frivolous.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">30-day opt-out.</strong> You may opt out
          of this arbitration agreement by emailing{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>{" "}
          within 30 days of first accepting these Terms. Your email must include your full
          name and the email address associated with your Cycle Found account, and state
          that you are opting out of arbitration. Opting out does not affect any other
          provisions of these Terms.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Severability.</strong> If the
          class-action waiver is found unenforceable as to a particular claim, that class
          claim (and only that claim) will proceed in court, not in arbitration. If any
          other part of this Section 20 is found unenforceable, the remainder will still
          apply.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">
            Governing law and venue for non-arbitrable claims.
          </strong>{" "}
          These Terms are governed by the laws of the State of California, without regard to
          conflict-of-law rules, except where the Federal Arbitration Act controls. For any
          claim not subject to arbitration, you and Cycle Found agree to the exclusive
          jurisdiction of the state and federal courts located in California, except where
          prohibited by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="21. Indemnification">
        <LegalP>
          To the extent permitted by law, you agree to indemnify and hold harmless Fault
          Board Co., LLC, its members, managers, officers, employees, and agents from and
          against claims, damages, losses, and expenses (including reasonable attorneys’
          fees) arising out of your User Content, listings, communications, transactions
          with other users, or violation of these Terms or applicable law.
        </LegalP>
      </LegalSection>

      <LegalSection title="22. Changes to the Terms">
        <LegalP>
          We may update these Terms from time to time. If we make material changes, we will
          post the updated Terms on this page and update the effective date. Continued use
          of the Service after changes become effective means you accept the updated Terms,
          except where additional consent is required by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Changes (changelog)">
        <LegalP>
          As of October 27, 2026 (terms version 2026-10-27), we: named Fault Board Co., LLC
          as the operating entity; disclosed analytics and cookie choices; added a DMCA
          process; described beta focus; and added binding individual arbitration with a
          30-day opt-out (draft — requires attorney review).
        </LegalP>
        <LegalP>
          As of November 5, 2026 (terms version 2026-11-05), we aligned these Terms with
          Cycle Found on community.cyclefound.com as a single Pre-Alpha site (Ask · Share ·
          Ride): Q&A, garages (bikes, parts, tools, accessories), and buying/selling when
          enabled — without treating Community and marketplace as separate products.
        </LegalP>
      </LegalSection>

      <LegalSection title="23. Contact information">
        <LegalP>
          Questions about these Terms can be sent to{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
          .
        </LegalP>
        <LegalAddress />
      </LegalSection>
    </LegalPage>
  );
}
