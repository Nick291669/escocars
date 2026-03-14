export const vehiclesQuery = `*[_type == "vehicle"] | order(_createdAt desc) {
  _id,
  title,
  brand,
  category,
  price,
  mileage,
  fuel,
  stock,
  status,
  badge,
  description,
  heroImage,
  gallery
  taxCost,
  trunk,
  tank,
  topSpeed
}`

export const postsQuery = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  dateLabel,
  text
}`