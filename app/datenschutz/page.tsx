import LegalPage from '@/components/LegalPage'

export default function DatenschutzPage() {
  return (
    <LegalPage
      eyebrow="Datenschutz"
      title="Datenschutzerklärung"
      intro="Diese Datenschutzerklärung informiert darüber, welche personenbezogenen Daten beim Besuch unserer Website, bei der Registrierung und bei einer Reservierung verarbeitet werden."
      sections={[
        {
          title: '1. Verantwortlicher',
          paragraphs: [
            'LIWA Vermietung GbR\nNick Bihl und Max Doll\nProbststraße 15\n73669 Lichtenwald\nDeutschland\nTelefon: 01517 0387967\nE-Mail: liwavermietung@gmail.com',
          ],
        },
        {
          title: '2. Allgemeines zur Datenverarbeitung',
          paragraphs: [
            'Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb der Website, die Bereitstellung eines Kundenkontos, die Bearbeitung von Reservierungen, die Durchführung der Vermietung, die Kommunikation sowie die Erfüllung gesetzlicher Pflichten erforderlich ist.',
            'Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. b DSGVO für vorvertragliche Maßnahmen und die Vertragsdurchführung, Art. 6 Abs. 1 lit. c DSGVO für rechtliche Verpflichtungen sowie Art. 6 Abs. 1 lit. f DSGVO für berechtigte Interessen an einem sicheren und zuverlässigen Betrieb unseres Angebots.',
          ],
        },
        {
          title: '3. Hosting über Vercel',
          paragraphs: [
            'Unsere Website wird technisch über Vercel bereitgestellt. Dabei können technisch erforderliche Verbindungs- und Protokolldaten, insbesondere IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene Ressource, Browser- und Geräteinformationen verarbeitet werden. Die Verarbeitung dient der Auslieferung, Stabilität und Sicherheit der Website.',
            'Soweit Daten außerhalb der Europäischen Union bzw. des Europäischen Wirtschaftsraums verarbeitet werden, erfolgt dies nur unter Beachtung der datenschutzrechtlichen Voraussetzungen für Drittlandübermittlungen.',
          ],
        },
        {
          title: '4. Kundenkonto und Datenbank über Supabase',
          paragraphs: [
            'Für Registrierung, Anmeldung, Kundenkonten und Buchungsdaten verwenden wir Supabase. Dabei verarbeiten wir insbesondere Name, E-Mail-Adresse, Telefonnummer, Benutzer-ID, Anmeldeinformationen in technisch geschützter Form sowie Buchungs- und Reservierungsdaten.',
            'Die Verarbeitung erfolgt zur Bereitstellung des Kundenkontos, zur Bearbeitung der Reservierung und zur Durchführung des Mietverhältnisses auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.',
          ],
        },
        {
          title: '5. Inhalte über Sanity',
          paragraphs: [
            'Fahrzeug- und Websiteinhalte werden über Sanity verwaltet und bereitgestellt. Beim Abruf entsprechender Inhalte können technisch erforderliche Verbindungsdaten verarbeitet werden. Sanity wird nicht zur Erstellung von Werbe- oder Nutzerprofilen durch LIWA eingesetzt.',
          ],
        },
        {
          title: '6. Reservierungen und Mietanfragen',
          paragraphs: [
            'Bei einer Reservierung verarbeiten wir die im Kundenkonto vorhandenen Kontaktdaten sowie den ausgewählten Anhänger, Mietzeitraum, Abholzeit, einen gegebenenfalls angegebenen Uhrzeitwunsch, Zahlungsart, Preis, Buchungsstatus und Buchungsnummer.',
            'Diese Daten benötigen wir zur Bearbeitung der verbindlichen Reservierung, zur Vorbereitung und Durchführung des Mietvertrags sowie zur Kommunikation mit dem Kunden.',
          ],
        },
        {
          title: '7. E-Mail-Versand über Resend',
          paragraphs: [
            'Transaktions-E-Mails wie Reservierungs- und Statusnachrichten werden über den Dienst Resend versendet. Hierfür werden insbesondere die E-Mail-Adresse des Empfängers und die für die jeweilige Nachricht erforderlichen Buchungsinformationen verarbeitet.',
            'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Soweit eine Verarbeitung in Drittländern stattfindet, beachten wir die hierfür geltenden datenschutzrechtlichen Anforderungen.',
          ],
        },
        {
          title: '8. Interne Benachrichtigungen über Pushover',
          paragraphs: [
            'Bei neuen Reservierungen können interne Benachrichtigungen an die Betreiber über Pushover versendet werden. Dabei können für die Bearbeitung der Reservierung erforderliche Angaben wie Name, Telefonnummer, Anhänger, Zeitraum und Buchungsnummer übermittelt werden. Die Benachrichtigungen dienen ausschließlich der internen Bearbeitung von Reservierungen.',
          ],
        },
        {
          title: '9. Online-Zahlung',
          paragraphs: [
            'Eine Online-Zahlungsfunktion ist derzeit nicht aktiviert. Es werden daher aktuell keine Zahlungsdaten an Stripe übermittelt. Sollte die Online-Zahlung künftig aktiviert werden, wird diese Datenschutzerklärung vor der Aktivierung entsprechend ergänzt.',
          ],
        },
        {
          title: '10. Cookies und Tracking',
          paragraphs: [
            'Wir setzen nach aktuellem Stand keine Analyse-, Marketing- oder Werbetracking-Dienste wie Google Analytics oder Meta Pixel ein.',
            'Technisch erforderliche Speicherungen oder Zugriffe können insbesondere für Anmeldung, Sitzungsverwaltung und Sicherheitsfunktionen eingesetzt werden. Solche technisch erforderlichen Funktionen dienen der Bereitstellung des ausdrücklich gewünschten Dienstes.',
          ],
        },
        {
          title: '11. Speicherdauer',
          paragraphs: [
            'Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Zweck erforderlich ist. Vertrags-, Buchungs- und Abrechnungsdaten können darüber hinaus entsprechend gesetzlicher handels- und steuerrechtlicher Aufbewahrungspflichten gespeichert werden. Kundenkontodaten werden gelöscht, wenn sie nicht mehr benötigt werden und keine gesetzlichen Pflichten oder berechtigten Gründe einer Löschung entgegenstehen.',
          ],
        },
        {
          title: '12. Empfänger',
          paragraphs: [
            'Daten erhalten nur diejenigen Personen und Dienstleister, die sie für den jeweiligen Zweck benötigen. Hierzu können insbesondere Vercel, Supabase, Sanity, Resend und Pushover gehören. Eine Weitergabe an Behörden oder sonstige Dritte erfolgt nur, wenn hierfür eine gesetzliche Verpflichtung oder sonstige Rechtsgrundlage besteht.',
          ],
        },
        {
          title: '13. Rechte betroffener Personen',
          bullets: [
            'Auskunft über die verarbeiteten personenbezogenen Daten',
            'Berichtigung unrichtiger Daten',
            'Löschung, soweit keine gesetzlichen Gründe entgegenstehen',
            'Einschränkung der Verarbeitung',
            'Datenübertragbarkeit, soweit die gesetzlichen Voraussetzungen vorliegen',
            'Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen',
            'Beschwerde bei einer zuständigen Datenschutzaufsichtsbehörde',
          ],
        },
        {
          title: '14. Datensicherheit',
          paragraphs: [
            'Wir treffen angemessene technische und organisatorische Maßnahmen, um personenbezogene Daten vor Verlust, unbefugtem Zugriff und Missbrauch zu schützen. Die Datenübertragung der Website erfolgt grundsätzlich verschlüsselt über HTTPS.',
          ],
        },
        {
          title: '15. Stand',
          paragraphs: ['Stand: August 2026'],
        },
      ]}
    />
  )
}
