// ============================================================
// App.tsx  –  KinRaiDee React Native (Expo)
// แปลงทุก Web Component → React Native
//   div       → View
//   p / h1    → Text
//   img       → Image
//   button    → TouchableOpacity
//   input     → TextInput
//   className → StyleSheet
//   motion    → Animated (react-native-reanimated)
//   geolocation → expo-location
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity, ScrollView,
  StyleSheet, FlatList, Dimensions, Animated, Alert,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Utensils, MapPin, Search, User, Heart, History,
  Settings, Bell, ChevronLeft, Star, MessageSquare,
  Video, Plus, Share2, Navigation, Filter, RefreshCw,
  Dice5, Users, Menu, Play, ChevronRight, Phone,
} from 'lucide-react-native';

import { View as AppView, Restaurant } from './types';
import { MOCK_RESTAURANTS, CATEGORIES, BUDGETS, COLORS } from './constants';
import { Button, Card, SectionHeader, PriceTag, StarRating, Divider } from './components/UI';
import { MapComponent } from './components/MapComponent';


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// 💡 For mobile development, replace 'localhost' with your computer's IP address.
//    Android Emulator: 10.0.2.2, iOS Simulator: localhost
// ==================== API URL สำหรับทดสอบ (Windows + Wi-Fi) ====================
const API_URL = __DEV__ 
  ? Platform.select({
      android: 'http://10.0.2.2:5000/api',
      ios: 'http://localhost:5000/api',
      default: 'http://localhost:5000/api',
    })
  : 'https://your-production-url.com/api';
// =============================================================================
// Google Maps API Key จาก .env (Expo จะดึงค่าที่มี prefix EXPO_PUBLIC_ อัตโนมัติ)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// ─── Animation wrapper (ใช้แทน motion/react) ─────────────────
const FadeSlide: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
};

// ─── BottomNav ────────────────────────────────────────────────
const BottomNav: React.FC<{ current: AppView; navigate: (v: AppView) => void }> = ({ current, navigate }) => {
  const tabs = [
    { view: 'home' as AppView, icon: Utensils },
    { view: 'community' as AppView, icon: MessageSquare },
    { view: 'random' as AppView, icon: Dice5, fab: true },
    { view: 'videos' as AppView, icon: Video },
    { view: 'profile' as AppView, icon: User },
  ];
  return (
    <View style={styles.nav}>
      {tabs.map(({ view, icon: Icon, fab }) =>
        fab ? (
          <TouchableOpacity key={view} style={styles.navFab} onPress={() => navigate(view)}>
            <Icon size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={view} style={styles.navItem} onPress={() => navigate(view)}>
            <Icon size={24} color={current === view ? COLORS.primary : COLORS.secondary} />
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

// ─── RestaurantCard ───────────────────────────────────────────
const RestaurantCard: React.FC<{
  item: Restaurant;
  onPress: () => void;
  horizontal?: boolean;
}> = ({ item, onPress, horizontal = false }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.restaurantCard, horizontal && styles.restaurantCardH]}
    activeOpacity={0.9}
  >
    <Image source={{ uri: item.imageUrl }} style={horizontal ? styles.imgH : styles.imgV} />
    <View style={styles.cardInfo}>
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardAddr} numberOfLines={1}>{item.address} · {item.distance}</Text>
      <View style={styles.cardMeta}>
        <StarRating rating={item.rating} />
        <View style={{ flex: 1 }} />
        <PriceTag level={item.priceLevel} />
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Splash ───────────────────────────────────────────────────
const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <View style={styles.splashLogo}>
          <Utensils size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.splashTitle}>KIN-RAI-DEE</Text>
        <Text style={styles.splashSub}>กินอะไรดี? เรามีคำตอบ</Text>
      </Animated.View>
    </View>
  );
};

// ─── Login ────────────────────────────────────────────────────
const Login: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      await AsyncStorage.setItem('token', data.token);
      Alert.alert('เข้าสู่ระบบสำเร็จ!', `ยินดีต้อนรับกลับมา, ${data.user.name}`);
      navigate('home');

    } catch (error: any) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={styles.splashLogoSmall}>
            <Utensils size={36} color="#fff" />
          </View>
          <Text style={styles.authTitle}>WELCOME BACK</Text>
          <Text style={styles.authSub}>Sign in to continue your food journey</Text>
        </View>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.input} placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <Button onPress={handleLogin} size="lg" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign In'}
        </Button>

        <TouchableOpacity onPress={() => !loading && navigate('signup')} style={{ marginTop: 24, alignItems: 'center' }} disabled={loading}>
          <Text style={{ color: COLORS.secondary, fontSize: 14 }}>
            Don't have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Signup ───────────────────────────────────────────────────
const Signup: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }

      await AsyncStorage.setItem('token', data.token);
      Alert.alert('สมัครสำเร็จ!', 'ยินดีต้อนรับสู่ Kin-Rai-Dee!');
      navigate('onboarding1');

    } catch (error: any) {
      Alert.alert('สมัครไม่สำเร็จ', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.authTitle, { marginBottom: 4 }]}>CREATE ACCOUNT</Text>
        <Text style={[styles.authSub, { marginBottom: 32 }]}>Join the community of food lovers</Text>

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput style={styles.input} placeholder="ชื่อ-นามสกุล" value={name} onChangeText={setName} autoCapitalize="words" />

        <Text style={styles.inputLabel}>EMAIL</Text>
        <TextInput style={styles.input} placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <Button onPress={handleSignup} size="lg" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'กำลังสมัคร...' : 'Create Account'}
        </Button>

        <TouchableOpacity onPress={() => !loading && navigate('login')} style={{ marginTop: 24, alignItems: 'center' }} disabled={loading}>
          <Text style={{ color: COLORS.secondary, fontSize: 14 }}>
            Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Onboarding1 ─────────────────────────────────────────────
