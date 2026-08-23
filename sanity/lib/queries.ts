export const trailersQuery = `*[_type in ["trailer", "vehicle"]] | order(_createdAt desc) {
  _id,
  _type,
  title,
  category,
  "shortDescription": coalesce(shortDescription, description),
  description,
  "pricePerDay": coalesce(pricePerDay, price),
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
