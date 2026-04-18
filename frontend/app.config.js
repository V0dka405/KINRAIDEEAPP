export default {
  "name": "KinRaiDee",
  "slug": "kinraidee",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "https://picsum.photos/1024",
  "userInterfaceStyle": "light",
  "splash": {
    "backgroundColor": "#FF6321"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "https://picsum.photos/1024",
      "backgroundColor": "#FF6321"
    },
    "package": "com.kinraidee.app",
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA",
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VIDEO"
    ],
    "config": {
      "googleMaps": {
        "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  },
  "ios": {
    "supportsTablet": false,
    "bundleIdentifier": "com.kinraidee.app",
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "KinRaiDee ต้องการตำแหน่งของคุณเพื่อแนะนำร้านอาหารใกล้เคียง",
      "NSCameraUsageDescription": "ใช้กล้องสำหรับถ่ายรูปรีวิวอาหาร"
    },
    "config": {
      "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
    }
  },
  "plugins": [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "KinRaiDee ต้องการตำแหน่งของคุณ"
      }
    ]
  ],
  // ส่วนที่เพิ่มเข้าไปเพื่อให้ EAS Build ทำงานได้
  "extra": {
    "eas": {
      "projectId": "0ca1fa8e-9059-4f77-bb28-327d5c43b26f"
    }
  }
};