const Onboarding1: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => (
  <SafeAreaView style={[styles.screen, styles.onboardScreen]}>
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={styles.onboardBig}>
        DON'T KNOW{'\n'}WHAT TO{'\n'}
        <Text style={{ color: COLORS.primary }}>EAT?</Text>
      </Text>
      <Text style={styles.onboardSub}>Let us decide for you based on your location and budget.</Text>
    </View>
    <View style={{ padding: 32 }}>
      <Button onPress={() => navigate('onboarding2')} size="lg">Next →</Button>
    </View>
  </SafeAreaView>
);

// ─── Onboarding2 ─────────────────────────────────────────────
const Onboarding2: React.FC<{ navigate: (v: AppView) => void; onLocation: () => void }> = ({ navigate, onLocation }) => (
  <SafeAreaView style={[styles.screen, styles.onboardScreen]}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View style={styles.iconCircle}>
        <MapPin size={56} color={COLORS.primary} />
      </View>
      <Text style={[styles.onboardBig, { textAlign: 'center' }]}>WHERE{'\n'}ARE YOU?</Text>
      <Text style={[styles.onboardSub, { textAlign: 'center' }]}>We need your location to find the best spots nearby.</Text>
    </View>
    <View style={{ padding: 32, gap: 12 }}>
      <Button onPress={onLocation} size="lg">📍 Allow Location</Button>
      <Button onPress={() => navigate('onboarding3')} variant="ghost" size="lg">Skip for now</Button>
    </View>
  </SafeAreaView>
);

// ─── Onboarding3 ─────────────────────────────────────────────
const Onboarding3: React.FC<{ navigate: (v: AppView) => void; budget: number; setBudget: (b: number) => void }> = ({ navigate, budget, setBudget }) => (
  <SafeAreaView style={[styles.screen, styles.onboardScreen]}>
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[styles.onboardBig]}>WHAT'S YOUR{'\n'}<Text style={{ color: COLORS.primary }}>BUDGET?</Text></Text>
      <Text style={[styles.onboardSub, { marginBottom: 24 }]}>We'll find places that match your wallet.</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {BUDGETS.map((b) => (
          <TouchableOpacity
            key={b.value}
            onPress={() => setBudget(b.value)}
            style={[styles.budgetChip, budget === b.value && styles.budgetChipActive]}
          >
            <Text style={[styles.budgetChipText, budget === b.value && { color: '#fff' }]}>{b.label}</Text>
            <Text style={[styles.budgetChipDesc, budget === b.value && { color: 'rgba(255,255,255,0.8)' }]}>{b.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    <View style={{ padding: 32 }}>
      <Button onPress={() => navigate('home')} size="lg">Let's Eat! 🍽</Button>
    </View>
  </SafeAreaView>
);

