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
    "How Cycle Found collects, uses, and shares information on Community and related services.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" effectiveDate="October 27, 2026">
      <LegalP>
        This Privacy Policy explains how Cycle Found collects, uses, and shares
        information. Cycle Found is a service operated by Fault Board Co., LLC (“Cycle
        Found,” “we,” “us,” or “our”). Cycle Found is a DBA / trade name of Fault Board
        Co., LLC, a California limited liability company. The Policy covers the Cycle Found
        website and related services (the “Service”), including Community.
      </LegalP>
      <LegalP>
        Cycle Found includes a marketplace connecting buyers and sellers of used bicycles,
        and Community (Ask · Share · Ride) for questions, answers, and garage documentation.
        The Service is currently in beta / Pre-Alpha and focused on Northern California,
        while available to users in the United States. “My Garage” / garage features let
        signed-in users save bikes and bike parts they own (or are tracking), optionally
        with photos and notes—separate from public marketplace listings when those remain
        private to the account.
      </LegalP>

      <LegalSection title="1. Information users provide">
        <LegalP>Depending on how you use Cycle Found, you may provide:</LegalP>
        <LegalList>
          <li>Name and public seller or member display name</li>
          <li>Email address and password</li>
          <li>Profile details such as city, state, ZIP code, and seller type</li>
          <li>Bicycle listing details, condition notes, pricing, and location</li>
          <li>Photographs of bicycles</li>
          <li>
            Messages you send through our contact tools, including in-app bicycle listing
            conversations and parts offers
          </li>
          <li>
            Community questions, answers, comments, and related photos or tags you post
          </li>
          <li>
            Listing reports you submit (reason, optional details, and related
            listing/account identifiers)
          </li>
          <li>Questions or prompts you send to AI features</li>
          <li>
            Garage items — bikes or parts you save in My Garage (details, photos, notes,
            and related estimates you choose to generate)
          </li>
          <li>Support emails you send to us</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Account and authentication information">
        <LegalP>
          Account creation and sign-in are handled through our authentication provider. We
          store account identifiers and related profile records linked to your account.
        </LegalP>
        <LegalP>When you create an account, we may also store:</LegalP>
        <LegalList>
          <li>Full name and an initial display name derived from your name</li>
          <li>
            We record that you confirmed you are 18 or older and accepted our Terms, with
            the date and time, and the Terms version in effect (currently 2026-10-27)
          </li>
        </LegalList>
        <LegalP>
          Sessions are maintained in your browser so you can stay signed in. Email
          verification is required before publishing listings, messaging sellers, or
          reporting listings.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Bicycle listing information and photographs">
        <LegalP>
          When you create a listing, we collect the information you enter or confirm, which
          may include title, description, manufacturer/model/category, frame size,
          condition, asking price, city/state/ZIP, mechanical and cosmetic notes,
          accessories, and related fields.
        </LegalP>
        <LegalP>
          Listing photos are stored in private cloud storage. Active listing photos may be
          shown to visitors. Draft listings and draft photos are restricted to the listing
          owner.
        </LegalP>
        <LegalP>
          Published (“active”) listings are publicly visible. We may also store AI
          identification suggestions associated with a listing draft for your review. Those
          suggestions are not written into listing details until you choose to apply them,
          and they are never automatically written into our bicycle catalog.
        </LegalP>
        <LegalP>
          If you use My Garage, we store the garage items you add (bike or part details,
          photos, and notes) so you can manage them in your account. Garage bikes stay
          private to your account. If you choose to show a part in Parts search, other
          people can see a basic description, photo, and the system price estimate — not
          your purchase price or other private garage fields.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Messaging and communication data">
        <LegalP>
          Buyer-to-seller contact on Cycle Found uses in-app conversations in Messages.
          Bicycle listings are inquiry-only (no in-app offer). Garage parts shown in Parts
          search can include an offer amount plus a message.
        </LegalP>
        <LegalP>
          When a signed-in buyer sends a message about an active listing, or an offer or
          message about a searchable part:
        </LegalP>
        <LegalList>
          <li>
            We store the message text and related conversation records so both participants
            can read and reply in Messages. For parts, we also store the offer amount and
            offer status
          </li>
          <li>
            We send a notification email to the other participant (currently via Resend)
            with a link to the conversation. That notice does not include the sender’s email
            address as a reply-to
          </li>
          <li>
            Participants see each other’s display name in the thread, not each other’s
            account email
          </li>
        </LegalList>
        <LegalP>
          Cycle Found does not process payment for parts or bikes. We apply limits and
          access controls to reduce abuse. We do not claim that contact or in-app messages
          are end-to-end encrypted.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Approximate location and listing location information">
        <LegalP>We may collect location-related information in these ways:</LegalP>
        <LegalList>
          <li>
            Listing location: city, state/region, and ZIP code you enter for a bicycle
            listing (shown publicly on active listings)
          </li>
          <li>Profile location: optional city, state, and ZIP on your seller profile</li>
          <li>
            “Near Me” search: if you choose that option, your browser may share approximate
            coordinates with the Service. We use a third-party reverse-geocoding service
            (currently BigDataCloud) to estimate city/state/ZIP for search filtering. You
            can decline location permission and pick a city instead.
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
          Cycle Found uses browser storage for authentication sessions, local draft listing
          state, your analytics preference, and — on Community during Pre-Alpha — optional
          local demo state (for example, mock questions, answers, garage items, or a soft
          invite-gate unlock stored in the browser). That local demo data stays on your
          device unless you clear site data. We use Google Analytics 4 to understand site
          usage and measure marketing campaigns when you allow analytics.
        </LegalP>
        <LegalP>
          Google Analytics uses cookies and similar technologies and may collect device and
          browser information, approximate location derived from IP address, pages viewed,
          referral source, and interactions with the Service.
        </LegalP>
        <LegalP>
          Learn more about how Google uses information from sites or apps that use its
          services and Google’s Privacy Policy. You can also install the Google Analytics
          opt-out browser add-on where available.
        </LegalP>
        <LegalP>
          We configure Google Analytics so that Google Signals and ad personalization
          signals are disabled for Cycle Found. We do not currently run a Reddit advertising
          pixel, Meta (Facebook) Pixel, or similar third-party advertising pixel on Cycle
          Found.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">Your choices.</strong> On first visit
          we show a non-blocking cookie / analytics notice. You can choose OK (allow
          analytics) or Turn off analytics. We store that choice in your browser’s local
          storage. You can reopen the notice anytime via Cookie settings in the site footer.
          If you turn analytics off, we do not load Google Analytics for that browser.
        </LegalP>
        <LegalP>
          <strong className="font-semibold text-ink">
            Do Not Track and Global Privacy Control.
          </strong>{" "}
          Some browsers send a “Do Not Track” (DNT) signal. There is no consistent industry
          standard for responding to DNT, and Cycle Found does not currently alter its
          practices solely based on DNT. We do honor Global Privacy Control (GPC) signals:
          if your browser sends GPC, we disable analytics for that browser and do not load
          Google Analytics.
        </LegalP>
        <LegalP>
          Third parties your browser may contact when you use the Service can include Google
          Analytics / Google (if analytics is allowed), Google Fonts, our authentication and
          hosting providers (currently Supabase and our web host), BigDataCloud (only if you
          use optional “Near Me” search), and OpenAI or Resend when you use AI or email
          features described in this Policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. AI processing and third-party AI providers">
        <LegalP>
          Cycle Found uses AI features for bicycle recommendations, optional photo-based
          identification suggestions, and listing copy assistance. These features currently
          rely on OpenAI models operated through our server-side integrations.
        </LegalP>
        <LegalP>Depending on the feature, we may send:</LegalP>
        <LegalList>
          <li>Your natural-language questions to the AI Bike Advisor</li>
          <li>Selected listing photos and context for identification suggestions</li>
          <li>
            Confirmed listing details (and style preferences) for title and description
            suggestions
          </li>
        </LegalList>
        <LegalP>
          AI features are informational only and may be inaccurate. We do not currently use
          AI to generate or monitor buyer–seller messages. Do not submit sensitive personal
          information in AI prompts unless it is necessary for the feature you are using.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. How information is used">
        <LegalP>We use information to:</LegalP>
        <LegalList>
          <li>Create and manage accounts and profiles</li>
          <li>Host, display, and manage bicycle listings and photos</li>
          <li>Enable search, browsing, and seller contact</li>
          <li>Operate Community questions, answers, and garage features</li>
          <li>Provide AI recommendations and listing assistance</li>
          <li>
            Send transactional emails (verification, password reset, and notices that a
            listing or parts message is waiting)
          </li>
          <li>
            Contact you about your account and the Service — for example, security or abuse
            notices, material changes to the Terms or this Privacy Policy, important Service
            updates, and replies to requests you send us. This is a normal use of the email
            address you provide when you sign up
          </li>
          <li>Enforce Terms, prevent fraud and abuse, and improve safety</li>
          <li>Operate, secure, debug, and improve the Service</li>
          <li>
            Measure traffic and usage with Google Analytics so we can understand how the
            Service is used and improve it
          </li>
          <li>Respond to support requests and legal obligations</li>
        </LegalList>
        <LegalP>
          Account and Service notices are not optional marketing mail. If we later send
          promotional emails unrelated to your account or the operation of the Service, we
          will provide any required opt-out and update this Policy as needed.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. How information is shared">
        <LegalP>We share information in these limited ways:</LegalP>
        <LegalList>
          <li>
            Public listings and public Community content: active listing details and photos,
            and public questions/answers/profiles you choose to publish, are visible to
            visitors
          </li>
          <li>
            Buyer–seller contact: conversation records for bicycle listings and garage parts
            are visible to the two participants in Messages. We may email a notice that a
            message or offer is waiting; that notice does not include the sender’s email as
            a reply-to
          </li>
          <li>
            Service providers: we use processors such as Supabase (authentication, database,
            storage), Google Analytics / Google (site analytics), OpenAI (AI features),
            Resend (transactional email), BigDataCloud (optional reverse geocoding), and
            font/hosting providers
          </li>
          <li>
            Analytics: when you visit Cycle Found pages, Google Analytics may receive
            cookies, device/browser information, pages viewed, and related usage data as
            described in Section 7
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
          cross-context behavioral advertising. We use Google Analytics with Google Signals
          and ad personalization signals disabled. We do not currently run a Reddit
          advertising pixel, Meta Pixel, or similar advertising pixel on Cycle Found. If
          that changes, we will update this Policy and provide any required opt-out
          mechanism.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Data storage and security">
        <LegalP>
          We use managed cloud infrastructure with access controls intended to limit who can
          see or change information. In general:
        </LegalP>
        <LegalList>
          <li>Users can access and update their own account profile</li>
          <li>
            Listing owners manage their drafts; the public can view active listings
          </li>
          <li>
            Listing photos are stored privately, with access limited so owners can manage
            their media and visitors can view photos for active listings
          </li>
          <li>
            Public Community questions, answers, and profile information you publish are
            visible to visitors of Community
          </li>
          <li>
            During Pre-Alpha, some Community demo content may exist only in your browser’s
            local storage until server-backed Community data is fully enabled
          </li>
        </LegalList>
        <LegalP>
          No method of transmission or storage is completely secure. We cannot guarantee
          absolute security, and you use the Service understanding that residual risk
          remains.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Message access and moderation">
        <LegalP>
          Bicycle listing and parts conversations are stored in our application database and
          are visible to the two participants in Messages. Authorized Cycle Found personnel
          may process message content as needed to deliver notification emails, operate the
          in-app inbox, apply access controls, investigate abuse or security issues, provide
          support, or comply with law.
        </LegalP>
        <LegalP>
          We do not claim that administrators routinely monitor all conversations. We also
          do not claim end-to-end encryption.
        </LegalP>
      </LegalSection>

      <LegalSection title="13. Data retention">
        <LegalP>
          We retain information for as long as needed to operate the Service, maintain
          listings and accounts, meet legal obligations, resolve disputes, and enforce our
          agreements. Exact retention periods are not yet formalized in an automated
          retention schedule.
        </LegalP>
        <LegalP>
          Local draft listing data may also remain in your browser storage until cleared.
          Email providers and AI processors may retain data according to their own retention
          practices.
        </LegalP>
      </LegalSection>

      <LegalSection title="14. Account deletion and privacy requests">
        <LegalP>
          You can permanently delete your account from Your Account (Delete account).
          Deletion removes your profile, marketplace listings, uploaded listing photos,
          bikes or parts you saved in My Garage, listing or parts conversations tied to
          your account, and Community content we control that is tied to your account
          (such as questions and answers stored on our servers), along with related account
          data we control. Local browser demo data on Community is cleared when you clear
          site data for community.cyclefound.com. To request access, correction, or help
          with deletion, or to ask privacy questions, email{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
          .
        </LegalP>
        <LegalP>
          We may need to verify your request and retain certain information when required
          for legal, security, fraud-prevention, or legitimate business purposes (for
          example, records of a completed support investigation).
        </LegalP>
      </LegalSection>

      <LegalSection title="15. California privacy rights and applicability">
        <LegalP>
          If you are a California resident, you may have rights under the California
          Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act
          (CPRA), depending on whether those laws apply to Cycle Found at a given time (for
          example, based on revenue or data processing thresholds).
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
          As of October 27, 2026, we: named Fault Board Co., LLC as the operating entity;
          updated this Policy to accurately describe Google Analytics 4, cookie choices, Do
          Not Track, and Global Privacy Control; stated that we do not sell personal
          information or share it for cross-context behavioral advertising; clarified garage
          items; stated that we may contact you about your account and the Service; and
          removed unnecessary implementation jargon.
        </LegalP>
        <LegalP>
          As of October 30, 2026, we described in-app parts offers and bicycle listing
          messages (stored conversation records and notification email; listing contact is
          inquiry only).
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
