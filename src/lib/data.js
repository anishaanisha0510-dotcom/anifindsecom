// Mock product data for development
export const MOCK_PRODUCTS = [
  { id: "1", title: "Butterfly Claw Clip", price: 349, offerPrice: 199, category: "Claws", emoji: "🦋", images: ["/images/p1.jpg"], stock: 12, rating: 4.5, reviews: 128, isNew: true, isTrending: true },
  { id: "2", title: "Korean Pearl Earrings", price: 299, offerPrice: 149, category: "Earrings", emoji: "🪩", images: ["/images/p2.jpg"], stock: 8, rating: 4.8, reviews: 94, isNew: true, isTrending: true },
  { id: "3", title: "Satin Scrunchie Set (5pcs)", price: 399, offerPrice: 249, category: "Scrunchies", emoji: "🎀", images: ["/images/p3.jpg"], stock: 3, rating: 4.6, reviews: 211, isTrending: true },
  { id: "4", title: "Dainty Pearl Bracelet", price: 499, offerPrice: 299, category: "Bracelets", emoji: "📿", images: ["/images/p4.jpg"], stock: 15, rating: 4.7, reviews: 76, isNew: true },
  { id: "5", title: "Gold Huggie Earrings", price: 449, offerPrice: 249, category: "Earrings", emoji: "✨", images: ["/images/p5.jpg"], stock: 20, rating: 4.4, reviews: 53 },
  { id: "6", title: "Couple Bracelet Set", price: 699, offerPrice: 449, category: "Combos", emoji: "💞", images: ["/images/p6.jpg"], stock: 6, rating: 4.9, reviews: 187, isTrending: true },
  { id: "7", title: "Floral Hair Pin Set", price: 199, offerPrice: 129, category: "Claws", emoji: "🌸", images: ["/images/p7.jpg"], stock: 25, rating: 4.3, reviews: 42, isNew: true },
  { id: "8", title: "3 Scrunchies Combo", price: 299, offerPrice: 199, category: "Combos", emoji: "🎁", images: ["/images/p8.jpg"], stock: 18, rating: 4.6, reviews: 133, isTrending: true },
];

export const MOCK_CATEGORIES = [
  { id: "women", label: "Women", emoji: "👗" },
  { id: "jewelry", label: "Jewelry", emoji: "💍" },
  { id: "earrings", label: "Earrings", emoji: "✨" },
  { id: "bracelets", label: "Bracelets", emoji: "📿" },
  { id: "scrunchies", label: "Scrunchies", emoji: "🎀" },
  { id: "claws", label: "Claws", emoji: "🦋" },
  { id: "combos", label: "Combos", emoji: "🎁" },
  { id: "hampers", label: "Hampers", emoji: "🌸" },
];

export const MOCK_REVIEWS = [
  { id: "r1", name: "Priya S.", rating: 5, text: "Absolutely love the quality! The earrings are so pretty and delicate. Packaging was also beautiful 🌸", avatar: "P", date: "2 days ago" },
  { id: "r2", name: "Anjali M.", rating: 5, text: "Best budget jewellery store! The scrunchies are super soft and the colours are exactly as shown.", avatar: "A", date: "1 week ago" },
  { id: "r3", name: "Sneha R.", rating: 4, text: "Fast delivery and cute packaging! The claw clips are sturdy and look premium. Will definitely order again!", avatar: "S", date: "2 weeks ago" },
  { id: "r4", name: "Divya K.", rating: 5, text: "Ordered the combo set as a gift and my friend loved it! Highly recommend for gifting. 💛", avatar: "D", date: "3 weeks ago" },
];

export const COUPONS = {
  ANI10: { type: "percent", value: 10, minCart: 0, label: "10% off" },
  FREESHIP: { type: "flat", value: 99, minCart: 499, label: "Free Shipping" },
  WHOLESALE20: { type: "percent", value: 20, minCart: 2000, label: "20% Wholesale Discount" },
};

export const WHATSAPP_NUMBER = "919876543210"; // Replace with real number
