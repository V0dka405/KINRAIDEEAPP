// ============================================================
// types.ts  –  KinRaiDee React Native
// ============================================================

export type View =
  | 'splash' | 'login' | 'signup'
  | 'onboarding1' | 'onboarding2' | 'onboarding3'
  | 'home' | 'randomizer' | 'result'
  | 'videos' | 'profile' | 'community'
  | 'budget' | 'categories' | 'group-lobby'
  | 'map' | 'notifications' | 'add-review'
  | 'history' | 'menu' | 'settings' | 'random' | 'directions' | 'nearby'| 'create-post';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  available?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

export interface VideoReview {
  id: string;
  userId: string;
  userName: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likeCount: number;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;      // 1-4
  category: string;
  address: string;
  distance: string;
  imageUrl: string;
  description: string;
  phone?: string;
  location?: { lat: number; lng: number };
  reviews: Review[];
  videoReviews: VideoReview[];
  menu: MenuItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  defaultBudget?: number;
  dietaryRestrictions?: string[];
}
