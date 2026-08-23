export const trailersQuery = `*[_type == "trailer"] | order(_createdAt desc) {
  _id,
  title,
  category,
  shortDescription,
  description,
  pricePerDay,
  weekendPrice,
  deposit,
  totalWeight,
  payload,
  dimensions,
  braked,
  licenseClass,
  status,
  badge,
  heroImage,
  gallery
}`

export const postsQuery = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  dateLabel,
  text
}`