// ─── Home ─────────────────────────────────────────────────────
const Home: React.FC<{
  navigate: (v: AppView) => void;
  restaurants: Restaurant[];
  onSelect: (r: Restaurant) => void;
  category: string;
  setCategory: (c: string) => void;
}> = ({ navigate, restaurants, onSelect, category, setCategory }) => {
  const [search, setSearch] = useState('');
  const filtered = restaurants.filter(r =>
    (category === 'All' || r.category === category) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || r.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.homeGreet}>สวัสดี! 👋</Text>
          <Text style={styles.homeTitle}>กินอะไรดีวันนี้?</Text>
        </View>
        <TouchableOpacity onPress={() => navigate('notifications')} style={styles.iconBtn}>
          <Bell size={22} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: COLORS.dark }}
            placeholder="ค้นหาร้านอาหาร..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => navigate('budget')}>
          <Filter size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          {['All', ...CATEGORIES].map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c === 'All' ? 'All' : c)} style={[styles.catChip, category === c && styles.catChipActive]}>
              <Text style={[styles.catChipText, category === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <SectionHeader title="แนะนำวันนี้" subtitle="เลือกมาเพื่อคุณโดยเฉพาะ" onPress={() => { }} actionLabel="ดูทั้งหมด" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filtered.slice(0, 5).map(r => (
              <RestaurantCard key={r.id} item={r} horizontal onPress={() => { onSelect(r); navigate('result'); }} />
            ))}
          </ScrollView>
        </View>

        {/* All Restaurants */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, paddingBottom: 100 }}>
          <SectionHeader title="ร้านทั้งหมด" />
          {filtered.map(r => (
            <View key={r.id} style={{ marginBottom: 12 }}>
              <RestaurantCard item={r} onPress={() => { onSelect(r); navigate('result'); }} />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav current="home" navigate={navigate} />
    </SafeAreaView>
  );
};

// ─── Randomizer ───────────────────────────────────────────────
const Randomizer: React.FC<{
  config: RandomConfig;
  location: { lat: number; lng: number } | null;
  onSelect: (r: Restaurant) => void;
  navigate: (v: AppView) => void;
}> = ({ config, location, onSelect, navigate }) => {
  const spin       = useRef(new Animated.Value(0)).current;
  const popScale   = useRef(new Animated.Value(0)).current;
  const popOpacity = useRef(new Animated.Value(0)).current;
  const [showPopup, setShowPopup] = useState(false);
  const [result, setResult] = useState<Restaurant | null>(null);

  // หมุน icon ตลอด
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
  }, [spin]);

  // ดึงข้อมูลจาก Backend
  useEffect(() => {
    let isMounted = true;
    
    const fetchRandom = async () => {
    try {
      // 1. สุ่ม category จาก backend
      const resCategory = await fetch(`${API_URL}/restaurants/random-category`);  
      const dataCategory = await resCategory.json();
      const category = dataCategory.category;
      
      // 2. ดึงข้อมูลพิกัดปัจจุบัน (ถ้ายังไม่มีจาก Onboarding)
      let currentLoc = location;
      if (!currentLoc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      }

      // 3. ดึงร้านอาหารจาก Backend (Google Places API)
      if (currentLoc) {
        const queryParams = new URLSearchParams({
          lat: currentLoc.lat.toString(),
          lng: currentLoc.lng.toString(),
          category: category,
          radius: (config.maxDistance * 1000).toString(),
          limit: '1' // เอาแค่ร้านเดียว
        });

        const resRestaurants = await fetch(`${API_URL}/restaurants?${queryParams}`);
        const dataRestaurants = await resRestaurants.json();

        if (dataRestaurants.restaurants && dataRestaurants.restaurants.length > 0) {
          const fetchedRestaurant = dataRestaurants.restaurants[0];
          
          // Map ข้อมูลจาก Backend กลับมาเป็น Restaurant type ของ Frontend
          const realRestaurant: Restaurant = {
            id: fetchedRestaurant._id || 'api-id',
            name: fetchedRestaurant.name,
            rating: fetchedRestaurant.rating || 0,
            reviewCount: fetchedRestaurant.reviewCount || 0,
            priceLevel: fetchedRestaurant.priceLevel || 2,
            category: fetchedRestaurant.category || category,
            address: fetchedRestaurant.address || 'ไม่ระบุที่อยู่',
            distance: 'ใกล้คุณ', // หรือคำนวณจาก lat, lng ทีหลัง
            imageUrl: fetchedRestaurant.imageUrl || 'https://picsum.photos/400',
            description: fetchedRestaurant.description || 'สุ่มเจอร้านนี้เลย!',
            location: {
              lat: fetchedRestaurant.location?.coordinates[1] || currentLoc.lat,
              lng: fetchedRestaurant.location?.coordinates[0] || currentLoc.lng
            },
            reviews: [],
            videoReviews: [],
            menu: []
          };

          if (isMounted) setResult(realRestaurant);
          return;
        }
      }

      // Fallback ถ้าหาพิกัดไม่ได้ หรือ API ไม่เจอร้านเลย
      throw new Error("No nearby restaurants found from API");

  } catch (err) {
    if (isMounted) fallbackMock();
  }
};
    
    const fallbackMock = () => {
      const pool = MOCK_RESTAURANTS.filter(r => r.priceLevel <= config.maxBudget);
      const list = pool.length > 0 ? pool : MOCK_RESTAURANTS;
      setResult(list[Math.floor(Math.random() * list.length)]);
    };

    fetchRandom();
    
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // แสดง popup หลังจากได้ผลลัพธ์และรอ 1.5 วินาที
  useEffect(() => {
    if (!result) return;
    
    const timer1 = setTimeout(() => {
      setShowPopup(true);
      Animated.parallel([
        Animated.spring(popScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(popOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      
    }, 1500);

    return () => clearTimeout(timer1);
  }, [result, popScale, popOpacity]);

  // พาไปหน้า Result หลังจากโชว์ Popup 3 วิ
  useEffect(() => {
    if (showPopup && result) {
      const timer2 = setTimeout(() => {
        onSelect(result);
        navigate('result');
      }, 3000);
      return () => clearTimeout(timer2);
    }
  }, [showPopup, result, navigate, onSelect]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const CATEGORY_EMOJI: Record<string, string> = {
    'ก๋วยเตี๋ยว': '🍜',
    
    
  };

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }]}>
      {/* spinning icon */}
      <Animated.View style={{ transform: [{ rotate }], marginBottom: 32 }}>
        <View style={[styles.fabButton, { width: 120, height: 120, borderRadius: 60 }]}>
          <Dice5 size={60} color="#fff" />
        </View>
      </Animated.View>
      <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark, letterSpacing: -0.5 }}>
        กำลังสุ่มอาหาร...
      </Text>

      {/* popup overlay */}
      {showPopup && result && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* backdrop มืดๆ */}
          <Animated.View style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.45)', opacity: popOpacity }
          ]} />

          {/* popup card */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={{
              backgroundColor: '#fff',
              borderRadius: 32,
              padding: 32,
              alignItems: 'center',
              width: 280,
              transform: [{ scale: popScale }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 20,
            }}>
              {/* emoji ประเภท */}
              <Text style={{ fontSize: 56, marginBottom: 8 }}>
                {CATEGORY_EMOJI[result.category] ?? '🍽'}
              </Text>

              {/* label ประเภท */}
              <View style={{
                backgroundColor: `${COLORS.primary}18`,
                paddingHorizontal: 16, paddingVertical: 6,
                borderRadius: 999, marginBottom: 14,
              }}>
                <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 13 }}>
                  {result.category}
                </Text>
              </View>

              {/* ชื่อร้าน */}
              <Text style={{
                fontSize: 22, fontWeight: '900', color: COLORS.dark,
                textAlign: 'center', letterSpacing: -0.5, marginBottom: 6,
              }}>
                {result.name}
              </Text>

              {/* ระยะทาง + ราคา */}
              <Text style={{ fontSize: 13, color: COLORS.secondary }}>
                📍 {result.address} · {result.distance}
              </Text>

              {/* loading dots */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: COLORS.primary, opacity: 0.4 + i * 0.3,
                  }} />
                ))}
              </View>
              <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 8 }}>
                กำลังโหลดข้อมูล...
              </Text>
            </Animated.View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Result ───────────────────────────────────────────────────
