import {defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Beiträge',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string'}),
    defineField({name: 'dateLabel', title: 'Datum / Label', type: 'string'}),
    defineField({name: 'text', title: 'Text', type: 'text'}),
  ],
})