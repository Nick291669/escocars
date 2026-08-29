import LegalPage from '@/components/LegalPage'

export default function AgbPage() {
  return (
    <LegalPage
      eyebrow="Vertragsbedingungen"
      title="Allgemeine Geschäftsbedingungen"
      intro="Diese AGB gelten für Reservierungen und Vermietungen von Anhängern durch LIWA Vermietung GbR an Verbraucher und Unternehmer."
      sections={[
        {
          title: '1. Anbieter und Geltungsbereich',
          paragraphs: [
            'Anbieter ist LIWA Vermietung GbR, Nick Bihl und Max Doll, Probststraße 15, 73669 Lichtenwald. Abholung und Rückgabe erfolgen grundsätzlich am vereinbarten Übergabeort Am freien Feld 18, 73669 Lichtenwald.',
            'Diese Bedingungen gelten für Reservierungen über die Website sowie für die anschließende Vermietung. Abweichende Vereinbarungen bedürfen einer individuellen Vereinbarung.',
          ],
        },
        {
          title: '2. Verbindliche Reservierung und Mietvertrag',
          paragraphs: [
            'Mit dem Absenden der Reservierung gibt der Kunde eine verbindliche Reservierung für den ausgewählten Anhänger, Zeitraum und die ausgewählte reguläre Abholzeit ab. LIWA kann eine Reservierung aus wichtigem Grund oder wegen fehlender tatsächlicher Verfügbarkeit ablehnen oder stornieren und informiert den Kunden hierüber so früh wie möglich.',
            'Der eigentliche Mietvertrag über die Überlassung des Anhängers wird bei der Übergabe vor Ort abgeschlossen und von den Vertragsparteien unterzeichnet. Die vorherige verbindliche Reservierung begründet insbesondere die Pflicht, den vereinbarten Termin wahrzunehmen oder nach den nachfolgenden Stornierungsbedingungen rechtzeitig abzusagen.',
            'Ein optional angegebener Uhrzeitwunsch ist nicht automatisch bestätigt. Maßgeblich bleibt die regulär ausgewählte Abholzeit, bis LIWA den abweichenden Wunsch ausdrücklich bestätigt.',
          ],
        },
        {
          title: '3. Preise und Zahlung',
          paragraphs: [
            'Es gilt der bei der Reservierung angezeigte Mietpreis. Die Zahlung erfolgt derzeit grundsätzlich bar bei der Übergabe, soweit nicht individuell etwas anderes vereinbart wird.',
            'LIWA beabsichtigt, die Kleinunternehmerregelung nach § 19 UStG anzuwenden. Soweit die gesetzlichen Voraussetzungen vorliegen, wird Umsatzsteuer daher nicht gesondert ausgewiesen.',
            'Die Online-Zahlung ist derzeit nicht verfügbar.',
          ],
        },
        {
          title: '4. Stornierung durch den Kunden',
          paragraphs: [
            'Eine Stornierung ist bis 24 Stunden vor dem vereinbarten Mietbeginn kostenfrei möglich. Innerhalb dieses Zeitraums kann die Stornierung über den Kundenbereich erfolgen.',
            'Bei einer Stornierung weniger als 24 Stunden vor Mietbeginn werden grundsätzlich 50 % des vereinbarten Mietpreises als pauschalierter Ausfallschaden berechnet. Dem Kunden bleibt ausdrücklich der Nachweis gestattet, dass LIWA überhaupt kein Schaden oder ein wesentlich geringerer Schaden entstanden ist. LIWA bleibt der Nachweis eines höheren tatsächlich entstandenen Schadens nach den gesetzlichen Vorschriften vorbehalten.',
            'Weniger als 24 Stunden vor Mietbeginn ist die Stornierung telefonisch unter 01517 0387967 mitzuteilen.',
          ],
        },
        {
          title: '5. Absage durch LIWA',
          paragraphs: [
            'Kann der reservierte Anhänger aufgrund eines technischen Defekts, Unfalls, einer verspäteten Rückgabe durch einen Vormieter oder eines sonstigen nicht zumutbar vermeidbaren Umstands nicht bereitgestellt werden, informiert LIWA den Kunden unverzüglich und versucht, soweit möglich, eine Ersatzlösung anzubieten.',
            'Bereits geleistete Zahlungen für nicht erbrachte Mietleistungen werden erstattet. Weitergehende gesetzliche Ansprüche bleiben unberührt.',
          ],
        },
        {
          title: '6. Voraussetzungen der Nutzung',
          paragraphs: [
            'Der Mieter muss mindestens 18 Jahre alt sein. Er ist selbst dafür verantwortlich, dass er über die für das konkrete Gespann erforderliche gültige Fahrerlaubnis verfügt und das eingesetzte Zugfahrzeug zum Ziehen des Anhängers geeignet und zugelassen ist.',
            'LIWA ist berechtigt, vor Übergabe einen geeigneten Identitäts- und Fahrerlaubnisnachweis zu verlangen.',
          ],
        },
        {
          title: '7. Kaution',
          paragraphs: [
            'Für die derzeit angebotenen kleineren Anhänger beträgt die Kaution grundsätzlich 200 €. Für größere oder besonders hochwertige Anhänger kann eine abweichende, insbesondere höhere Kaution vereinbart und bei der jeweiligen Buchung ausgewiesen werden.',
            'Die Kaution ist bei Abholung bar zu hinterlegen. Sie wird nach ordnungsgemäßer Rückgabe grundsätzlich zurückgezahlt.',
            'Bei festgestellten Schäden, fehlendem Zubehör, außergewöhnlicher Verschmutzung oder sonstigen offenen Ansprüchen darf LIWA einen angemessenen Teil der Kaution vorläufig zurückbehalten, soweit dies zur Sicherung voraussichtlicher Ansprüche erforderlich ist. Die endgültige Abrechnung erfolgt nach Klärung der tatsächlichen Kosten. Die Kaution begrenzt die Haftung des Mieters nicht.',
          ],
        },
        {
          title: '8. Haftung',
          paragraphs: [
            'Für Schäden gelten die gesetzlichen Vorschriften und der für den jeweiligen Anhänger bestehende Versicherungsschutz. Der Mieter haftet insbesondere für von ihm schuldhaft verursachte Schäden am Anhänger sowie für Schäden infolge vertragswidriger Nutzung, Überladung, unzulässiger Veränderungen oder sonstiger schuldhafter Pflichtverletzungen.',
            'Versicherungsleistungen werden auf einen ersatzfähigen Schaden angerechnet. Ein bestehender Versicherungsschutz befreit den Mieter nicht automatisch von einer möglichen Selbstbeteiligung, nicht versicherten Schäden oder Regressansprüchen des Versicherers.',
            'LIWA schließt die eigene Haftung für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben, Körper oder Gesundheit nicht aus. Im Übrigen gelten die gesetzlichen Haftungsregeln.',
          ],
        },
        {
          title: '9. Datenschutz',
          paragraphs: [
            'Informationen zur Verarbeitung personenbezogener Daten enthält die gesonderte Datenschutzerklärung auf dieser Website.',
          ],
        },
        {
          title: '10. Schlussbestimmungen',
          paragraphs: [
            'Es gilt deutsches Recht unter Wahrung zwingender Verbraucherschutzvorschriften. Gesetzliche Gerichtsstände bleiben unberührt.',
            'Sollten einzelne Bestimmungen unwirksam sein oder werden, bleiben die übrigen Bestimmungen im Rahmen der gesetzlichen Vorschriften unberührt.',
          ],
        },
      ]}
    />
  )
}
