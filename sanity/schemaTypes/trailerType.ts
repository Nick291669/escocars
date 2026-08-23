import {defineField, defineType} from 'sanity'

export const trailerType = defineType({
  name: 'trailer',
  title: 'Anhänger',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Bezeichnung', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: ['Kastenanhänger', 'Hochlader', 'Kipper', 'Autotransporter', 'Motorradanhänger', 'Tieflader'],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'shortDescription', title: 'Kurzbeschreibung', type: 'string'}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text'}),
    defineField({name: 'pricePerDay', title: 'Preis pro Tag', type: 'string', description: 'z. B. 39 €'}),
    defineField({name: 'weekendPrice', title: 'Wochenendpreis', type: 'string', description: 'z. B. 89 €'}),
    defineField({name: 'deposit', title: 'Kaution', type: 'string', description: 'z. B. 150 €'}),
    defineField({name: 'totalWeight', title: 'Zulässiges Gesamtgewicht', type: 'string', description: 'z. B. 1.300 kg'}),
    defineField({name: 'payload', title: 'Nutzlast', type: 'string', description: 'z. B. ca. 1.000 kg'}),
    defineField({name: 'dimensions', title: 'Ladeflächenmaße', type: 'string', description: 'z. B. 2,60 × 1,50 m'}),
    defineField({name: 'braked', title: 'Gebremst', type: 'boolean', initialValue: true}),
    defineField({name: 'licenseClass', title: 'Führerscheinklasse', type: 'string', description: 'z. B. B / B96 / BE'}),
    defineField({name: 'status', title: 'Status', type: 'string', initialValue: 'Verfügbar', options: {list: ['Verfügbar', 'Derzeit vermietet', 'Nicht verfügbar']}}),
    defineField({name: 'badge', title: 'Badge', type: 'string', description: 'Optional, z. B. Beliebt oder Top Preis'}),
    defineField({name: 'heroImage', title: 'Hauptbild', type: 'image', options: {hotspot: true}}),
    defineField({name: 'gallery', title: 'Galerie', type: 'array', of: [{type: 'image', options: {hotspot: true}}]}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'heroImage'},
  },
})
