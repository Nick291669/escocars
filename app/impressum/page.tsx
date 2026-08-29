import LegalPage from '@/components/LegalPage'

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Impressum"
      intro="Anbieterkennzeichnung für LIWA Vermietung."
      sections={[
        {
          title: 'Angaben zum Anbieter',
          paragraphs: [
            'LIWA Vermietung GbR\nNick Bihl und Max Doll\nProbststraße 15\n73669 Lichtenwald\nDeutschland',
            'Vertretungsberechtigte Gesellschafter: Nick Bihl und Max Doll',
          ],
        },
        {
          title: 'Kontakt',
          paragraphs: [
            'Telefon: 01517 0387967\nE-Mail: liwavermietung@gmail.com',
          ],
        },
        {
          title: 'Abhol- und Rückgabeort',
          paragraphs: [
            'Am freien Feld 18\n73669 Lichtenwald',
            'Der Abhol- und Rückgabeort ist nicht die Geschäftsanschrift.',
          ],
        },
        {
          title: 'Steuerliche Angaben',
          paragraphs: [
            'Steuernummer / steuerliche Identifikationsangaben werden ergänzt, sobald diese nach der Unternehmensgründung vorliegen und soweit eine Veröffentlichung gesetzlich erforderlich ist.',
            'Es ist die Anwendung der Kleinunternehmerregelung gemäß § 19 UStG vorgesehen.',
          ],
        },
        {
          title: 'Verbraucherstreitbeilegung',
          paragraphs: [
            'Wir sind derzeit weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
          ],
        },
      ]}
    />
  )
}
