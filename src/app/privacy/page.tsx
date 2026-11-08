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
  title: "Privacy Policy",
  description:
    "How Cycle Found collects, uses, and shares information on www.cyclefound.com.",
  alternates: { canonical: "https://www.cyclefound.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" effectiveDate="November 5, 2026">
      <p className="m-0 rounded-[10px] border border-accent-soft-border bg-accent-soft px-3.5 py-3 text-[14px] leading-[1.5] text-ink">
        <strong className="font-semibold">Pre-Alpha.</strong> This Policy describes Cycle
        Found on www.cyclefound.com. Some features described below may be limited,
        demo-only, or not yet enabled.
      </p>
      <LegalP>
        This Privacy Policy explains how Cycle Found collects, uses, and shares
        information. Cycle Found is a service operated by Fault Board Co., LLC (“Cycle
        Found,” “we,” “us,” or “our”). Cycle Found is a DBA / trade name of Fault Board Co.,
        LLC, a California limited liability company. The Policy covers Cycle Found on
        www.cyclefound.com and related services we operate under the Cycle Found name
        (the “Service”).
      </LegalP>
      <LegalP>
        Cycle Found helps people ask and answer questions, document garages (bikes, parts,
        tools, accessories, and related gear), and — when market features are available —
        browse and connect about used bikes and gear. Tagline: Ask · Share · Ride. The
        Service is currently in Pre-Alpha / beta and focused on Northern California, while
        available to users in the United States. Garage features let signed-in users save
        items they own (or are tracking), optionally with photos and notes. Items you keep
        private stay with your account; items you mark for sale, trade, or public discovery
        may be visible to other members.
      </LegalP>

      <LegalSection title="1. Information users provide">
        <LegalP>Depending on how you use Cycle Found, you may provide:</LegalP>
        <LegalList>
          <li>Name and public member display name</li>
          <li>Email address and, if you set one, a password</li>
          <li>Profile details such as city, bio, skills, or location</li>
          <li>
            Listing or garage details for bikes, parts, tools, or accessories — including
            condition notes, pricing, and location
          </li>
          <li>Photographs of bikes, parts, tools, or accessories</li>
          <li>Questions, answers, comments, tags, and related photos you post</li>
          <li>
            Messages you send through contact tools we provide (when those features are
            enabled)
          </li>
          <li>Reports you submit about content or accounts</li>
          <li>
            Questions or prompts you send to AI features, when AI features are offered
          </li>
          <li>Support emails you send to us</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Account and authentication information">
        <LegalP>
          Account creation and sign-in are handled through our authentication provider
          (currently Supabase). We store account identifiers and related profile records
          linked to your account.
        </LegalP>
        <LegalP>When you create an account, we may also store:</LegalP>
        <LegalList>
          <li>Full name and an initial display name derived from your name</li>
          <li>
            Confirmation that you are 18 or older and accepted our Terms, with the date and
            time, and the Terms version in effect (currently 2026-11-05)
          </li>
        </LegalList>
        <LegalP>
          Sessions are maintained in your browser so you can stay signed in. Email
          verification may be required before posting, listing, messaging, or reporting when
          the Service requires it.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Garage items, listings, and photographs">
        <LegalP>
          When you create a garage item or listing, we collect the information you enter or
          confirm, which may include title, description, category, year, condition, asking
          price, location, notes, and related fields.
        </LegalP>
        <LegalP>
          During Pre-Alpha, some garage and Community content may be stored only in your
          browser (local storage) for demo purposes until server-backed storage is fully
          enabled. When server storage is used, photos and item records are kept in cloud
          infrastructure with access controls. Public items and posts are visible to
          visitors; private items stay with your account.
        </LegalP>
        <LegalP>
          If AI identification suggestions are offered for a draft, we may store those
          suggestions for your review. They are not written into item details until you
          choose to apply them.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Messaging and communication data">
        <LegalP>
          When Cycle Found offers in-app messaging or offer tools, we may store message text
          and related records so participants can read and reply, and we may send a
          notification email that a message is waiting (without using the sender’s email as
          a reply-to). Participants typically see each other’s display name, not account
          email.
        </LegalP>
        <LegalP>
          On Community today, member contact may also use simpler tools (for example,
          mailto links). Cycle Found does not process payment. We do not claim that messages
          are end-to-end encrypted.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Location information">
        <LegalP>We may collect location-related information in these ways:</LegalP>
        <LegalList>
          <li>
            Location you enter for a profile, garage item, or listing (which may be shown
            publicly when you publish it)
          </li>
          <li>
            Optional “Near Me” or similar search — only if we enable that feature and you
            choose to share approximate coordinates. A third-party reverse-geocoding service
            may be used to estimate city/state/ZIP. You can decline location permission.
          </li>
        </LegalList>
        <LegalP>
          We do not use precise continuous GPS tracking as part of the current Service.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Automatically collected technical information">
        <LegalP>
          Like most websites, our hosting and infrastructure providers may automatically
          receive technical data when you use the Service, such as IP address, browser type,
          device information, request timestamps, and pages or API endpoints accessed. We
          use this information for security, debugging, rate limiting, and operating the
          Service.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Cookies, analytics, and tracking technologies">
        <LegalP>
          Cycle Found uses browser storage for authentication sessions, your analytics
          preference, Pre-Alpha invite-gate unlock state (when the soft gate is enabled),
          and optional local demo Community data (for example, mock or locally created
          questions, answers, or garage items). That local data stays on your device unless
          you clear site data for www.cyclefound.com.
        </LegalP>
        <LegalP>
          When you allow analytics and a measurement ID is configured, we may use Google
          Analytics 4 to understand site usage. Google Analytics uses cookies and similar
          technologies and may collect device and browser information, approximate location
          derived from IP address, pages viewed, referral source, and interactions with the
          Service.
        </LegalP>
        <LegalP>
          We configure Google Analytics so that Google Signals and ad personalization
          signals are disabled. We do not currently run a Reddit advertising pixel, Meta
          (Facebook) Pixel, or similar third-party advertising pixel on Cycle Found.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Your choices.</strong> On first visit
          we may show a non-blocking cookie / analytics notice. You can choose OK (allow
          analytics) or Turn off analytics. We store that choice in your browser’s local
          storage. You can reopen the notice anytime via Cookie settings in the site footer.
          If you turn analytics off, we do not load Google Analytics for that browser.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">
            Do Not Track and Global Privacy Control.
          </strong>{" "}
          There is no consistent industry standard for Do Not Track, and Cycle Found does
          not currently alter its practices solely based on DNT. We do honor Global Privacy
          Control (GPC): if your browser sends GPC, we disable analytics for that browser.
        </LegalP>
        <LegalP>
          Third parties your browser may contact can include Google Analytics / Google (if
          analytics is allowed), Google Fonts, our authentication and hosting providers
          (currently Supabase and our web host), and — only if you use those features —
          optional AI, email, or geocoding providers described in this Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. AI processing (when offered)">
        <LegalP>
          Where Cycle Found offers AI features, they may rely on third-party models (for
          example, OpenAI) operated through our server-side integrations. Depending on the
          feature, we may send natural-language prompts, selected photos, or listing/garage
          context you submit.
        </LegalP>
        <LegalP>
          AI features are informational only and may be inaccurate. Do not submit sensitive
          personal information in AI prompts unless it is necessary for the feature you are
          using. Pre-Alpha Community may not offer all AI features described historically
          for Cycle Found.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. How information is used">
        <LegalP>We use information to:</LegalP>
        <LegalList>
          <li>Create and manage accounts and profiles</li>
          <li>Host questions, answers, garages, listings, and photos</li>
          <li>Enable search, browsing, and member contact tools when available</li>
          <li>Provide AI assistance when those features are offered</li>
          <li>Send transactional emails (verification, password reset, and similar notices)</li>
          <li>
            Contact you about your account and the Service — security or abuse notices,
            material changes to the Terms or this Privacy Policy, important Service updates,
            and replies to requests you send us
          </li>
          <li>Enforce Terms, prevent fraud and abuse, and improve safety</li>
          <li>Operate, secure, debug, and improve the Service</li>
          <li>Measure traffic with Google Analytics when you allow it</li>
          <li>Respond to support requests and legal obligations</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="10. How information is shared">
        <LegalP>We share information in these limited ways:</LegalP>
        <LegalList>
          <li>
            Public content: questions, answers, profiles, and garage/listing details you
            publish are visible to visitors
          </li>
          <li>
            Member contact: when messaging features are enabled, conversation records are
            visible to the participants; notification emails do not include the sender’s
            email as a reply-to
          </li>
          <li>
            Service providers: processors such as Supabase (authentication, database,
            storage), Google Analytics / Google (if allowed), optional OpenAI (AI), optional
            email delivery, optional geocoding, and font/hosting providers
          </li>
          <li>
            Legal and safety: we may disclose information if we believe it is required by
            law or necessary to protect rights, safety, or the integrity of the Service
          </li>
          <li>
            Business transfers: if we undergo a reorganization or similar transaction,
            information may be transferred as part of that process
          </li>
        </LegalList>
        <LegalP>
          We do not sell personal information, and we do not share personal information for
          cross-context behavioral advertising.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Data storage and security">
        <LegalP>
          We use managed cloud infrastructure with access controls intended to limit who can
          see or change information. Public Community content is visible to visitors.
          During Pre-Alpha, some demo content may exist only in your browser’s local
          storage until server-backed Community data is fully enabled.
        </LegalP>
        <LegalP>
          No method of transmission or storage is completely secure. We cannot guarantee
          absolute security, and you use the Service understanding that residual risk
          remains.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Message access and moderation">
        <LegalP>
          When in-app conversations are stored, authorized Cycle Found personnel may process
          message content as needed to deliver notifications, operate the feature, apply
          access controls, investigate abuse, provide support, or comply with law. We do not
          claim that administrators routinely monitor all conversations or that messages
          are end-to-end encrypted.
        </LegalP>
      </LegalSection>

      <LegalSection title="13. Data retention">
        <LegalP>
          We retain information for as long as needed to operate the Service, maintain
          accounts and content, meet legal obligations, resolve disputes, and enforce our
          agreements. Exact retention periods are not yet formalized in an automated
          retention schedule.
        </LegalP>
        <LegalP>
          Local browser demo data remains until you clear site data. Email and AI processors
          may retain data according to their own practices when those features are used.
        </LegalP>
      </LegalSection>

      <LegalSection title="14. Account deletion and privacy requests">
        <LegalP>
          To request access, correction, or permanent deletion of your account and related
          data we control, email{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
          . When an in-product delete-account control is available on Community, you may use
          that as well. Deletion removes profile and account data we control, server-stored
          Community content tied to your account (such as questions and answers), and
          garage/listing records we host — subject to legal retention needs. Local browser
          demo data on www.cyclefound.com is cleared when you clear site data for this
          host.
        </LegalP>
        <LegalP>
          We may need to verify your request and retain certain information when required
          for legal, security, fraud-prevention, or legitimate business purposes.
        </LegalP>
      </LegalSection>

      <LegalSection title="15. California privacy rights and applicability">
        <LegalP>
          If you are a California resident, you may have rights under the California
          Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act
          (CPRA), depending on whether those laws apply to Cycle Found at a given time.
        </LegalP>
        <LegalP>
          Subject to applicability and verification, those rights may include the right to
          know/access, delete, correct, and opt out of certain sales or sharing of personal
          information, and the right not to be discriminated against for exercising privacy
          rights. To submit a request, contact{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
          . You can also limit Google Analytics collection using the options in Section 7.
        </LegalP>
        <LegalP>
          We do not sell personal information and do not share personal information for
          cross-context behavioral advertising.
        </LegalP>
      </LegalSection>

      <LegalSection title="16. Privacy rights in other applicable jurisdictions">
        <LegalP>
          If other state or international privacy laws apply to you, you may have additional
          rights. Contact us and we will review your request under applicable law. This
          Policy is written primarily for a U.S. audience and a California-based operator.
        </LegalP>
      </LegalSection>

      <LegalSection title="17. Children’s privacy">
        <LegalP>
          Cycle Found is not directed to children under 18, and we do not knowingly collect
          personal information from children. If you believe a child has provided personal
          information, contact us and we will take appropriate steps to delete it.
        </LegalP>
      </LegalSection>

      <LegalSection title="18. Changes to the policy">
        <LegalP>
          We may update this Privacy Policy from time to time. We will post the updated
          Policy on this page and revise the effective date. Material changes may also be
          communicated by email or in-product notice when appropriate.
        </LegalP>
      </LegalSection>

      <LegalSection title="Changes (changelog)">
        <LegalP>
          As of October 27, 2026, we named Fault Board Co., LLC as the operating entity and
          described analytics, cookie choices, GPC, and related practices.
        </LegalP>
        <LegalP>
          As of November 5, 2026, we aligned this Policy with Cycle Found on
          www.cyclefound.com as a single Pre-Alpha site: Q&A, garages (bikes, parts,
          tools, accessories), optional buy/sell, local demo storage, Cookie settings, and
          deletion via email until in-product account deletion is available.
        </LegalP>
      </LegalSection>

      <LegalSection title="19. Contact information">
        <LegalP>
          Privacy questions and requests:{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
        </LegalP>
        <LegalAddress />
      </LegalSection>
    </LegalPage>
  );
}
