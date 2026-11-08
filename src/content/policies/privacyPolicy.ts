import { labelled, sectionId, type PolicyDocument, type PolicySection } from "./types";

// Source: "PALENGKEY PRIVACY POLICY rev2.docx" — English and Tagalog versions.
// Keep the wording as written; it's the approved legal text.

function section(
  title: string,
  icon: PolicySection["icon"],
  blocks: PolicySection["blocks"],
): PolicySection {
  return { id: sectionId(title), title, icon, blocks };
}

const list = (...items: string[]) => ({
  type: "list" as const,
  items: items.map(labelled),
});
const p = (text: string) => ({ type: "p" as const, text });
const subheading = (text: string) => ({ type: "subheading" as const, text });

export const privacyPolicyEnglish: PolicyDocument = {
  language: "English",
  title: "Privacy Policy",
  lastUpdated: "September 15, 2026",
  intro: [
    "Welcome to Palengkey Digital Market Corp. (“we,” “us,” “our,” or “Palengkey”). We value the trust you place in us, and we are committed to protecting your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.",
    "This Privacy Policy explains how we collect, use, process, safeguard, and dispose of your information when you use our web application, mobile app, and related services.",
  ],
  sections: [
    section("1. Information We Collect", "search", [
      p(
        "To provide a seamless marketplace and delivery experience, we collect the following categories of information:",
      ),
      list(
        "Personal Identification Details: Full name, delivery address, email address, and mobile number.",
        "Location Data: Precise GPS coordinates and device location data (when permitted by your device settings) to facilitate accurate rider mapping, address verification, and real-time delivery tracking.",
        "Transaction Information: Details of your orders, purchase and delivery history, and preferred payment methods (Note: We do not store full credit card details or e-wallet PINs; these are securely handled by our PCI-DSS compliant third-party payment partners).",
        "Technical & Device Data: IP address, device type, operating system, browser type, unique device identifiers, and cookies utilized to optimize app performance, security, and user experience.",
      ),
    ]),
    section("2. How We Use Your Information", "sparkle", [
      p(
        "In compliance with the DPA principle of legitimate purpose, your data is processed exclusively for:",
      ),
      list(
        "Order Fulfillment & Logistics: Processing your orders, coordinating fresh goods sourcing from partner vendors, and mapping precise delivery routes to your doorstep via our riders.",
        "Customer Support: Addressing inquiries, managing product replacements or refunds, and resolving service-related issues.",
        "Platform & Operational Improvements: Analyzing market trends, purchasing behaviors, and geographical demand to optimize our inventory and service delivery.",
        "Marketing & Communications: Sending service announcements, promotional offers, or new feature updates (You retain the absolute right to opt-out of marketing communications at any time).",
      ),
    ]),
    section("3. Information Sharing and Disclosure", "truck", [
      p(
        "We do not sell, trade, or rent your personal data to third parties. We share necessary information only with trusted entities bound by data privacy obligations:",
      ),
      list(
        "Logistics & Delivery Team: Rider partners receive your name, contact number, and precise delivery location exclusively to execute physical delivery.",
        "Partner Vendors: Limited order-specific details (such as custom item preparation notes) required to pack fresh produce correctly.",
        "Payment Gateways: Secure transmission of encrypted transaction data to providers like GCash, Maya, or partner banks for payment processing.",
        "Legal Authorities: When required by Philippine law, court orders, or regulatory bodies (e.g., BIR, NPC) to protect legal rights or ensure public safety.",
      ),
    ]),
    section("4. Account and Data Deletion Policy", "x", [
      p(
        "You hold full autonomy over your personal data. You may request the permanent deletion of your Palengkey account and associated personal information through the following channels:",
      ),
      list(
        "In-App: Navigate to Account Settings > Security & Privacy > Request Account Deletion.",
        'Via Email: Send a formal request to admin@palengkey.com using the subject line "Account Deletion Request" from your registered email address.',
        "Processing Timeline & Retention Grace Period: Once a deletion request is verified, your account is deactivated immediately. Your personal details and data will remain securely locked in our system for a grace period of one hundred twenty (120) days before being permanently purged or anonymized.",
        "Re-Registration: Because account deletion results in the complete purge of your data after the 120-day period, you will need to re-register as a new user from scratch if you wish to use the Palengkey platform again in the future.",
      ),
      subheading("Exceptions and Statutory Retention:"),
      list(
        "Pending Transactions: Deletion requests are temporarily paused until active orders, unresolved customer disputes, or outstanding balances are fully settled.",
        "Legal & Financial Compliance: Transaction logs, electronic invoices, and tax-related receipts are retained for five (5) years in compliance with Bureau of Internal Revenue (BIR) regulations before permanent disposal.",
      ),
    ]),
    section("5. Data Security and Data Retention", "shield", [
      p(
        "We implement robust organizational, physical, and technical security measures—including data encryption in transit and at rest—to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Data is retained only as long as necessary to fulfill the purposes outlined in this policy or to satisfy legal requirements.",
      ),
    ]),
    section("6. Your Rights as a Data Subject", "check", [
      p(
        "Under Chapter IV of the Data Privacy Act of 2012, you are entitled to the following rights:",
      ),
      list(
        "Right to be Informed: Know whether your data is being processed, how it is collected, and for what purpose.",
        "Right to Access: Obtain a copy of the personal data we hold about you.",
        "Right to Rectification: Update or correct inaccurate or outdated information via your account settings.",
        "Right to Erasure or Blocking: Request the suspension, removal, or anonymization of your data (subject to Section 4).",
        "Right to Object: Withdraw consent or object to automated processing and direct marketing profiling.",
        "Right to Data Portability: Obtain an electronic, machine-readable copy of your data for personal use or transfer.",
      ),
    ]),
    section("7. Contact Us", "pin", [
      p(
        "For any inquiries, privacy concerns, complaints, or exercise of your rights under the DPA, please reach out to our Data Privacy Officer (DPO) at:",
      ),
      list(
        "Palengkey Digital Market Corp.",
        "Address: Alabang, Muntinlupa City",
        "Email: admin@palengkey.com",
        "Phone: 09098875763",
      ),
    ]),
  ],
};

