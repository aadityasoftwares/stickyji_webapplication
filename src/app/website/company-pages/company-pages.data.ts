export interface CompanySection {
  id: string;
  title: string;
  paragraphs: readonly string[];
}

export interface CompanyPageContent {
  eyebrow: string;
  title: string;
  intro: string;
  legal?: boolean;
  sections: readonly CompanySection[];
}

export const COMPANY = {
  name: 'stickyji',
  location: 'Vadodara, Gujarat, India',
  email: 'aadityasoftware.in@gmail.com',
  policyVersion: '2026-10-26-draft',
  updated: '26 October 2026',
  // Keep draft notices and noindex until the operational details in LEGAL_REVIEW.md are approved.
  policiesApproved: false,
} as const;

export const COMPANY_PAGES: Record<string, CompanyPageContent> = {
  about: {
    eyebrow: 'A little about us',
    title: 'Small notes. Room for big ideas.',
    intro: 'Sticky Ji brings the familiarity of sticky notes to a shared digital workspace. Capture a thought, plan your day, and give the work ahead a little more clarity.',
    sections: [
      { id: 'our-purpose', title: 'A calmer place to get organised', paragraphs: [
        'Ideas do not always arrive in order. Sticky Ji gives them a place to land, with colourful notes, folders, checklists, and a focused Today view. Start with a quick thought and add detail as your plans take shape.',
      ] },
      { id: 'your-way', title: 'A workspace that fits your way of thinking', paragraphs: [
        'See your work as sticky notes, move it through a Kanban board, or scan it in a table. Use colours, font preferences, favourites, and folders to make your workspace easier to navigate.',
      ] },
      { id: 'together', title: 'From personal plans to shared work', paragraphs: [
        'Keep your everyday tasks in one place or invite people into a workspace. Shared notes, assignments, and checklists help a team see what needs attention and what is already done.',
        'Workspace access matters. Review the people you invite and the permissions you grant before adding confidential information.',
      ] },
      { id: 'who-we-are', title: 'Made by stickyji', paragraphs: [
        'Sticky Ji is a product of stickyji, based in Vadodara, Gujarat, India. We are building a practical home for ideas, daily planning, and collaboration.',
        'Have feedback or a question? We would like to hear what would make your everyday workflow simpler. Visit our Contact page to get in touch.',
      ] },
    ],
  },
  contact: {
    eyebrow: 'Let’s talk',
    title: 'A real place for your questions.',
    intro: 'Need help with a note, a workspace, or a payment? Choose a topic below to open an email to stickyji.',
    sections: [
      { id: 'help-us-help', title: 'Help us understand the issue', paragraphs: [
        'Include your account email, the page or feature involved, and a short description of what happened. For a payment query, include the payment or order reference and date. Redact private note content from screenshots.',
        'Never send your password, one-time codes, card number, CVV, or authentication tokens. Email opens in your own mail app; nothing is submitted from this page.',
      ] },
      { id: 'privacy-requests', title: 'Privacy requests and concerns', paragraphs: [
        'Use the privacy contact option for access, correction, deletion, consent withdrawal, or a complaint about personal information. Tell us what you need and the account concerned. We may ask for proportionate verification before disclosing or changing account information.',
        'For a workspace managed by someone else, its owner may also need to help with access or shared content. Contacting us does not prevent you from approaching a competent regulator or using another remedy available under applicable law.',
      ] },
      { id: 'business', title: 'Business details', paragraphs: [
        'Business name: stickyji. Location: Vadodara, Gujarat, India.',
        'Our contact email is aadityasoftware.in@gmail.com. This is our current contact for support, billing, privacy, and legal enquiries. A full postal address and designated grievance contact will be added before these draft policies are finalised.',
      ] },
    ],
  },
  privacy: {
    eyebrow: 'Your information',
    title: 'Privacy policy',
    intro: 'This notice explains how stickyji handles information in connection with Sticky Ji accounts, notes, workspaces, payments, and support.',
    legal: true,
    sections: [
      { id: 'scope', title: '1. Who we are and what this covers', paragraphs: [
        'stickyji, based in Vadodara, Gujarat, India, provides Sticky Ji. Contact aadityasoftware.in@gmail.com with privacy questions or requests. This notice covers our website and service. It does not replace the privacy notices of third-party services you choose to use.',
        'For account administration, billing, and service operations, stickyji determines the purposes of processing. A business workspace owner may determine how information in its shared workspace is used. The roles and any required data-processing agreement must be established for that workspace.',
      ] },
      { id: 'information', title: '2. Information involved in using Sticky Ji', paragraphs: [
        'Account information includes the name, email address, profile details, authentication information, and preferences you provide. Workspace information includes notes, titles, checklists, folders, assignments, invitations, membership, permissions, and activity associated with those features.',
        'Billing information includes the selected plan, payment or order identifiers, transaction status, and information required for invoices. Support information includes the messages and attachments you send us. Other workspace members may provide your email address when inviting or assigning work to you.',
        'Operating the service may involve IP addresses, browser and device details, request timestamps, error records, and security logs. The exact logging, analytics tools, and retention schedule must be confirmed before this draft becomes the final notice.',
      ] },
      { id: 'purposes', title: '3. Why information is used', paragraphs: [
        'Information is used to create and authenticate accounts, store and display your work, manage sharing and permissions, maintain preferences, process payments, resolve support requests, protect the service against misuse, and meet legal obligations.',
        'Where applicable law requires a legal basis, processing must rely on an appropriate basis such as performing a contract, complying with law, a permitted legitimate interest, or valid consent. Consent must be requested where required and may be withdrawn without making earlier lawful processing unlawful. This notice is not blanket consent for unrelated uses.',
      ] },
      { id: 'sharing', title: '4. Workspace sharing and service providers', paragraphs: [
        'People who have access to a workspace may see the information shared there according to their permissions. Workspace owners and administrators may manage membership and access. Consider the contents of a note before sharing it or assigning it to someone else.',
        'Service providers may process information to provide hosting, storage, email delivery, security, support, and payments on our behalf. Razorpay is integrated for checkout and processes payment information under its own terms and privacy notice. Payment details entered in its checkout are handled by that payment flow.',
        'Information may also be disclosed where necessary to comply with a valid legal demand, protect rights and safety, investigate abuse, or carry out a business transfer subject to applicable safeguards. Provider identities, hosting locations, and any other disclosures must be verified for the final notice; this draft does not claim that data is stored only in India.',
      ] },
      { id: 'storage', title: '5. Cookies, local storage, and external services', paragraphs: [
        'The service uses browser and session mechanisms to support sign-in, account preferences, and normal operation. Blocking essential browser storage or cookies can affect these features. Clearing browser storage is not the same as deleting your server-side account or notes.',
        'Any non-essential analytics or advertising technologies must be documented and, where required, offered only after consent. A cookie inventory and the actual controls must be verified before this notice is finalised. Third-party links and checkout experiences are subject to the relevant provider’s practices.',
      ] },
      { id: 'retention', title: '6. Retention and deletion', paragraphs: [
        'Information should be kept only for as long as needed for its stated purpose, account operation, legal obligations, dispute resolution, or security. Different categories can require different retention periods. Account closure does not necessarily require immediate removal of legally required billing records.',
        'Moving a note to trash, leaving a workspace, and requesting account deletion are different actions. Shared content may remain available to an authorised workspace owner. Backup deletion and retention periods must be confirmed in the final notice; do not assume that trash or account closure immediately erases every copy.',
        'To ask about deletion or retention of your information, email our contact address with the account concerned. Do not include sensitive identity documents unless we request a suitable verification method.',
      ] },
      { id: 'security', title: '7. Security and international processing', paragraphs: [
        'No internet service or storage system can guarantee absolute security. Use a strong, unique password, protect your devices, review workspace membership, and report suspected unauthorised access promptly. Avoid storing passwords, payment credentials, or information requiring specialised regulatory safeguards in notes.',
        'Where information is processed across borders, the locations and safeguards required by applicable law must be identified. This draft makes no claim of end-to-end encryption, a security certification, or a particular international transfer mechanism. Our operational measures and incident response obligations must be verified before publication.',
      ] },
      { id: 'rights', title: '8. Your choices, requests, and complaints', paragraphs: [
        'Depending on the law that applies, you may have rights to information about processing, access, correction, erasure, portability, restriction, objection, consent withdrawal, or grievance redressal. Some requests are subject to lawful exceptions and verification. Where provided by applicable Indian law, nomination rights may also apply.',
        'Email aadityasoftware.in@gmail.com with “Privacy request” in the subject. We will handle requests within the periods required by the law applicable to them. You may complain to a competent data-protection authority or other regulator where that right is available. No contractual term removes a statutory right.',
      ] },
      { id: 'children', title: '9. Age requirements', paragraphs: [
        'This draft service policy is intended for users aged 18 or older. Do not create an account or submit a child’s personal information if you do not meet the applicable age and authorisation requirements. Contact us if you believe a child’s information has been provided improperly so that it can be reviewed.',
      ] },
      { id: 'changes', title: '10. Changes and contact', paragraphs: [
        'The final notice will display its effective date and version. Material changes will be communicated as required by law, and any new consent required for changed processing will be sought before that processing starts. Contact stickyji at aadityasoftware.in@gmail.com for questions.',
      ] },
    ],
  },
  terms: {
    eyebrow: 'Using Sticky Ji',
    title: 'Terms & conditions',
    intro: 'These draft terms describe the proposed agreement for using Sticky Ji, including accounts, shared content, paid plans, and responsibilities.',
    legal: true,
    sections: [
      { id: 'agreement', title: '1. The agreement', paragraphs: [
        'Sticky Ji is provided by stickyji, Vadodara, Gujarat, India. These terms apply to the website and service. The final terms become binding when validly accepted through the relevant sign-up or purchase flow. This clearly marked draft is not an already-effective agreement.',
        'You must be at least 18 and legally able to enter into this agreement. If acting for an organisation, you must have authority to bind it. A separately signed agreement takes precedence to the extent it expressly conflicts with these terms. Mandatory consumer and statutory rights remain unaffected.',
      ] },
      { id: 'accounts', title: '2. Accounts and workspace responsibilities', paragraphs: [
        'Provide accurate account and billing information, protect your credentials, and notify us of suspected unauthorised access. You are responsible for activity you authorise through your account. You must not impersonate another person or access an account or workspace without permission.',
        'Workspace owners are responsible for invitations, access levels, and their authority to share content or personal information. Access may change when an owner changes permissions or removes a member. Retain your own copies of important information before leaving a workspace or closing an account.',
      ] },
      { id: 'content', title: '3. Your content and our service', paragraphs: [
        'You retain ownership of the content you submit. You grant stickyji a limited, non-exclusive licence to host, store, reproduce, transmit, and display that content only as needed to operate, secure, maintain, and support the service and follow your sharing instructions. This licence does not transfer ownership of your notes to us.',
        'You must have the rights and permissions needed to upload and share your content. Sticky Ji software, branding, and other service materials remain the property of their owners. We grant you a limited right to use the service within your plan and these terms, not a right to copy or resell the platform.',
      ] },
      { id: 'acceptable-use', title: '4. Acceptable use', paragraphs: [
        'Do not use Sticky Ji for illegal activity, fraud, harassment, threats, infringement, malware, unsolicited messaging, or disclosure of information you are not authorised to share. Do not bypass security or access controls, probe systems without permission, disrupt the service, or evade plan and usage restrictions.',
        'Do not upload payment credentials, secrets, or highly sensitive regulated records requiring protections that we have not expressly agreed to provide. Sticky Ji is a productivity tool, not an emergency system or a substitute for medical, legal, financial, or other professional advice.',
        'We may investigate reports and restrict unlawful or harmful content or activity where reasonably necessary. To report abuse or an intellectual-property concern, email us with the affected material, location, your rights or concern, and contact details.',
      ] },
      { id: 'billing', title: '5. Plans, payments, and renewals', paragraphs: [
        'Available features, usage limits, price, currency, taxes, billing period, and any renewal terms must be shown in the plan or checkout before purchase. Do not assume that every plan renews automatically; any recurring charge requires the applicable disclosure and authorisation.',
        'Payments are processed through the checkout provider, currently Razorpay. You authorise only the charges you agree to at checkout. We may restrict paid features for an unpaid amount, with notice and an opportunity to resolve it where appropriate. Future price changes must be disclosed before they apply; they do not retrospectively alter an already-paid period.',
      ] },
      { id: 'cancellation', title: '6. Cancellation and refunds', paragraphs: [
        'To request cancellation or query a charge, contact aadityasoftware.in@gmail.com using the account email and payment reference. Deleting the app, leaving a workspace, or ceasing use does not by itself cancel a billing arrangement. Cancellation and account deletion are separate requests.',
        'The final refund eligibility rules, request window, cancellation effective date, and refund-processing timeline are awaiting business confirmation. They must be clearly disclosed before paid purchases rely on this policy. This draft does not impose a blanket no-refunds rule or promise a refund window that has not been approved.',
        'Nothing in the final refund policy may exclude a refund or remedy required by applicable law. Report duplicate, failed, or unauthorised charges promptly so they can be investigated through the relevant payment process.',
      ] },
      { id: 'availability', title: '7. Availability and changes', paragraphs: [
        'We may maintain, update, or modify the service. Features may be interrupted by maintenance, network failures, third-party issues, or events outside reasonable control. Unless separately agreed in writing, there is no guaranteed uptime, support response time, or recovery commitment.',
        'We will give reasonable notice of material changes or discontinuation where practicable and as required by law. Any applicable paid-service or consumer remedies remain available. Keep independent copies of information whose loss would cause you harm.',
      ] },
      { id: 'termination', title: '8. Suspension and termination', paragraphs: [
        'Access may be suspended or terminated for a material breach, non-payment, legal requirement, or a credible risk to the service or others. Where practicable and appropriate, we will explain the reason and allow a breach to be remedied. Immediate restriction may be necessary for security, serious abuse, or legal compliance.',
        'You may stop using the service and request account closure. The consequences for paid plans follow the applicable cancellation and refund terms. Retention and deletion of information are addressed in the Privacy Policy. Terms intended by their nature to survive, including ownership, accrued payment obligations, and lawful liability provisions, survive termination.',
      ] },
      { id: 'disclaimers', title: '9. Disclaimers', paragraphs: [
        'To the extent permitted by applicable law, the service is provided “as is” and “as available”, without implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that it will always be uninterrupted, error-free, or suitable for every workflow.',
        'These exclusions apply only where lawful. They do not exclude an express promise we make in a binding agreement, a statutory warranty that cannot be excluded, or a remedy that the law requires.',
      ] },
      { id: 'liability', title: '10. Limits of liability', paragraphs: [
        'To the maximum extent permitted by law, neither party is liable under this agreement for indirect or consequential losses, including lost profits or business opportunities. Subject to the exclusions below, stickyji’s aggregate liability arising from the service is limited to the greater of the fees you paid for it in the 12 months before the event giving rise to the claim or INR 1,000.',
        'These limits do not apply to fraud, wilful misconduct, gross negligence, death or personal injury caused by negligence, or any other liability that cannot lawfully be limited. They do not remove mandatory consumer, privacy, or other statutory remedies. The applicability and enforceability of these provisions depend on applicable law.',
      ] },
      { id: 'business-claims', title: '11. Third-party claims involving business use', paragraphs: [
        'If you use Sticky Ji on behalf of a business, to the extent permitted by law that business will indemnify stickyji against reasonable, documented third-party claims and costs directly caused by its unlawful content, infringement of another person’s rights, or deliberate misuse of the service.',
        'This obligation does not cover claims caused by stickyji’s own breach or wrongdoing. We must promptly notify the business, reasonably cooperate, and allow it to participate in the defence. No settlement may impose an admission or non-monetary obligation on the other party without its consent. This clause is not intended to impose a business indemnity on individual consumers.',
      ] },
      { id: 'disputes', title: '12. Governing law and disputes', paragraphs: [
        'Subject to mandatory applicable law, these terms are governed by the laws of India. Courts with competent jurisdiction in Vadodara, Gujarat, India will hear disputes, except where applicable law gives you the right to use another court, consumer forum, regulator, or remedy.',
        'Please first contact aadityasoftware.in@gmail.com so we can try to resolve an issue. This request does not delay or restrict a statutory complaint, urgent remedy, or legal deadline. These terms do not impose mandatory arbitration or a blanket waiver of consumer rights.',
      ] },
      { id: 'general', title: '13. Changes and other provisions', paragraphs: [
        'The final terms will state an effective date and version. Material changes will be notified in a reasonable way, and renewed acceptance obtained where required. Changes do not retrospectively remove accrued rights. If you do not agree to a future change, you may stop using the service subject to existing payment obligations and lawful cancellation rights.',
        'If a provision is unenforceable, the remaining provisions continue to the extent permitted by law. A failure to enforce a term is not a waiver. Neither party is responsible for a delay caused by events beyond its reasonable control, except for obligations that the law does not excuse. For notices and questions, contact stickyji at aadityasoftware.in@gmail.com.',
      ] },
    ],
  },
};
