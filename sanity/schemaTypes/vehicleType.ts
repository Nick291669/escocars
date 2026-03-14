import {defineField, defineType} from 'sanity'

export const vehicleType = defineType({
  name: 'vehicle',
  title: 'Fahrzeuge',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Modellname', type: 'string'}),
    defineField({name: 'brand', title: 'Marke', type: 'string'}),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: ['Limousine', 'Coupé', 'Sportwagen', 'SUV', 'Supersportwagen'],
      },
    }),
    defineField({name: 'price', title: 'Preis', type: 'string'}),
    defineField({name: 'mileage', title: 'Kilometerstand', type: 'string'}),
    defineField({name: 'fuel', title: 'Kraftstoff', type: 'string'}),
    defineField({name: 'transmission', title: 'Getriebe', type: 'string'}),
    defineField({name: 'stock', title: 'Bestand', type: 'number'}),
    defineField({name: 'status', title: 'Status', type: 'string'}),
    defineField({name: 'badge', title: 'Badge', type: 'string'}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text'}),
    defineField({name: 'heroImage', title: 'Hauptbild', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'gallery',
      title: 'Galerie',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
  ],
})