export const privacyPolicyTagalog: PolicyDocument = {
  language: "Tagalog",
  title: "Privacy Policy (Patakaran sa Pagpapribado)",
  lastUpdated: "Setyembre 4, 2026",
  intro: [
    "Maligayang pagdating sa Palengkey Digital Market Corp. (“kami,” “amin,” o “Palengkey”). Pinahahalagahan namin ang inyong tiwala, at kami ay nakatuon sa pagprotekta ng inyong personal na impormasyon alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173) at mga alituntunin nito.",
    "Ipinapaliwanag ng Patakaran sa Pagpapribado na ito kung paano namin kinokolekta, ginagamit, pinoprotektahan, at ibinubura ang inyong impormasyon sa paggamit ng aming web app, mobile app, at mga serbisyo.",
  ],
  sections: [
    section("1. Impormasyong Aming Kinokolekta", "search", [
      p(
        "Upang makapagbigay ng mabilis at maayos na serbisyo sa palengke at paghahatid, kinokolekta namin ang mga sumusunod:",
      ),
      list(
        "Personal na Detalye: Buong pangalan, tirahan para sa delivery, email address, at mobile number.",
        "Lokasyon (Location Data): Eksaktong GPS coordinates at datos ng lokasyon ng inyong device (kung nakapahintulot sa inyong settings) para sa tamang pagtukoy ng ruta ng rider at bilis ng paghahatid.",
        "Impormasyon sa Transaksyon: Detalye ng inyong mga order, delivery history, at napiling paraan ng pagbabayad (Tandaan: Hindi namin itinatago ang buong credit card details o e-wallet PIN; ito ay hawak ng aming secure payment partners).",
        "Technical at Device Data: IP address, uri ng device, operating system, browser type, at cookies para sa seguridad at mas mabilis na pag-load ng app.",
      ),
    ]),
    section("2. Paano Namin Ginagamit ang Inyong Impormasyon", "sparkle", [
      p("Alinsunod sa batas, ginagamit lamang ang inyong data para sa:"),
      list(
        "Order Fulfillment at Logistics: Pagproseso ng order, pagbili ng sariwang produkto mula sa partner vendors, at pag-navigate ng mga rider patungo sa inyong bahay.",
        "Customer Support: Pagsagot sa mga katanungan, pag-asikaso ng refunds o replacements, at paglutas ng mga isyu sa serbisyo.",
        "Pagpapaganda ng Serbisyo: Pag-analisa sa mga sikat na produkto at rehiyon para mapabuti ang aming imbentoryo at sistema.",
        "Marketing at Komunikasyon: Pagpapadala ng mga abiso tungkol sa promos o bagong tampok (May karapatan kayong mag-opt out anumang oras).",
      ),
    ]),
    section("3. Pagbabahagi ng Impormasyon (Data Sharing)", "truck", [
      p(
        "Hindi namin ibinebenta ang inyong personal na data. Ibinabahagi lamang ito sa mga sumusunod na kasosyo na sumusunod din sa mga patakaran sa privacy:",
      ),
      list(
        "Logistics Team: Pangalan, numero, at eksaktong lokasyon para maihatid nang tama ng rider ang inyong order.",
        "Partner Vendors: Limitadong detalye ng order (tulad ng klase ng hiwa ng karne o gulay) para maihanda nang wasto ang mga sariwang bilihin.",
        "Payment Gateways: Ligtas na pagpapadala ng impormasyon sa transaksyon sa mga partner tulad ng GCash, Maya, o mga bangko.",
        "Ahensya ng Pamahalaan: Kung kinakailangan ng batas ng Pilipinas o ng mga korte at regulator (tulad ng BIR o NPC).",
      ),
    ]),
    section("4. Polisiya sa Pagbura ng Account at Data (Account & Data Deletion)", "x", [
      p(
        "Mayroon kayong ganap na kontrol sa inyong data. Maaari ninyong hilingin ang permanenteng pagbura ng inyong Palengkey account sa pamamagitan ng:",
      ),
      list(
        "Sa App: Pumunta sa Account Settings > Security & Privacy > Request Account Deletion.",
        'Sa Email: Magpadala ng mensahe sa admin@palengkey.com gamit ang paksang "Account Deletion Request" mula sa inyong rehistradong email.',
        "Panahon ng Pagproseso at Retention Period: Kapag naaprubahan ang hiling, pansamantalang mananatili ang inyong data sa aming sistema sa loob ng isang daan at dalawampung (120) araw bago ito tuluyang burahin o gawing anonymous.",
        "Muling Pagpaparehistro (Re-Registration): Dahil ang pagbura ay magreresulta sa permanenteng pag-alis ng inyong data pagkalipas ng 120 araw, kinakailangan ninyong muling magrehistro bilang bagong user mula sa simula sakaling naisin ninyong gamitin muli ang Palengkey platform sa hinaharap.",
      ),
      subheading("Mga Eksepsyon at Pag-iingat Ayon sa Batas:"),
      list(
        "Mga Nakabinbing Transaksyon: Pansamantalang iaantala ang pagbura kung mayroon pang aktibong order, hindi pa bayad na balanse, o may kasalukuyang reklamo.",
        "Pagsunod sa Batas (BIR): Ang mga rekord ng transaksyon at resibo ay itatago nang hanggang limang (5) taon alinsunod sa mga patakaran ng Bureau of Internal Revenue bago tuluyang sirain.",
      ),
    ]),
    section("5. Proteksyon at Pagpapanatili ng Data", "shield", [
      p(
        "Nagpapatupad kami ng mahigpit na hakbang sa teknolohiya at seguridad (tulad ng data encryption) upang maprotektahan ang inyong impormasyon laban sa unauthorized access. Itinatago lamang ang data hangga't kinakailangan para sa serbisyo o sa itinatadhana ng batas.",
      ),
    ]),
    section("6. Inyong mga Karapatan Bilang Data Subject", "check", [
      p("Sa ilalim ng Data Privacy Act of 2012, may karapatan kayong:"),
      list(
        "Maaalaman (Right to be Informed): Alamin kung paano at bakit kinokolekta ang inyong data.",
        "Mag-access: Humingi ng kopya ng personal na impormasyong hawak namin tungkol sa inyo.",
        "Mag-update (Rectification): Baguhin o itama ang maling impormasyon sa pamamagitan ng app settings.",
        "Magpabura o Mag-block: Hilingin ang pagbura o pag-alis ng inyong data sa aming sistema (ayon sa Seksyon 4).",
        "Tumutol (Object): Tumanggi sa automated processing o direktang marketing.",
        "Data Portability: Humingi ng digital copy ng inyong data para sa inyong personal na paggamit.",
      ),
    ]),
    section("7. Makipag-ugnayan sa Amin", "pin", [
      p(
        "Para sa mga katanungan, reklamo, o nais i-exercise ang inyong mga karapatan sa ilalim ng DPA, kontakin ang aming Data Privacy Officer (DPO):",
      ),
      list(
        "Palengkey Digital Market Corp.",
        "Address: Alabang, Muntinlupa City",
        "Email: admin@palengkey.com",
        "Telepono: 09098875763",
      ),
    ]),
  ],
};