const Result: React.FC<{
  restaurant: Restaurant;
  navigate: (v: AppView) => void;
  onFavorite: (r: Restaurant) => void;
  favorites: Restaurant[];
  location: { lat: number; lng: number } | null;
}> = ({ restaurant, navigate, onFavorite, favorites, location }) => {
  const isFav = favorites.some(f => f.id === restaurant.id);
  
  const handleNavigate = () => {
    import('react-native').then(({ Linking, Platform }) => {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${restaurant.location?.lat ?? 0},${restaurant.location?.lng ?? 0}`;
      const label = encodeURIComponent(restaurant.name);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      }) || `https://www.google.com/maps/search/?api=1&query=${latLng}`;

      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
      });
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {/* Header */}
      <View style={styles.resultHeader}>
        <TouchableOpacity onPress={() => navigate('home')} style={styles.iconBtn}>
          <ChevronLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.resultTag}>{restaurant.category}</Text>
        <TouchableOpacity onPress={() => onFavorite(restaurant)} style={styles.iconBtn}>
          <Heart size={22} color={isFav ? COLORS.primary : COLORS.secondary} fill={isFav ? COLORS.primary : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image source={{ uri: restaurant.imageUrl }} style={styles.heroImage} />

        <View style={{ padding: 20 }}>
          {/* Name & Rating */}
          <Text style={styles.heroName}>{restaurant.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <StarRating rating={restaurant.rating} size={14} />
            <Text style={{ color: COLORS.secondary, fontSize: 13 }}>({restaurant.reviewCount.toLocaleString()} รีวิว)</Text>
            <PriceTag level={restaurant.priceLevel} />
          </View>

          {/* Location & Distance */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
            <MapPin size={14} color={COLORS.secondary} />
            <Text style={{ color: COLORS.secondary, fontSize: 13 }}>{restaurant.address} · {restaurant.distance}</Text>
          </View>

          {/* Description */}
          <Text style={styles.heroDesc}>{restaurant.description}</Text>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button onPress={handleNavigate} style={{ flex: 1 }}>
              <Navigation size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: '700' }}>นำทาง</Text>
            </Button>
            <Button onPress={() => navigate('menu')} variant="outline" style={{ flex: 1 }}>
              <Menu size={16} color={COLORS.dark} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.dark, fontWeight: '700' }}>เมนู</Text>
            </Button>
          </View>

          <Divider style={{ marginVertical: 20 }} />

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'รีวิว', icon: MessageSquare, view: 'add-review' as AppView },
              { label: 'แชร์', icon: Share2, view: null },
              { label: 'วิดีโอ', icon: Video, view: 'videos' as AppView },
            ].map(({ label, icon: Icon, view }) => (
              <TouchableOpacity
                key={label}
                onPress={() => view && navigate(view)}
                style={styles.quickAction}
              >
                <Icon size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Map Preview */}
          <View style={{ height: 180, marginTop: 20, borderRadius: 20, overflow: 'hidden' }}>
            <MapComponent restaurant={restaurant} userLocation={location ?? undefined} />
          </View>

          {/* Shuffle Again */}
          <Button onPress={() => navigate('randomizer')} variant="ghost" style={{ marginTop: 16 }}>
            <RefreshCw size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.secondary, fontWeight: '600' }}>สุ่มร้านใหม่</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── RandomView ───────────────────────────────────────────────
type RandomConfig = {
  maxBudget: number;
  maxDistance: number;
  categories: string[];
};

const DISTANCE_PRESETS = [1, 2, 5, 10];

const RandomView: React.FC<{
  navigate: (v: AppView) => void;
  onRandomize: () => void;
  config: RandomConfig;
  onConfigChange: (c: RandomConfig) => void;
}> = ({ navigate, onRandomize, config, onConfigChange }) => {

  const pulse = useRef(new Animated.Value(1)).current;
  const drawerX = useRef(new Animated.Value(300)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [local, setLocal] = useState<RandomConfig>(config);

  // pulse animation
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  const openDrawer = () => {
    setLocal(config);
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(backdropOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerX, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const applyAndClose = () => {
    onConfigChange(local);
    closeDrawer();
  };

  const toggleCategory = (cat: string) => {
    setLocal(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const activeFilterCount =
    (local.maxBudget < 4 ? 1 : 0) +
    (local.maxDistance < 10 ? 1 : 0) +
    (local.categories.length > 0 ? 1 : 0);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
        <Text style={styles.homeTitle}>RANDOMIZER</Text>
        <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
          {/* hamburger icon */}
          <View style={{ gap: 4 }}>
            <View style={{ width: 18, height: 2, backgroundColor: COLORS.dark, borderRadius: 2 }} />
            <View style={{ width: 18, height: 2, backgroundColor: COLORS.dark, borderRadius: 2 }} />
            <View style={{ width: 18, height: 2, backgroundColor: COLORS.dark, borderRadius: 2 }} />
          </View>
          {/* badge แสดงว่ามี filter active */}
          {activeFilterCount > 0 && (
            <View style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: 8,
              backgroundColor: COLORS.primary,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Spin Button */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity onPress={onRandomize} style={styles.fabButton} activeOpacity={0.85}>
            <Dice5 size={72} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22, marginTop: 8, letterSpacing: -0.5 }}>SPIN!</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.onboardBig, { textAlign: 'center', marginTop: 32 }]}>
          CAN'T DECIDE{'\n'}WHAT TO EAT?
        </Text>
        <Text style={[styles.onboardSub, { textAlign: 'center' }]}>กดปุ่มใหญ่เพื่อสุ่มมื้อถัดไป!</Text>
      </View>

      <BottomNav current="random" navigate={navigate} />

      {/* Backdrop + Drawer */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* backdrop */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdropOp }]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} activeOpacity={1} />
          </Animated.View>

          {/* drawer panel */}
          <Animated.View style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 300,
            backgroundColor: '#fff',
            transform: [{ translateX: drawerX }],
            shadowColor: '#000', shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.12, shadowRadius: 16, elevation: 16,
          }}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>

                {/* Drawer Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: COLORS.dark }}>ตั้งค่าการสุ่ม</Text>
                  <TouchableOpacity onPress={closeDrawer} style={styles.iconBtn}>
                    <Text style={{ fontSize: 18, color: COLORS.secondary }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* งบประมาณ */}
                <Text style={styles.drawerLabel}>งบประมาณสูงสุด</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {BUDGETS.map(b => (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => setLocal(prev => ({ ...prev, maxBudget: b.value }))}
                      style={[styles.drawerChip, local.maxBudget === b.value && styles.drawerChipActive]}
                    >
                      <Text style={[{ fontWeight: '900', fontSize: 15, color: COLORS.dark },
                      local.maxBudget === b.value && { color: '#fff' }]}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ระยะทาง */}
                <Text style={styles.drawerLabel}>ระยะทางสูงสุด</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {DISTANCE_PRESETS.map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setLocal(prev => ({ ...prev, maxDistance: d }))}
                      style={[styles.drawerChip, local.maxDistance === d && styles.drawerChipActive]}
                    >
                      <Text style={[{ fontWeight: '700', fontSize: 13, color: COLORS.dark },
                      local.maxDistance === d && { color: '#fff' }]}>{d} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ประเภทอาหาร */}
                <Text style={styles.drawerLabel}>ประเภทอาหาร <Text style={{ color: COLORS.secondary, fontWeight: '400' }}>(เว้นว่าง = ทุกประเภท)</Text></Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                      style={[styles.drawerChip, local.categories.includes(cat) && styles.drawerChipActive]}
                    >
                      <Text style={[{ fontWeight: '600', fontSize: 12, color: COLORS.dark },
                      local.categories.includes(cat) && { color: '#fff' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Apply */}
                <TouchableOpacity onPress={applyAndClose} style={{
                  backgroundColor: COLORS.primary, borderRadius: 999,
                  paddingVertical: 16, alignItems: 'center',
                }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>บันทึก</Text>
                </TouchableOpacity>

                {/* Reset */}
                <TouchableOpacity onPress={() => setLocal({ maxBudget: 4, maxDistance: 10, categories: [] })}
                  style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.secondary, fontSize: 13 }}>รีเซ็ตทั้งหมด</Text>
                </TouchableOpacity>

              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

    </SafeAreaView>
  );
};

