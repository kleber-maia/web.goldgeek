import Link from "next/link";
import { SettingsService } from "@/lib/services/settings.service";

export default async function PrivacyPolicyPage() {
  const company = await SettingsService.getCompanyInfo();
  return (
    <div
      data-elementor-type="wp-page"
      data-elementor-id="3"
      className="elementor elementor-3"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-cd407e2 e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="cd407e2"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-51f56df elementor-widget elementor-widget-heading"
            data-id="51f56df"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                Privacy Policy
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div
        className="elementor-element elementor-element-617bd5bc e-flex e-con-boxed e-con e-parent"
        data-id="617bd5bc"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-4c3a584f elementor-widget elementor-widget-text-editor"
            data-id="4c3a584f"
            data-element_type="widget"
            data-widget_type="text-editor.default"
          >
            <div className="elementor-widget-container">
              <p>
                We are pleased that you are visiting our website{company.websiteUrl ? <> at {company.websiteUrl.replace(/^https?:\/\//, '')}</> : ''}. Data protection and data security when using
                our website are very important to us. We would therefore like to
                inform you which of your Personal Information we collect when
                you visit our website and for what purposes it is used.
              </p>

              <p>
                <b>Who is responsible?</b>
              </p>
              <p>
                The person responsible in the sense of the New York&apos;s Privacy
                Act (&quot;NYPA&quot;) and the EU&apos;s General Data Protection Regulation
                (&quot;GDPR&quot;) is {company.name}{company.street1 ? <> of {company.street1}{company.street2 ? ` ${company.street2}` : ''} {company.city}, {company.state} {company.zipCode}</> : ''}.
                {company.supportEmail || company.phone ? <> Please direct any questions you may have to{company.supportEmail ? <> {company.supportEmail}</> : ''}{company.supportEmail && company.phone ? ',' : ''}{company.phone ? <> or call us at {company.phone}</> : ''}.</> : ''}
              </p>

              <p>
                <b>Principles of data processing</b>
              </p>

              <ol>
                <li>
                  <i>a) Personal Information</i>
                </li>
              </ol>
              <p>
                Personal Information is any information relating to an
                identified or identifiable natural person. This includes, for
                example, information such as your name, age, address, telephone
                number, date of birth, e-mail address, IP address or user
                behavior.
              </p>

              <ol>
                <li>
                  <i>b) Processing</i>
                </li>
              </ol>
              <p>
                The processing of Personal Information (e.g. collection,
                retrieval, use, storage or transmission) always requires a legal
                basis.
              </p>

              <ol>
                <li>
                  <i>c) Legal basis</i>
                </li>
              </ol>
              <p>
                In accordance with the NYPA and the GDPR, we have to have at
                least one of the following legal bases to process your Personal
                Information: i) you have given your consent, ii) the data is
                necessary for the fulfillment of a contract / pre-contractual
                measures, iii) the data is necessary for the fulfillment of a
                legal obligation, or iv) the data is necessary to protect our
                legitimate interests, provided that your interests are not
                overridden.
              </p>

              <ol>
                <li>
                  <i>d) Retention</i>
                </li>
              </ol>
              <p>
                Processed Personal Information will be deleted as soon as the
                purpose of the processing has been achieved and there are no
                longer any legally required retention obligations.
              </p>

              <p>
                <b>Data we collect</b>
              </p>

              <ol>
                <li>
                  <i>a) Provision and use of the website</i>
                </li>
              </ol>
              <p>
                When you call up and use our website, we collect the Personal
                Information that your browser automatically transmits to our
                server. This is technically necessary for us to display our
                website and to ensure its stability and security. In this sense,
                we collect the following data: i) IP address of the requesting
                computer, ii) Date and time of access, iii) name and URL of the
                file accessed, iv) website from which the access was made
                (referrer URL), v) browser used and, if applicable, the
                operating system of your computer as well as the name of your
                access provider. The legal basis is our legitimate interest.
              </p>

              <ol>
                <li>
                  <i>b) Hosting</i>
                </li>
              </ol>
              <p>
                The hosting services used by us for the purpose of operating our
                website is FlyWheel a service of{" "}
                <Link href="https://wpengine.com/legal/privacy/" target="_blank" rel="noopener noreferrer">
                  WPEngine, Inc
                </Link>
                . In doing so FlyWheel, processes inventory data, contact data,
                content data, usage data, meta data and communication data of
                customers, interested parties and visitors of our website and
                services, on the basis of our legitimate interests.
              </p>

              <ol>
                <li>
                  <i>c) Content Management System</i>
                </li>
              </ol>
              <p>
                We also use the Content Management System (CMS) of WordPress by{" "}
                <Link href="https://automattic.com/privacy/" target="_blank" rel="noopener noreferrer">
                  Automattic Inc
                </Link>{" "}
                to publish and maintain the created and edited content and texts
                on our website. This means that all content and texts submitted
                to us is transferred to WordPress. This represents a legitimate
                interest.
              </p>

              <ol>
                <li>
                  <i>d) Cookies</i>
                </li>
              </ol>
              <p>
                We use so-called cookies on our website. Cookies are pieces of
                information that are transmitted from our web server or
                third-party web servers to your web browser and stored there for
                later retrieval. Cookies may be small files or other types of
                information storage. There are different types of cookies: i)
                Essential Cookies. Essential cookies are cookies to provide a
                correct and user-friendly website; and ii) Non-essential
                Cookies. Non-essential Cookies are any cookies that do not fall
                within the definition of essential cookies, such as cookies used
                to analyze your behavior on a website (&quot;analytical&quot; cookies) or
                cookies used to display advertisements to you (&quot;advertising&quot;
                cookies).
              </p>
              <p>
                In particular, we use analytical cookies from Google Analytics,
                a web analytics service provided by{" "}
                <Link href="https://policies.google.com/privacy?hl=en-US" target="_blank" rel="noopener noreferrer">
                  Google
                </Link>
                . Google Analytics also uses cookies to enable our website to
                analyze how users use our website across multiple devices. The
                information generated by the cookies about your use of our
                website is transmitted to and stored by Google, including
                transmission to the United States. The following data is
                processed through the use of Google Analytics: i) 3 bytes of the
                IP address of the called system of the website visitor
                (anonymised IP address); ii) the website called up; iii) the
                website from which the user reached the accessed page of my
                website (referrer); iv) the subpages accessed from the website;
                v) the time spent on the website; and vi) the frequency with
                which the website is accessed. Google states that it will not
                associate your IP address with any other data held by Google.
                The use of this service is based on your consent. You can
                disable tracking by Google Analytics with future effect by
                downloading and installing the Google Analytics Opt-out Browser
                Add-on for your current web browser following this link{" "}
                <Link href="http://tools.google.com/dlpage/gaoptout?hl=en" target="_blank" rel="noopener noreferrer">
                  http://tools.google.com/dlpage/gaoptout?hl=en
                </Link>
                .
              </p>

              <ol>
                <li>
                  <i>e) Cookie consent</i>
                </li>
              </ol>
              <p>
                Our website uses a cookie consent management tool to obtain your
                consent to the storage of cookies and to document this consent.
                When you enter our website, the following Personal Data is
                transferred to us: i) Your consent(s) or revocation of your
                consent(s); ii) your IP address; iii) Information about your
                browser; iv) Information about your device; v) Time of your
                visit to our website. The basis for processing is our legitimate
                interest.
              </p>

              <ol>
                <li>
                  <i>f) TrustedSite</i>
                </li>
              </ol>
              <p>
                We also use the TrustedSite widget. The Trustbadge and the
                services advertised with it are an offer of{" "}
                <Link href="https://www.trustedsite.com/privacy" target="_blank" rel="noopener noreferrer">
                  TrustedSite LLC
                </Link>
                . When you click on the Trustbadge: i) your IP address; ii) the
                date and time of the call-up; iii) the amount of data
                transferred; and vi) the requesting provider (access data) are
                processed by our web server. The IP address is anonymized
                immediately after collection so that the stored data cannot be
                assigned to you personally. The basis for processing is our
                legitimate interest.
              </p>

              <ol>
                <li>
                  <i>g) Contacting Us</i>
                </li>
              </ol>
              <p>
                We offer you the opportunity to contact us using various
                methods. We collect the data you submit such as your name, email
                address, telephone number and your message in order to process
                your enquiry and respond to you. The legal basis is both your
                consent and contract.
              </p>

              <ol>
                <li>
                  <i>h) Appraisal Requests and Appraisal Kit Order</i>
                </li>
              </ol>
              <p>
                We process your first name, last name, e-mail address, Phone
                Number Address and the data related to your request with us data
                to handle your enquiry. Following your request, we may try to
                make contact with you either by call, email or mail. The legal
                basis is the fulfillment of our pre-contractual obligations and,
                in individual cases, the fulfillment of our legal obligations.
              </p>

              <ol>
                <li>
                  <i>i) When using our services</i>
                </li>
              </ol>
              <p>
                We process the Personal Information involved in your use of our
                services in order to be able to provide our contractual services
                such as to buy your valuables. This may also include support,
                correspondence with you, fulfillment of our contractual,
                accounting and tax obligations. Accordingly, the data is
                processed on the basis of fulfilling our contractual obligations
                and our legal obligations.
              </p>

              <ol>
                <li>
                  <i>
                    j) Administration, financial accounting, office
                    organization, contact management
                  </i>
                </li>
              </ol>
              <p>
                We process data in the context of administrative tasks as well
                as organization of our business, and compliance with legal
                obligations, such as archiving. In this regard, we process the
                same data that we process in the course of providing our
                contractual services. The processing bases are our legal
                obligations and our legitimate interest.
              </p>

              <ol>
                <li>
                  <i>k) Social Media</i>
                </li>
              </ol>
              <p>
                When you visit our social media profiles on{" "}
                <Link href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                  Facebook
                </Link>
                , and{" "}
                <Link href="https://help.instagram.com/155833707900388" target="_blank" rel="noopener noreferrer">
                  Instagram
                </Link>
                , we process your actions and interactions with our profile
                (e.g., the content of your messages, enquiries, posts or
                comments that you send to us or leave on our profile or when you
                like or share our posts) as well as your publicly viewable
                profile data (e.g., your name and profile picture). Which
                Personal Information from your profile is publicly viewable
                depends on your profile settings, which you can adjust yourself
                in the settings of your social media account. The legal basis is
                our legitimate interest and your consent.
              </p>

              <p>
                <b>Data Security</b>
              </p>
              <p>
                We undertake to protect your privacy and to treat your Personal
                Information confidentially. In order to prevent manipulation or
                loss or misuse of your data stored with us, we take extensive
                technical and organizational security precautions which are
                regularly reviewed and adapted to technological progress. These
                include, among other things, the use of recognised encryption
                procedures (SSL or TLS). Nonetheless and due to the nature of
                the internet, databases or data sets that include Personal Data
                may be breached and upon becoming aware of a data breach, we
                will notify all affected individuals whose Personal Data may
                have been compromised as expeditiously as possible after which
                the breach was discovered.
              </p>

              <p>
                <b>International transfers</b>
              </p>
              <p>
                We may transfer your Personal Information to other companies as
                necessary for the purposes described in this Privacy Policy. In
                order to provide adequate protection for your Personal
                Information when it is transferred, we have contractual
                arrangements regarding such transfers. We take all reasonable
                technical and organizational measures to protect the Personal
                Information we transfer.
              </p>

              <p>
                <b>How we may share your Personal Information</b>
              </p>
              <p>
                We may share your Personal Information with our Business
                Partners for the purposes described in this Privacy Policy,
                including (but not limited to) conducting the services you
                request, or customizing our business to better meet your needs.
                We share your Personal Information only with Business Partners
                who agree to protect and use your Personal Information solely
                for the purposes specified by us.
              </p>
              <p>
                We may also disclose your Personal Information for any purpose
                with your consent or for law enforcement, fraud prevention or
                other legal actions as required by law or regulation, or if we
                reasonably believe that we must protect us, our customers or
                other business interests. Except as described above of which you
                will be informed in advance, we will not disclose your Personal
                Information.
              </p>

              <p>
                <b>What we do not do</b>
              </p>
              <ul>
                <li>
                  We do not request Personal Information from minors and
                  children;
                </li>
                <li>
                  We do not use Automated decision-making including profiling;
                  and
                </li>
                <li>We do not sell your Personal Information.</li>
              </ul>

              <p>
                <b>Your Rights and Privileges</b>
              </p>
              <p>
                <i>Your privacy rights</i>
              </p>
              <p>Under the NYPA, you can exercise the following rights:</p>
              <ul>
                <li>
                  <i>Right to Notice</i>
                </li>
                <li>
                  <i>Right to Opt-In Consent</i>
                </li>
                <li>
                  <i>Right to Access, Correct Data</i>
                </li>
                <li>
                  <i>Right to Delete</i>
                </li>
              </ul>

              <p>Under the GDPR, you can exercise the following rights:</p>
              <ul>
                <li>
                  <i>Right to information</i>
                </li>
                <li>
                  <i>Right to rectification</i>
                </li>
                <li>
                  <i>Right to deletion</i>
                </li>
                <li>
                  <i>Right to data portability</i>
                </li>
                <li>
                  <i>Right of objection</i>
                </li>
                <li>
                  <i>Right to withdraw consent</i>
                </li>
                <li>
                  <i>Right to complain to a supervisory authority</i>
                </li>
                <li>
                  <i>
                    Right not to be subject to a decision based solely on
                    automated processing.
                  </i>
                </li>
              </ul>

              <p>
                If you have any questions about the nature of the Personal
                Information we hold about you, or if you wish to exercise any of
                your rights, please contact us.
              </p>

              <p>
                <i>Complaint to a supervisory authority</i>
              </p>
              <p>
                You have the right to complain about our processing of Personal
                Data to a supervisory authority responsible for data protection.
                The supervisory authority is: The Office of the New York State
                Attorney General, The Capitol, Albany NY 12224-0341,{" "}
                <Link href="https://ag.ny.gov/" target="_blank" rel="noopener noreferrer">
                  https://ag.ny.gov/
                </Link>
              </p>

              <p>
                <i>COPPA (Children Online Privacy Protection Act)</i>
              </p>
              <p>
                We do not specifically market to children under the age of 13
                years old.
              </p>

              <p>
                <i>CAN SPAM Act</i>
              </p>
              <p>
                If at any time you would like to unsubscribe from receiving
                future emails, you can email us, and we will promptly remove you
                from ALL correspondence.
              </p>

              <p>
                <i>Telephone Consumer Protection Act (TCPA)</i>
              </p>
              <p>
                If we are sending you SMS marketing communications, you may opt
                out by replying or texting &apos;STOP&apos; if you receive our SMS
                communications.
              </p>

              <p>
                <i>Controls For Do-Not-Track Features</i>
              </p>
              <p>
                At this stage no uniform technology standard for recognizing and
                implementing DNT signals has been finalized. If a standard for
                online tracking is adopted, we will inform you about that
                practice in a revised version of this policy.
              </p>

              <p>
                <i>Updating your information and withdrawing your consent</i>
              </p>
              <p>
                If you believe that the information we hold about you is
                inaccurate or that we are no longer entitled to use it and want
                to request its rectification, deletion, or object to its
                processing or want to withdraw any consents you have given us,
                please contact us.
              </p>

              <p>
                <i>Access Request</i>
              </p>
              <p>
                In the event that you wish to make a Data Subject Access
                Request, simply contact us. We will respond to requests within
                thirty (30) days. If we are unable to provide you with any
                Personal Information or to make a correction requested by you,
                we will tell you why.
              </p>

              <p>
                <b>Validity and questions</b>
              </p>
              <p>
                This Privacy Policy was last updated on Thursday, November 2nd,
                2023, and is the current and valid version. However, from time
                to time changes or a revision to this policy may be necessary.
                {company.supportEmail || company.phone ? <>Please direct any questions you may have to{company.supportEmail ? <> {company.supportEmail}</> : ''}{company.supportEmail && company.phone ? ',' : ''}{company.phone ? <> or call us at {company.phone}</> : ''}.</> : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
