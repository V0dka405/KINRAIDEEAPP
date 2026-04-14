// ============================================================
// server/index.js – Express + MongoDB REST API (ES Modules Version)
// KinRaiDee Backend Server 2026
// ============================================================
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

// ดึง Models (ตรวจสอบว่าไฟล์ models/index.js ใช้ export แบบ ESM เช่นกัน)
import { 
  Restaurant, User, Review, VideoReview, UserHistory, UserFavorite 
} from './models/index.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kinraidee_secret_key';

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kinraidee')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── Auth Middleware ──────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ============================================================
// AUTH Routes
// ============================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// RESTAURANT Routes
// ============================================================

app.get('/api/restaurants', async (req, res) => {
  try {
    const { category, priceLevel, page = 1, limit = 20, lat, lng, radius = 5000 } = req.query;
    const query = {};

    if (category)   query.category   = category;
    if (priceLevel) query.priceLevel = Number(priceLevel);

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      };
    }

    const restaurants = await Restaurant.find(query)
      .select('-menu')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Restaurant.countDocuments(query);
    res.json({ restaurants, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/restaurants/random-category', (req, res) => {
  try {
    const categories = [
      'Street Food',
      'Noodles',
      'Rice Dishes',
      'Cafe',
      'Japanese',
      'Korean',
      'Western',
      'Dessert'
    ];

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    res.json({
      category: randomCategory
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// REVIEW Routes
// ============================================================

app.get('/api/restaurants/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.id })
      .populate('user', 'name avatarUrl')
      .sort('-createdAt')
      .limit(50);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/restaurants/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      restaurant: req.params.id,
      user:       req.user.id,
      rating,
      comment,
    });
    await review.populate('user', 'name avatarUrl');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// USER Routes
// ============================================================

app.get('/api/users/me/history', authMiddleware, async (req, res) => {
  try {
    const history = await UserHistory.find({ user: req.user.id })
      .populate('restaurant', 'name imageUrl address rating priceLevel category')
      .sort('-createdAt')
      .limit(30);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/me/history', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, action } = req.body;
    const entry = await UserHistory.create({ user: req.user.id, restaurant: restaurantId, action });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/me/favorites', authMiddleware, async (req, res) => {
  try {
    const favorites = await UserFavorite.find({ user: req.user.id })
      .populate('restaurant', 'name imageUrl address rating priceLevel category distance')
      .sort('-createdAt');
    res.json(favorites.map(f => f.restaurant));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/me/favorites/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const existing = await UserFavorite.findOne({ user: req.user.id, restaurant: restaurantId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false });
    }
    await UserFavorite.create({ user: req.user.id, restaurant: restaurantId });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Vercel Compatibility & Export ────────────────────────────
// เปลี่ยนจากการ listen ตลอดเวลา เป็นการ export app เผื่อไว้ให้ Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

export default app;