// ─── Profile ──────────────────────────────────────────────────
const Profile: React.FC<{
  navigate: (v: AppView) => void;
  favorites: Restaurant[];
  history: Restaurant[];
  onSelect: (r: Restaurant) => void;
}> = ({ navigate, favorites, history, onSelect }) => (
  <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ padding: 20 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32 }}>🍜</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', marginTop: 12, letterSpacing: -0.5 }}>Food Explorer</Text>
          <Text style={{ color: COLORS.secondary, fontSize: 13 }}>Bangkok, Thailand</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'รีวิว', count: 12 },
            { label: 'ร้านโปรด', count: favorites.length },
            { label: 'ประวัติ', count: history.length },
          ].map(({ label, count }) => (
            <Card key={label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.primary }}>{count}</Text>
              <Text style={{ fontSize: 11, color: COLORS.secondary, marginTop: 2 }}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Favorites */}
        <SectionHeader title="ร้านโปรด" onPress={() => { }} actionLabel="ดูทั้งหมด" />
        {favorites.length === 0
          ? <Text style={{ color: COLORS.secondary, fontSize: 13, marginBottom: 20 }}>ยังไม่มีร้านโปรด กด ❤️ ที่หน้าร้านเลย!</Text>
          : favorites.slice(0, 3).map(r => (
            <View key={r.id} style={{ marginBottom: 10 }}>
              <RestaurantCard item={r} onPress={() => { onSelect(r); navigate('result'); }} />
            </View>
          ))
        }

        {/* Settings Link */}
        <TouchableOpacity onPress={() => navigate('settings')} style={styles.settingsRow}>
          <Settings size={18} color={COLORS.secondary} />
          <Text style={{ marginLeft: 10, fontWeight: '600', color: COLORS.dark }}>การตั้งค่า</Text>
          <View style={{ flex: 1 }} />
          <ChevronRight size={16} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    <BottomNav current="profile" navigate={navigate} />
  </SafeAreaView>
);

// ─── MenuView ─────────────────────────────────────────────────
const MenuView: React.FC<{ restaurant: Restaurant; navigate: (v: AppView) => void }> = ({ restaurant, navigate }) => (
  <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
    <View style={[styles.homeHeader, { borderBottomWidth: 1, borderColor: COLORS.border }]}>
      <TouchableOpacity onPress={() => navigate('result')} style={styles.iconBtn}>
        <ChevronLeft size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>MENU</Text>
        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>{restaurant.name}</Text>
      </View>
    </View>
    <FlatList
      data={restaurant.menu}
      keyExtractor={i => i.id}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      renderItem={({ item }) => (
        <Card style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
          <Image source={{ uri: item.imageUrl }} style={{ width: 88, height: 88, borderRadius: 16 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={2}>{item.name}</Text>
              <Text style={{ color: COLORS.primary, fontWeight: '900' }}>{item.price} ฿</Text>
            </View>
            <Text style={{ fontSize: 13, color: COLORS.secondary, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>
            <Button onPress={() => Alert.alert('🛒', 'เพิ่มลงตะกร้าแล้ว!')} size="sm" style={{ marginTop: 10 }}>เพิ่มสั่ง</Button>
          </View>
        </Card>
      )}
    />
  </SafeAreaView>
);

// ─── SettingsView ─────────────────────────────────────────────
const SettingsView: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => {
  const settingsItems = [
    { section: 'บัญชี', items: ['แก้ไขโปรไฟล์', 'การแจ้งเตือน', 'ความเป็นส่วนตัว'] },
    { section: 'การตั้งค่า', items: ['ข้อจำกัดอาหาร', 'งบประมาณเริ่มต้น'] },
  ];
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigate('login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <View style={styles.homeHeader}>
        <TouchableOpacity onPress={() => navigate('profile')} style={styles.iconBtn}>
          <ChevronLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginLeft: 12 }}>SETTINGS</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
        {settingsItems.map(({ section, items }) => (
          <Card key={section}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.secondary, letterSpacing: 1, marginBottom: 12 }}>{section.toUpperCase()}</Text>
            {items.map(item => (
              <TouchableOpacity key={item} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ fontWeight: '600', flex: 1, fontSize: 15 }}>{item}</Text>
                <ChevronRight size={16} color={COLORS.secondary} />
              </TouchableOpacity>
            ))}
          </Card>
        ))}
        <Button onPress={handleLogout} variant="outline" style={{ borderColor: '#fca5a5' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700' }}>ออกจากระบบ</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── MapView (full screen) ────────────────────────────────────
const MapViewScreen: React.FC<{
  restaurant: Restaurant;
  navigate: (v: AppView) => void;
  location: { lat: number; lng: number } | null;
}> = ({ restaurant, navigate, location }) => (
  <SafeAreaView style={styles.screen}>
    <View style={styles.homeHeader}>
      <TouchableOpacity onPress={() => navigate('result')} style={styles.iconBtn}>
        <ChevronLeft size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: '900', marginLeft: 12 }}>แผนที่</Text>
    </View>
    <View style={{ flex: 1, margin: 16, borderRadius: 24, overflow: 'hidden' }}>
      <MapComponent restaurant={restaurant} userLocation={location ?? undefined} />
    </View>
  </SafeAreaView>
);

