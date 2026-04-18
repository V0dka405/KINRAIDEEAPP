// ============================================================
// server/models/index.js – MongoDB Mongoose Models (ES Modules)
// KinRaiDee Backend
// ============================================================
import mongoose from 'mongoose';

// ─── MenuItem (Embedded Schema) ───────────────────────────────
const MenuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  imageUrl:    { type: String },
  description: { type: String },
  available:   { type: Boolean, default: true },
});

// ─── Restaurant ───────────────────────────────────────────────
const RestaurantSchema = new mongoose.Schema(
  {
    externalId:  { type: String, index: true },  // For Google Place IDs or other external sources
    name:        { type: String, required: true, index: true },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    priceLevel:  { type: Number, enum: [1, 2, 3, 4], required: true },
    category:    { type: String, enum: ['Street Food','Noodles','Rice Dishes','Cafe','Japanese','Korean','Western','Dessert'], required: true, index: true },
    address:     { type: String, required: true },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },   // [longitude, latitude]
    },
    imageUrl:    { type: String },
    description: { type: String },
    phone:       { type: String },
    openHours:   { type: String },
    menu:        [MenuItemSchema],
  },
  { timestamps: true }
);

RestaurantSchema.index({ location: '2dsphere' });

// ─── User ─────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true },
    email:         { type: String, required: true, unique: true, lowercase: true },
    passwordHash:  { type: String, required: true },
    avatarUrl:     { type: String },
    defaultBudget: { type: Number, enum: [1, 2, 3, 4], default: 2 },
    dietaryRestrictions: [{ type: String }],
    isVerified:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Review ───────────────────────────────────────────────────
const ReviewSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 2000 },
    images:     [{ type: String }],
  },
  { timestamps: true }
);

// ─── VideoReview ──────────────────────────────────────────────
const VideoReviewSchema = new mongoose.Schema(
  {
    restaurant:   { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true }, // Not required, can be a general food reel
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    videoUrl:     { type: String, required: true },
    thumbnailUrl: { type: String },
    publicId:     { type: String }, // Cloudinary public_id for deletion
    caption:      { type: String, maxlength: 500 },
    likeCount:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── UserHistory ──────────────────────────────────────────────
const UserHistorySchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    action:     { type: String, enum: ['viewed', 'randomized', 'navigated'], default: 'viewed' },
  },
  { timestamps: true }
);

// ─── UserFavorites ────────────────────────────────────────────
const UserFavoriteSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true }
);

UserFavoriteSchema.index({ user: 1, restaurant: 1 }, { unique: true });

// ─── Post (Community) ─────────────────────────────────────────
const PostSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:    { type: String, required: true, maxlength: 200 },
    body:     { type: String, required: true, maxlength: 2000 },
    tag:      { type: String, maxlength: 50 },
    likes:    { type: Number, default: 0 },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

// ─── สร้าง Models ──────────────────────────────────────────────
export const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
export const User = mongoose.model('User', UserSchema);
export const Review = mongoose.model('Review', ReviewSchema);
export const VideoReview = mongoose.model('VideoReview', VideoReviewSchema);
export const UserHistory = mongoose.model('UserHistory', UserHistorySchema);
export const UserFavorite = mongoose.model('UserFavorite', UserFavoriteSchema);
export const Post = mongoose.model('Post', PostSchema);

// หลังบันทึกรีวิว → คำนวณ rating ใหม่ของร้าน (ย้ายมาไว้ข้างล่างหลังจากประกาศ Review)
ReviewSchema.post('save', async function () {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { restaurant: this.restaurant } },
    { $group: { _id: '$restaurant', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await mongoose.model('Restaurant').findByIdAndUpdate(this.restaurant, {
      rating:      Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});