import LegalPage from '@/components/LegalPage'

export default function MietbedingungenPage() {
  return (
    <LegalPage
      eyebrow="Anhängervermietung"
      title="Mietbedingungen"
      intro="Die folgenden Regeln gelten ergänzend zu unseren AGB für die konkrete Nutzung, Abholung und Rückgabe unserer Anhänger."
      sections={[
        {
          title: '1. Abholung und Rückgabe',
          paragraphs: [
            'Abholung und Rückgabe erfolgen grundsätzlich am vereinbarten Übergabeort: Am freien Feld 18, 73669 Lichtenwald.',
            'Die vereinbarten Abhol- und Rückgabezeiten sind einzuhalten. Eine frühere Rückgabe oder eine absehbare Verspätung ist vorher telefonisch unter 01517 0387967 abzustimmen.',
          ],
        },
        {
          title: '2. Verspätete Rückgabe',
          paragraphs: [
            'Bei einer vom Mieter zu vertretenden verspäteten Rückgabe kann für jede angefangene Stunde eine zusätzliche Nutzungsentschädigung von 1 € berechnet werden.',
            'Keine zusätzliche Gebühr wird berechnet, soweit die Verspätung auf einem nachvollziehbaren, vom Mieter nicht zu vertretenden Grund beruht oder LIWA die rechtzeitige Rückgabe selbst verhindert, etwa weil eine vereinbarte Rücknahme durch LIWA nicht möglich ist. Unfälle oder Pannen sind unverzüglich mitzuteilen.',
          ],
        },
        {
          title: '3. Zustand und Reinigung',
          paragraphs: [
            'Der Anhänger wird in einem verkehrssicheren und grundsätzlich sauberen Zustand übergeben und ist entsprechend zurückzugeben. Normale, geringfügige Gebrauchsspuren oder leichte Verschmutzungen führen nicht zu einer Reinigungsgebühr.',
            'Bei erheblicher, über das übliche Maß hinausgehender Verschmutzung kann eine Reinigungspauschale von 5 € berechnet werden, sofern der tatsächliche erforderliche Reinigungsaufwand dies rechtfertigt. Dem Mieter bleibt der Nachweis eines geringeren oder nicht entstandenen Aufwands vorbehalten.',
          ],
        },
        {
          title: '4. Fahrerlaubnis und Zugfahrzeug',
          paragraphs: [
            'Der Mieter muss mindestens 18 Jahre alt sein und selbst prüfen, ob seine Fahrerlaubnis zum Führen der konkreten Kombination aus Zugfahrzeug und Anhänger berechtigt.',
            'Das Zugfahrzeug muss technisch geeignet, ordnungsgemäß zugelassen und mit einer zulässigen Anhängevorrichtung ausgestattet sein. Zulässige Anhänge-, Stütz- und Gesamtgewichte dürfen nicht überschritten werden.',
          ],
        },
        {
          title: '5. Beladung und Ladungssicherung',
          paragraphs: [
            'Der Mieter ist für ordnungsgemäße Beladung, Gewichtsverteilung und Ladungssicherung verantwortlich. Die zulässige Nutzlast und das zulässige Gesamtgewicht dürfen nicht überschritten werden.',
            'Für Schäden, die durch Überladung, fehlerhafte Ladungssicherung oder eine sonstige schuldhafte Fehlbedienung verursacht werden, haftet der Mieter nach den gesetzlichen Vorschriften.',
          ],
        },
        {
          title: '6. Unzulässige Nutzung',
          bullets: [
            'Weitervermietung oder entgeltliche Überlassung an Dritte ohne Zustimmung von LIWA',
            'Überladung oder Nutzung entgegen den technischen Zulassungsdaten',
            'Auslandsfahrten ohne vorherige ausdrückliche Absprache mit LIWA',
            'Transport gefährlicher Stoffe ohne vorherige ausdrückliche Absprache und ohne Einhaltung sämtlicher gesetzlicher Anforderungen',
            'Bohren, Schrauben, Schweißen oder sonstige bauliche Veränderungen am Anhänger',
            'Nutzung zu rechtswidrigen Zwecken oder in einer Weise, die den Anhänger vermeidbar beschädigt',
          ],
        },
        {
          title: '7. Schäden, Unfall und Diebstahl',
          paragraphs: [
            'Schäden, Unfälle, Verlust, Diebstahl oder sonstige außergewöhnliche Ereignisse sind LIWA unverzüglich mitzuteilen. Der Mieter darf ohne Zustimmung von LIWA keine Reparaturen beauftragen, außer sofortige Maßnahmen sind zur Gefahrenabwehr zwingend erforderlich.',
            'Bei einem Unfall sind die erforderlichen Daten der Beteiligten und Zeugen aufzunehmen. Soweit Personen verletzt wurden, erheblicher Sachschaden entstanden ist, die Schuldfrage unklar ist, ein Unfallgegner sich entfernt oder sonst eine polizeiliche Aufnahme geboten ist, ist die Polizei zu verständigen.',
            'Der Mieter haftet für schuldhaft verursachte Schäden nach den gesetzlichen Vorschriften. Soweit eine Versicherung eintritt, wird deren Leistung berücksichtigt. Nicht versicherte Schäden, eine vereinbarte oder versicherungsvertragliche Selbstbeteiligung und berechtigte Regressansprüche können beim Mieter verbleiben.',
          ],
        },
        {
          title: '8. Kaution und Schadensabrechnung',
          paragraphs: [
            'Für die derzeit angebotenen kleineren Anhänger beträgt die Barkaution grundsätzlich 200 €. Sie wird bei ordnungsgemäßer Rückgabe zurückgezahlt.',
            'Bei einem Schaden oder fehlenden Gegenständen kann LIWA einen angemessenen Betrag bis zur Klärung zurückbehalten. Die Höhe richtet sich nicht pauschal nach einem Prozentsatz, sondern nach dem voraussichtlichen Anspruch. Nach Feststellung der tatsächlichen Kosten wird abgerechnet und ein nicht benötigter Restbetrag ausgezahlt.',
            'Übersteigt ein vom Mieter zu ersetzender Schaden die Kaution, können weitergehende berechtigte Ansprüche geltend gemacht werden. Umgekehrt wird ein nicht benötigter Teil der Kaution zurückgezahlt.',
          ],
        },
        {
          title: '9. Reservierung und Stornierung',
          paragraphs: [
            'Die Online-Reservierung ist verbindlich. Der Mietvertrag selbst wird bei der Übergabe vor Ort unterzeichnet.',
            'Kostenlose Stornierungen sind bis 24 Stunden vor Mietbeginn möglich. Bei späteren Stornierungen werden grundsätzlich 50 % des vereinbarten Mietpreises als pauschalierter Ausfallschaden berechnet. Der Kunde kann nachweisen, dass kein oder ein wesentlich geringerer Schaden entstanden ist.',
          ],
        },
        {
          title: '10. Übergabe',
          paragraphs: [
            'Bei Übergabe können vorhandene Vorschäden und übergebenes Zubehör dokumentiert werden. Der Mieter soll erkennbare Schäden oder fehlendes Zubehör vor Fahrtantritt mitteilen, damit diese festgehalten werden können.',
          ],
        },
      ]}
    />
  )
}