// ─── Community ────────────────────────────────────────────────
const Community: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => (
  <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
    <View style={{ padding: 20 }}>
      <Text style={styles.homeTitle}>COMMUNITY</Text>
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>
      {MOCK_RESTAURANTS.slice(0, 5).map(r => (
        <Card key={r.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={{ uri: r.imageUrl }} style={{ width: 60, height: 60, borderRadius: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>{r.name}</Text>
            <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 2 }}>
              "{r.description}" 🌟
            </Text>
          </View>
          <StarRating rating={r.rating} size={11} />
        </Card>
      ))}
    </ScrollView>
    <BottomNav current="community" navigate={navigate} />
  </SafeAreaView>
);

// ─── VideoFeed ────────────────────────────────────────────────
const VideoFeed: React.FC<{ navigate: (v: AppView) => void }> = ({ navigate }) => (
  <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
    <View style={{ padding: 20 }}>
      <Text style={styles.homeTitle}>FOOD REELS</Text>
    </View>
    <FlatList
      data={MOCK_RESTAURANTS.slice(0, 6)}
      keyExtractor={i => i.id}
      numColumns={2}
      contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 100 }}
      columnWrapperStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={{ flex: 1, borderRadius: 16, overflow: 'hidden', aspectRatio: 9 / 16 }}>
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
            <Play size={32} color="#fff" fill="#fff" />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{item.name}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
    <BottomNav current="videos" navigate={navigate} />
  </SafeAreaView>
);

// ─── AddReview (FIXED) ────────────────────────────────────────────────
const AddReview: React.FC<{ restaurant: Restaurant; navigate: (v: AppView) => void }> = ({ restaurant, navigate }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      // ✅ CHECK 1: Validate input
      if (!comment.trim()) {
        Alert.alert('⚠️ ข้อมูลไม่ครบ', 'กรุณาเขียนความคิดเห็นอย่างน้อย 1 ตัวอักษร');
        return;
      }

      // ✅ CHECK 2: Get token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('ต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนรีวิว');
        navigate('login');
        return;
      }

      // ✅ CHECK 3: Validate restaurant ID
      if (!restaurant.id) {
        Alert.alert('ไม่สามารถรีวิวได้', 'ไม่มีข้อมูลร้านอาหาร (ID หาย)');
        return;
      }

      // ✅ CHECK 4: Skip review if it's a temporary/API restaurant
      // (สำหรับร้านจาก randomizer ที่ยังไม่ได้บันทึกใน DB)
      if (restaurant.id.includes('temp') || restaurant.id.includes('api-id')) {
        Alert.alert(
          '⚠️ ร้านนี้อาจเป็นข้อมูลใหม่',
          'กรุณาลองสุ่มร้านอื่นที่มีในระบบ หรือติดต่อแอดมิน',
          [
            { text: 'ยกเลิก', onPress: () => navigate('result') },
            { text: 'ส่งต่อไปเพื่อบันทึกร้าน', onPress: proceedWithReview }
          ]
        );
        return;
      }

      proceedWithReview();

    } catch (e: any) {
      Alert.alert('❌ ข้อผิดพลาด', e.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }
  };

  const proceedWithReview = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      console.log('📤 Sending review:', {
        restaurantId: restaurant.id,
        rating,
        comment: comment.trim(),
        timestamp: new Date().toISOString(),
      });

      const res = await fetch(`${API_URL}/restaurants/${restaurant.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      // ✅ READ RESPONSE (สำคัญ!)
      const data = await res.json();

      console.log('📥 Response status:', res.status);
      console.log('📥 Response data:', data);

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}: เกิดข้อผิดพลาดในการส่งรีวิว`);
      }

      Alert.alert('✅ สำเร็จ!', 'ส่งรีวิวแล้ว ขอบคุณสำหรับการแบ่งปันประสบการณ์');
      navigate('result');

    } catch (e: any) {
      console.error('❌ Review submission error:', e);
      Alert.alert(
        '❌ ไม่สามารถส่งรีวิว',
        e.message || 'กรุณาลองใหม่หรือติดต่อแอดมิน'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={styles.homeHeader}>
        <TouchableOpacity onPress={() => navigate('result')} style={styles.iconBtn}>
          <ChevronLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', marginLeft: 12 }}>เขียนรีวิว</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Restaurant Info Card */}
        <Card style={{ marginBottom: 24, backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, borderWidth: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.dark }}>{restaurant.name}</Text>
          <Text style={{ color: COLORS.secondary, fontSize: 13, marginTop: 4 }}>
            📍 {restaurant.address}
          </Text>
          {restaurant.id.includes('temp') || restaurant.id.includes('api-id') ? (
            <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
              ⚠️ ร้านนี้เพิ่งเจอจากการสุ่ม อาจยังไม่บันทึกในระบบ
            </Text>
          ) : null}
        </Card>

        {/* Rating Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.inputLabel, { marginBottom: 12 }]}>⭐ คะแนนของคุณ</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity 
                key={n} 
                onPress={() => setRating(n)}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: n <= rating ? `${COLORS.primary}20` : 'transparent',
                  borderWidth: n <= rating ? 2 : 1,
                  borderColor: n <= rating ? COLORS.primary : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 32 }}>⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 8 }}>
            {rating === 1 ? '😢 แย่มาก' : rating === 2 ? '😐 ไม่ดี' : rating === 3 ? '😊 พอใจ' : rating === 4 ? '😄 ดีมาก' : '😍 ยอดเยี่ยม!'}
          </Text>
        </View>

        {/* Comment Section */}
        <View>
          <Text style={[styles.inputLabel, { marginBottom: 8 }]}>💬 ความคิดเห็น</Text>
          <TextInput
            style={[styles.input, { 
              height: 140, 
              textAlignVertical: 'top',
              borderColor: comment.trim() ? COLORS.primary : COLORS.border,
              borderWidth: comment.trim() ? 2 : 1,
            }]}
            multiline
            placeholder="เล่าประสบการณ์ของคุณ... (เช่น อร่อยมาก! เสิร์ฟเร็ว ราคาเหมาะสม)"
            placeholderTextColor={COLORS.secondary}
            value={comment}
            onChangeText={setComment}
            editable={!loading}
            maxLength={500}
          />
          <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 6, textAlign: 'right' }}>
            {comment.length}/500
          </Text>
        </View>

        {/* Submit Button */}
        <Button 
          onPress={handleSubmit} 
          size="lg" 
          style={{ marginTop: 28 }} 
          disabled={loading || !comment.trim()}
        >
          {loading ? (
            <>
              <Text style={{ color: '#fff', fontWeight: '700', marginRight: 8 }}>กำลังส่ง...</Text>
            </>
          ) : (
            <>
              <Text style={{ color: '#fff', fontWeight: '700' }}>✓ ส่งรีวิว</Text>
            </>
          )}
        </Button>

        {/* Cancel Link */}
        <TouchableOpacity 
          onPress={() => navigate('result')}
          disabled={loading}
          style={{ marginTop: 12, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.secondary, fontSize: 14 }}>ยกเลิก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── NearbyRestaurants ─────────────────────────────────────────────

