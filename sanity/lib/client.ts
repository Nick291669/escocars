import {createClient} from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import {apiVersion, dataset, projectId, useCdn} from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}