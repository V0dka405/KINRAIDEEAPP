# KINRAIDEEAPP

## Roadmap ทิศทางการพัฒนา

### Frontend
- [ ] ดึงพิกัดปัจจุบันของผู้ใช้ (Location) ด้วย `expo-location` ตอนที่สุ่ม Category ได้ แล้วส่งไปยัง Backend
- [ ] สร้าง UI แสดงรายการร้านอาหารที่สุ่มได้
- [ ] เพิ่มปุ่มเปิดแผนที่ไปยังร้านอาหารนั้นๆ โดยใช้ `Linking.openURL()`

### Backend
- [ ] สร้าง API รับข้อมูล Category และพิกัด (Latitude, Longitude) ของผู้ใช้
- [ ] เชื่อมต่อ Google Places API (หรือดึงจาก Database) เพื่อค้นหาร้านอาหารบริเวณใกล้เคียงและส่งข้อมูลกลับไปยัง Frontend