// ─── HistoryView ─────────────────────────────────────────────
const HistoryView: React.FC<{
  navigate: (v: AppView) => void;
  history: Restaurant[];
  onSelect: (r: Restaurant) => void;
}> = ({ navigate, history, onSelect }) => (
  <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.bg }]}>
    <View style={styles.homeHeader}>
      <TouchableOpacity onPress={() => navigate('profile')} style={styles.iconBtn}>
        <ChevronLeft size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '900', marginLeft: 12 }}>ประวัติ</Text>
    </View>
    <FlatList
      data={history}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      renderItem={({ item }) => (
        <RestaurantCard item={item} onPress={() => { onSelect(item); navigate('result'); }} />
      )}
    />
  </SafeAreaView>
);

// ============================================================
// App Root
// ============================================================
export default function App() {
  const [view, setView] = useState<AppView>('splash');
  const [selectedRestaurant, setSelected] = useState<Restaurant | null>(null);
  const [budget, setBudget] = useState(1);
  const [category, setCategory] = useState<string>('All');
  const [history, setHistory] = useState<Restaurant[]>(MOCK_RESTAURANTS.slice(0, 3));
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [randomConfig, setRandomConfig] = useState({
    maxBudget: 4,
    maxDistance: 10,
    categories: [] as string[],
  });
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;

  const navigate = (v: AppView) => {
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(screenTranslateY, { toValue: -12, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setView(v);
      screenTranslateY.setValue(16);
      Animated.parallel([
        Animated.timing(screenOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(screenTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const onSelect = async (r: Restaurant) => {
    setSelected(r);
    setHistory(prev => [r, ...prev.filter(p => p.id !== r.id).slice(0, 19)]);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && r.id && !r.id.includes('temp') && !r.id.includes('api-id')) {
        await fetch(`${API_URL}/users/me/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ restaurantId: r.id, action: 'viewed' })
        });
      }
    } catch (e) {}
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }
    navigate('onboarding3');
  };

  const handleRandomize = () => {
    const pool = MOCK_RESTAURANTS.filter(r => {
      const dist = parseFloat(r.distance);
      const budgetOk = r.priceLevel <= randomConfig.maxBudget;
      const distanceOk = dist <= randomConfig.maxDistance;
      const categoryOk = randomConfig.categories.length === 0
        || randomConfig.categories.includes(r.category);
      return budgetOk && distanceOk && categoryOk;
    });
    const list = pool.length > 0 ? pool : MOCK_RESTAURANTS;
    navigate('randomizer');
  };

  const toggleFavorite = async (r: Restaurant) => {
    const isFav = favorites.some(f => f.id === r.id);
    setFavorites(prev => isFav ? prev.filter(f => f.id !== r.id) : [r, ...prev]);

    try {
      const token = await AsyncStorage.getItem('token');
      if (token && r.id && !r.id.includes('temp') && !r.id.includes('api-id')) {
        await fetch(`${API_URL}/users/me/favorites/${r.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {}
  };

  // ดึงข้อมูล History และ Favorites จาก Backend
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        
        const [resFav, resHist] = await Promise.all([
          fetch(`${API_URL}/users/me/favorites`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/users/me/history`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const mapToRestaurant = (f: any): Restaurant => ({
          id: f._id, name: f.name, rating: f.rating || 0, reviewCount: f.reviewCount || 0,
          priceLevel: f.priceLevel || 2, category: f.category || 'General',
          address: f.address || '', distance: f.distance || 'ใกล้คุณ',
          imageUrl: f.imageUrl || 'https://picsum.photos/400', description: f.description || '',
          location: { lat: f.location?.coordinates?.[1] || 0, lng: f.location?.coordinates?.[0] || 0 },
          reviews: [], videoReviews: [], menu: []
        });

        if (resFav.ok) {
          const favData = await resFav.json();
          setFavorites(favData.map(mapToRestaurant));
        }

        if (resHist.ok) {
          const histData = await resHist.json();
          const histRestaurants = histData.map((h: any) => h.restaurant).filter(Boolean).map(mapToRestaurant);
          const uniqueHist = Array.from(new Set(histRestaurants.map((r: any) => r.id)))
            .map(id => histRestaurants.find((r: any) => r.id === id));
          setHistory(uniqueHist as Restaurant[]);
        }
      } catch (e) {}
    };

    if (view === 'home' || view === 'profile') {
      loadUserData();
    }
  }, [view]);

  // ── Render ──
  const render = () => {
    switch (view) {
      case 'splash': return <Splash onDone={() => navigate('login')} />;
      case 'login': return <Login navigate={navigate} />;
      case 'signup': return <Signup navigate={navigate} />;
      case 'onboarding1': return <Onboarding1 navigate={navigate} />;
      case 'onboarding2': return <Onboarding2 navigate={navigate} onLocation={requestLocation} />;
      case 'onboarding3': return <Onboarding3 navigate={navigate} budget={budget} setBudget={setBudget} />;
      case 'home': return (
        <Home
          navigate={navigate}
          restaurants={MOCK_RESTAURANTS.filter(r => budget === 0 || r.priceLevel <= budget)}
          onSelect={onSelect}
          category={category}
          setCategory={setCategory}
        />
      );
      case 'randomizer': return <Randomizer config={randomConfig} location={location} onSelect={onSelect} navigate={navigate} />;
      case 'random': return (
        <RandomView
          navigate={navigate}
          onRandomize={handleRandomize}
          config={randomConfig}
          onConfigChange={setRandomConfig}
        />
      );
      case 'result': return selectedRestaurant
        ? <Result restaurant={selectedRestaurant} navigate={navigate} onFavorite={toggleFavorite} favorites={favorites} location={location} />
        : null;
      case 'map': return selectedRestaurant
        ? <MapViewScreen restaurant={selectedRestaurant} navigate={navigate} location={location} />
        : null;
      case 'menu': return selectedRestaurant ? <MenuView restaurant={selectedRestaurant} navigate={navigate} /> : null;
      case 'profile': return <Profile navigate={navigate} favorites={favorites} history={history} onSelect={onSelect} />;
      case 'settings': return <SettingsView navigate={navigate} />;
      case 'community': return <Community navigate={navigate} />;
      case 'videos': return <VideoFeed navigate={navigate} />;
      case 'add-review': return selectedRestaurant ? <AddReview restaurant={selectedRestaurant} navigate={navigate} /> : null;
      case 'history': return <HistoryView navigate={navigate} history={history} onSelect={onSelect} />;
      default: return <Home navigate={navigate} restaurants={MOCK_RESTAURANTS} onSelect={onSelect} category={category} setCategory={setCategory} />;
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity, transform: [{ translateY: screenTranslateY }] }}>
      {render()}
    </Animated.View>
  );
}

// ============================================================
// StyleSheet
// ============================================================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  onboardScreen: { flex: 1, backgroundColor: COLORS.bg },

  // ── Splash ──
  splashLogo: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  splashLogoSmall: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  splashTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, fontStyle: 'italic' },
  splashSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  // ── Auth ──
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  authTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1, textAlign: 'center', color: COLORS.dark },
  authSub: { fontSize: 15, color: COLORS.secondary, textAlign: 'center', fontStyle: 'italic' },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: COLORS.secondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', color: COLORS.dark },

  // ── Onboarding ──
  onboardBig: { fontSize: 52, fontWeight: '900', letterSpacing: -2, color: COLORS.dark, lineHeight: 56 },
  onboardSub: { fontSize: 18, color: COLORS.secondary, fontStyle: 'italic', marginTop: 16 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: `${COLORS.primary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  budgetChip: { borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, padding: 14, backgroundColor: '#fff', minWidth: '45%', marginBottom: 8 },
  budgetChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  budgetChipText: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  budgetChipDesc: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },

  // ── Home ──
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  homeGreet: { fontSize: 13, color: COLORS.secondary },
  homeTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: COLORS.dark },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  filterBtn: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },

  // ── Nav ──
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 12 },
  navItem: { padding: 8 },
  navFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: -28, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },

  // ── Restaurant Card ──
  restaurantCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginRight: 16, width: SCREEN_W * 0.7, borderWidth: 1, borderColor: COLORS.border },
  restaurantCardH: { width: 'auto', marginRight: 0 },
  imgV: { width: '100%', height: 180 },
  imgH: { width: '100%', height: 140 },
  cardInfo: { padding: 14 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  cardAddr: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },

  // ── Result ──
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  resultTag: { backgroundColor: `${COLORS.primary}18`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  heroImage: { width: '100%', height: 260 },
  heroName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5, color: COLORS.dark },
  heroDesc: { fontSize: 14, color: COLORS.secondary, fontStyle: 'italic', marginTop: 12, lineHeight: 22 },
  quickAction: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },

  // ── Randomizer FAB ──
  fabButton: { width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
  drawerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.secondary, marginBottom: 10 },
  drawerChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  drawerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  // ── Profile ──
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${COLORS.primary}20`, justifyContent: 'center', alignItems: 'center' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
});