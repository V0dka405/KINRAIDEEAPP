// ============================================================
// components/MapComponent.tsx  –  KinRaiDee React Native
// แปลงจาก Google Maps Web SDK → react-native-maps
// ============================================================
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Restaurant } from '../types';
import { COLORS } from '../constants';

interface MapComponentProps {
  restaurant: Restaurant;
  userLocation?: { lat: number; lng: number };
}

// พิกัดเริ่มต้น: ใจกลางกรุงเทพฯ
const BKK_CENTER = { latitude: 13.7563, longitude: 100.5018 };

// สร้าง mock coordinates ตามชื่อร้าน (seed-based)
function getRestaurantCoords(restaurant: Restaurant) {
  const seed = restaurant.id.charCodeAt(0) + restaurant.id.charCodeAt(1);
  return {
    latitude:  13.72 + (seed % 100) * 0.0005,
    longitude: 100.49 + (seed % 80) * 0.0005,
  };
}

export const MapComponent: React.FC<MapComponentProps> = ({ restaurant, userLocation }) => {
  const mapRef = useRef<MapView>(null);
  const restaurantCoords = getRestaurantCoords(restaurant);

  const userCoords = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : null;

  // ซูมให้เห็นทั้ง user และร้านอาหาร
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [restaurantCoords];
    if (userCoords) coords.push(userCoords);

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 500);
  }, [restaurant, userLocation]);

  const initialRegion: Region = {
    latitude:  restaurantCoords.latitude,
    longitude: restaurantCoords.longitude,
    latitudeDelta:  0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        mapType="standard"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* ─── Marker: ร้านอาหาร ─── */}
        <Marker
          coordinate={restaurantCoords}
          title={restaurant.name}
          description={restaurant.address}
          pinColor={COLORS.primary}
        />

        {/* ─── Marker: ผู้ใช้งาน ─── */}
        {userCoords && (
          <Marker
            coordinate={userCoords}
            title="คุณอยู่ที่นี่"
            pinColor="#4285F4"
          />
        )}

        {/* ─── เส้นทาง user → ร้าน ─── */}
        {userCoords && (
          <Polyline
            coordinates={[userCoords, restaurantCoords]}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* ─── Label ชื่อร้าน (overlay) ─── */}
      <View style={styles.label} pointerEvents="none">
        <Text style={styles.labelText} numberOfLines={1}>
          📍 {restaurant.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  label: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
  },
});
