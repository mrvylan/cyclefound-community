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
  title: "Copyright / DMCA",
  description:
    "How to submit a copyright complaint under the DMCA for Cycle Found Community.",
};

export default function CopyrightPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Copyright / DMCA"
      effectiveDate="October 27, 2026"
    >
      <LegalP>
        Cycle Found is a service operated by Fault Board Co., LLC (“Cycle Found,” “we,”
        “us,” or “our”). Cycle Found respects intellectual property rights and expects
        users to do the same. This page covers the Cycle Found Service, including Community
        (questions, answers, garages, and profiles) and the marketplace. It describes how
        to submit a copyright complaint under the Digital Millennium Copyright Act (DMCA).
        The same process appears in our{" "}
        <LegalLink href={LEGAL.terms}>Terms of Service</LegalLink>.
      </LegalP>

      <LegalSection title="Designated agent">
        <LegalP>
          Fault Board Co., LLC
          <br />
          Attn: Copyright Agent
          <br />
          171 Branham Ln, Ste 10 POB 1074, San Jose, CA 95136, United States
          <br />
          Email:{" "}
          <LegalLink href={`mailto:${LEGAL.copyrightEmail}`}>
            {LEGAL.copyrightEmail}
          </LegalLink>
          <br />
          DMCA registration no. DMCA-1084361
        </LegalP>
      </LegalSection>

      <LegalSection title="Notice requirements (17 U.S.C. § 512(c)(3))">
        <LegalP>
          A valid notification of claimed infringement must include substantially the
          following:
        </LegalP>
        <LegalList>
          <li>
            A physical or electronic signature of a person authorized to act on behalf of
            the owner of an exclusive right that is allegedly infringed
          </li>
          <li>
            Identification of the copyrighted work claimed to have been infringed (or a
            representative list if multiple works)
          </li>
          <li>
            Identification of the material claimed to be infringing and information
            reasonably sufficient to permit us to locate it (for example, a listing or
            Community page URL)
          </li>
          <li>
            Information reasonably sufficient to permit us to contact you, such as an
            address, telephone number, and email address
          </li>
          <li>
            A statement that you have a good-faith belief that use of the material in the
            manner complained of is not authorized by the copyright owner, its agent, or
            the law
          </li>
          <li>
            A statement that the information in the notification is accurate, and under
            penalty of perjury, that you are authorized to act on behalf of the owner of
            an exclusive right that is allegedly infringed
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Counter-notice">
        <LegalP>
          If we remove or disable access to material in response to a DMCA notice, we may
          notify the user who posted it. That user may submit a counter-notification under
          17 U.S.C. § 512(g). A counter-notice should include the user’s physical or
          electronic signature; identification of the material removed and where it
          appeared before removal; a statement under penalty of perjury that the user has
          a good-faith belief the material was removed or disabled as a result of mistake
          or misidentification; the user’s name, address, and telephone number; and a
          statement that the user consents to the jurisdiction of the federal district
          court for the user’s address (or for any judicial district in which Cycle Found
          may be found if outside the U.S.) and will accept service of process from the
          original complainant.
        </LegalP>
      </LegalSection>

      <LegalSection title="Repeat infringers">
        <LegalP>
          It is our policy to terminate, in appropriate circumstances, accounts of users
          who are repeat infringers.
        </LegalP>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          Copyright questions:{" "}
          <LegalLink href={`mailto:${LEGAL.copyrightEmail}`}>
            {LEGAL.copyrightEmail}
          </LegalLink>{" "}
          · General:{" "}
          <LegalLink href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </LegalLink>
        </LegalP>
        <LegalAddress />
      </LegalSection>
    </LegalPage>
  );
}
