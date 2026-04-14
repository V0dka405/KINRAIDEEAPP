// ============================================================
// constants.ts  –  KinRaiDee React Native
// ============================================================
// ----------------------------------------------------------------------
// [สาเหตุของ Error]: Cannot find module './types' เกิดจาก TypeScript/VSCode 
// ไม่รู้ว่าควรหาไฟล์นามสกุลอะไร (.ts, .js) เมื่อไม่มีการระบุสกุลไฟล์
// ซึ่งปกติเราจะแก้ด้วยการสร้างไฟล์ tsconfig.json ไว้ที่โฟลเดอร์โปรเจกต์ (frontend) 
// เพื่อให้ระบบรู้จัก Module Resolution แบบ Node.js
//
// [วิธีแก้]: 
// 1. สร้างไฟล์ tsconfig.json ไว้ที่ Root ของโปรเจกต์ (ทำให้แล้ว) 
// 2. หรือถ้าต้องการแก้เฉพาะจุด สามารถระบุนามสกุลไฟล์ตรงๆ เช่น './types.ts' ได้
// ----------------------------------------------------------------------
import { Restaurant } from './types';

const DEFAULT_MENU = [
  { id: 'm1', name: 'Signature Dish',  price: 120, imageUrl: 'https://picsum.photos/seed/m1/400/400', description: 'Our most popular dish made with fresh ingredients.' },
  { id: 'm2', name: 'Spicy Special',   price: 150, imageUrl: 'https://picsum.photos/seed/m2/400/400', description: 'A spicy kick for those who love heat.' },
  { id: 'm3', name: "Chef's Choice",   price: 200, imageUrl: 'https://picsum.photos/seed/m3/400/400', description: 'Hand-picked by our head chef daily.' },
  { id: 'm4', name: 'Fresh Salad',     price: 90,  imageUrl: 'https://picsum.photos/seed/m4/400/400', description: 'Light and refreshing seasonal greens.' },
  { id: 'm5', name: 'Iced Tea',        price: 45,  imageUrl: 'https://picsum.photos/seed/m5/400/400', description: 'Home-brewed with a hint of lemon.' },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  // Street Food
  { id: 'sf1', name: 'Som Tum Jay So',      rating: 4.5, reviewCount: 1250, priceLevel: 1, category: 'Street Food', address: 'Silom',       distance: '0.8 km', imageUrl: 'https://picsum.photos/seed/sf1/800/600', description: 'Legendary Isan food.',          reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'sf2', name: 'Jay Fai',              rating: 4.8, reviewCount: 5000, priceLevel: 4, category: 'Street Food', address: 'Phra Nakhon', distance: '3.2 km', imageUrl: 'https://picsum.photos/seed/sf2/800/600', description: 'Michelin-starred crab omelette.',reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'sf3', name: 'Wattana Panich',       rating: 4.6, reviewCount: 2100, priceLevel: 1, category: 'Street Food', address: 'Ekkamai',     distance: '4.5 km', imageUrl: 'https://picsum.photos/seed/sf3/800/600', description: 'Famous 40-year-old beef stew.',  reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'sf4', name: 'Polo Fried Chicken',   rating: 4.4, reviewCount: 1800, priceLevel: 2, category: 'Street Food', address: 'Lumphini',    distance: '1.5 km', imageUrl: 'https://picsum.photos/seed/sf4/800/600', description: 'Best garlic fried chicken.',    reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'n1',  name: 'Rung Rueang Pork Noodle',rating:4.7,reviewCount:3200,priceLevel:1, category: 'Noodles',     address: 'Sukhumvit 26', distance: '1.2 km', imageUrl: 'https://picsum.photos/seed/n1/800/600', description: 'Best pork noodles in BKK.',    reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'n2',  name: 'Thip Samai Pad Thai',  rating: 4.3, reviewCount: 8000, priceLevel: 2, category: 'Noodles',    address: 'Maha Chai',   distance: '3.5 km', imageUrl: 'https://picsum.photos/seed/n2/800/600', description: 'The most famous Pad Thai.',    reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'r2',  name: 'Go-Ang Kaomunkai',     rating: 4.5, reviewCount: 4500, priceLevel: 1, category: 'Rice Dishes',address: 'Pratunam',    distance: '2.0 km', imageUrl: 'https://picsum.photos/seed/r2/800/600', description: 'Michelin chicken rice.',       reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'r3',  name: 'Here Hai',             rating: 4.7, reviewCount: 1500, priceLevel: 3, category: 'Rice Dishes',address: 'Ekkamai',     distance: '4.2 km', imageUrl: 'https://picsum.photos/seed/r3/800/600', description: 'Insane crab fried rice.',      reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'c2',  name: 'Factory Coffee',       rating: 4.8, reviewCount: 2200, priceLevel: 2, category: 'Cafe',       address: 'Phaya Thai',  distance: '2.8 km', imageUrl: 'https://picsum.photos/seed/c2/800/600', description: 'Award-winning baristas.',      reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'j4',  name: 'Sushi Masato',         rating: 4.9, reviewCount: 500,  priceLevel: 4, category: 'Japanese',   address: 'Sukhumvit 31',distance: '1.9 km', imageUrl: 'https://picsum.photos/seed/j4/800/600', description: 'Elite Omakase.',               reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'k2',  name: 'Saemaeul Sikdang',     rating: 4.5, reviewCount: 3000, priceLevel: 2, category: 'Korean',     address: 'Siam Square', distance: '2.8 km', imageUrl: 'https://picsum.photos/seed/k2/800/600', description: '7-minute kimchi stew.',        reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'w1',  name: 'Peppina',              rating: 4.6, reviewCount: 2200, priceLevel: 3, category: 'Western',    address: 'Sukhumvit 33',distance: '2.3 km', imageUrl: 'https://picsum.photos/seed/w1/800/600', description: 'Best Neapolitan pizza.',       reviews: [], videoReviews: [], menu: DEFAULT_MENU },
  { id: 'd1',  name: 'After You',            rating: 4.5, reviewCount: 5000, priceLevel: 2, category: 'Dessert',    address: 'Siam Square', distance: '3.0 km', imageUrl: 'https://picsum.photos/seed/d1/800/600', description: 'Honey toast heaven.',          reviews: [], videoReviews: [], menu: DEFAULT_MENU },
];

export const CATEGORIES = [
  'Street Food', 'Noodles', 'Rice Dishes', 'Cafe', 'Japanese', 'Korean', 'Western', 'Dessert',
];

export const BUDGETS = [
  { label: '฿',     value: 1, desc: 'Under 100 THB' },
  { label: '฿฿',   value: 2, desc: '100 - 300 THB' },
  { label: '฿฿฿',  value: 3, desc: '300 - 800 THB' },
  { label: '฿฿฿฿', value: 4, desc: '800+ THB' },
];

export const COLORS = {
  primary:    '#FF6321',
  primaryDark:'#E5591E',
  secondary:  '#5A5A40',
  bg:         '#f5f5f0',
  dark:       '#141414',
  white:      '#FFFFFF',
  card:       '#FFFFFF',
  border:     'rgba(0,0,0,0.05)',
};
