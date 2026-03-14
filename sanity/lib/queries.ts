export const vehiclesQuery = `*[_type == "vehicle"] | order(_createdAt desc) {
  _id,
  title,
  brand,
  category,
  price,
  mileage,
  fuel,
  transmission,
  stock,
  status,
  badge,
  description,
  heroImage,
  gallery
}`

export const postsQuery = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  dateLabel,
  text
}`