// ============================================================
// server/index.js – Express + MongoDB REST API (ES Modules Version)
// KinRaiDee Backend Server 2026 - FIXED VERSION
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
    // 1. เตรียมค่าและแปลง Data Type ให้ถูกต้อง
    const { category, priceLevel, lat, lng } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const radius = parseInt(req.query.radius) || 5000;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 2. ถ้ามีพิกัดและ API Key ให้พยายามดึงจาก Google Places ก่อน
    if (process.env.GOOGLE_PLACES_API_KEY && !isNaN(latitude) && !isNaN(longitude)) {
      try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        // ใช้ keyword เพื่อความแม่นยำในการหาประเภทอาหาร
        const keywordParam = category ? `&keyword=${encodeURIComponent(category)}` : '';
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant${keywordParam}&key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          const results = data.results || [];
          
          let googleRestaurants = results.map(place => ({
            _id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            reviewCount: place.user_ratings_total || 0,
            priceLevel: place.price_level || 0, // Google ให้ค่า 0-4
            category: category || 'General',
            address: place.vicinity || '',
            location: {
              type: 'Point',
              coordinates: [place.geometry.location.lng, place.geometry.location.lat]
            },
            imageUrl: place.photos && place.photos.length > 0 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
              : ''
          }));

          // กรองด้วย Price Level (ถ้าส่งมา)
          if (priceLevel) {
            googleRestaurants = googleRestaurants.filter(r => r.priceLevel === Number(priceLevel));
          }

          // ทำ Pagination ใน Memory (เนื่องจาก Google API ส่งมาเป็น List ใหญ่)
          const total = googleRestaurants.length;
          const startIndex = (page - 1) * limit;
          const paginatedRestaurants = googleRestaurants.slice(startIndex, startIndex + limit);

          // ถ้า Google มีข้อมูล ให้ return ทันที
          if (total > 0) {
            return res.json({ 
              source: 'google',
              restaurants: paginatedRestaurants, 
              total: total, 
              page: page, 
              pages: Math.ceil(total / limit)
            });
          }
          // ถ้า Google ได้ ZERO_RESULTS จะไหลลงไปหาใน Database ต่อข้างล่าง
        } else {
          console.error('Google API Status Error:', data.status, data.error_message);
        }
      } catch (apiErr) {
        console.error('Google Places API fetch error:', apiErr);
      }
    }

    // 3. ส่วนของ Fallback: ค้นหาใน MongoDB
    const query = {};
    if (category) query.category = new RegExp(category, 'i'); // ใช้ Regex เพื่อให้หาแบบไม่สนตัวพิมพ์เล็กพิมพ์ใหญ่
    if (priceLevel) query.priceLevel = Number(priceLevel);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radius,
        },
      };
    }

    const restaurants = await Restaurant.find(query)
      .select('-menu')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Restaurant.countDocuments(query);

    res.json({ 
      source: 'database',
      restaurants, 
      total, 
      page: page, 
      pages: Math.ceil(total / limit) 
    });

  } catch (err) {
    console.error('Final Error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/restaurants/random-category', (req, res) => {
  try {
    const categories = [
      'ก๋วยเตี๋ยว',
      'อาหารจานเดียว',
      'สตรีทฟู้ด',
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

// ✅ FIXED: POST /api/restaurants/:id/reviews
// - เพิ่มการตรวจสอบข้อมูล
// - รองรับ Google Places API restaurants
// - สร้าง temporary record สำหรับร้านใหม่
app.post('/api/restaurants/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const restaurantId = req.params.id;

    // ✅ Validation
    if (!rating || !comment || !comment.trim()) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'rating และ comment เป็นข้อมูลจำเป็น' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'INVALID_RATING',
        message: 'rating ต้องอยู่ระหว่าง 1-5' 
      });
    }

    console.log('📝 Review request:', {
      restaurantId,
      rating,
      userId: req.user.id,
      commentLength: comment.length
    });

    // ✅ สำหรับ Google Places API restaurants (ไม่มี MongoDB record)
    // ให้สร้าง record ใหม่ในฐานข้อมูลก่อน
    let restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant && restaurantId.startsWith('ChIJ')) {
      // นี่คือ Google Place ID (ขึ้นต้นด้วย ChIJ) → สร้าง temporary record
      console.log('🏪 Creating temporary restaurant record for Google Place:', restaurantId);
      
      restaurant = await Restaurant.create({
        _id: restaurantId,
        name: 'Temporary Restaurant',
        category: 'General',
        address: 'Google Places Location',
        priceLevel: 2,
        rating: 0,
        reviewCount: 0,
        location: {
          type: 'Point',
          coordinates: [100.5, 13.5] // Default Bangkok coords
        }
      });
    }

    // ✅ สร้าง Review
    const review = await Review.create({
      restaurant: restaurantId,
      user: req.user.id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await review.populate('user', 'name avatarUrl');
    
    console.log('✅ Review created successfully:', {
      reviewId: review._id,
      restaurantId,
      rating,
      userId: req.user.id
    });

    res.status(201).json({
      message: 'Review created successfully',
      review,
      success: true
    });

  } catch (err) {
    console.error('❌ Review creation error:', err);
    res.status(500).json({ 
      error: 'REVIEW_ERROR',
      message: err.message || 'เกิดข้อผิดพลาดในการสร้างรีวิว',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Vercel Compatibility & Export ────────────────────────────
// เปลี่ยนจากการ listen ตลอดเวลา เป็นการ export app เผื่อไว้ให้ Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

export default app;