// backend/checkCloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// โหลดค่าจาก .env เข้ามา
dotenv.config();

// ตั้งค่า Cloudinary เหมือนใน index.js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // แนะนำให้ใส่ไว้
});

// ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ
const testConnection = async () => {
  console.log('🧪 กำลังทดสอบการเชื่อมต่อกับ Cloudinary...');
  console.log(`   - Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  // ตรวจสอบว่ามีค่าครบหรือไม่
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: กรุณาตรวจสอบค่า CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, และ CLOUDINARY_API_SECRET ในไฟล์ .env');
    return;
  }

  try {
    // cloudinary.api.ping() เป็นคำสั่งสำหรับทดสอบว่า API Key/Secret ถูกต้องหรือไม่
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      console.log('✅✅✅ การเชื่อมต่อสำเร็จ! ข้อมูลถูกต้อง');
    } else {
      console.warn('🤔 การเชื่อมต่อแปลกๆ:', result);
    }
  } catch (error) {
    console.error('❌❌❌ การเชื่อมต่อล้มเหลว!');
    console.error('   - สาเหตุ:', error.message);
    console.error('   - กรุณาตรวจสอบ API Key, API Secret และ Cloud Name ในไฟล์ .env อีกครั้ง');
  }
};

testConnection();
