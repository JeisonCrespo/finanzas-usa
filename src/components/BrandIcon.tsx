import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface BrandPreset {
  id: string;
  label: string;
  family: 'mci' | 'ion';
  iconName: string;
  color: string;
  keywords: string[];
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: 'brand-netflix',
    label: 'Netflix',
    family: 'mci',
    iconName: 'netflix',
    color: '#E50914',
    keywords: ['netflix'],
  },
  {
    id: 'brand-steam',
    label: 'Steam',
    family: 'mci',
    iconName: 'steam',
    color: '#38BDF8',
    keywords: ['steam', 'valve'],
  },
  {
    id: 'brand-spotify',
    label: 'Spotify',
    family: 'mci',
    iconName: 'spotify',
    color: '#1DB954',
    keywords: ['spotify'],
  },
  {
    id: 'brand-youtube',
    label: 'YouTube',
    family: 'mci',
    iconName: 'youtube',
    color: '#FF0000',
    keywords: ['youtube'],
  },
  {
    id: 'brand-playstation',
    label: 'PlayStation',
    family: 'mci',
    iconName: 'sony-playstation',
    color: '#2563EB',
    keywords: ['playstation', 'psn', 'ps5', 'ps plus'],
  },
  {
    id: 'brand-xbox',
    label: 'Xbox / GamePass',
    family: 'mci',
    iconName: 'microsoft-xbox',
    color: '#107C10',
    keywords: ['xbox', 'game pass', 'gamepass'],
  },
  {
    id: 'brand-nintendo',
    label: 'Nintendo',
    family: 'mci',
    iconName: 'nintendo-switch',
    color: '#E60012',
    keywords: ['nintendo', 'switch'],
  },
  {
    id: 'brand-amazon',
    label: 'Amazon / Prime',
    family: 'ion',
    iconName: 'logo-amazon',
    color: '#FF9900',
    keywords: ['amazon', 'prime', 'aws'],
  },
  {
    id: 'brand-apple',
    label: 'Apple / iCloud',
    family: 'ion',
    iconName: 'logo-apple',
    color: '#E2E8F0',
    keywords: ['apple', 'icloud', 'app store'],
  },
  {
    id: 'brand-google',
    label: 'Google One',
    family: 'ion',
    iconName: 'logo-google',
    color: '#4285F4',
    keywords: ['google'],
  },
  {
    id: 'brand-twitch',
    label: 'Twitch',
    family: 'ion',
    iconName: 'logo-twitch',
    color: '#9146FF',
    keywords: ['twitch'],
  },
  {
    id: 'brand-discord',
    label: 'Discord Nitro',
    family: 'ion',
    iconName: 'logo-discord',
    color: '#5865F2',
    keywords: ['discord', 'nitro'],
  },
  {
    id: 'brand-paypal',
    label: 'PayPal',
    family: 'ion',
    iconName: 'logo-paypal',
    color: '#0079C1',
    keywords: ['paypal'],
  },
  {
    id: 'brand-uber',
    label: 'Uber / Uber Eats',
    family: 'mci',
    iconName: 'car-connected',
    color: '#10B981',
    keywords: ['uber', 'lyft', 'doordash'],
  },
];

export const GENERAL_ICONS: { icon: string; label: string }[] = [
  { icon: 'mci:netflix', label: 'Netflix' },
  { icon: 'mci:steam', label: 'Steam' },
  { icon: 'mci:spotify', label: 'Spotify' },
  { icon: 'mci:youtube', label: 'YouTube' },
  { icon: 'mci:sony-playstation', label: 'PlayStation' },
  { icon: 'mci:microsoft-xbox', label: 'Xbox' },
  { icon: 'mci:nintendo-switch', label: 'Nintendo' },
  { icon: 'logo-amazon', label: 'Amazon' },
  { icon: 'logo-apple', label: 'Apple' },
  { icon: 'logo-twitch', label: 'Twitch' },
  { icon: 'logo-discord', label: 'Discord' },
  { icon: 'logo-paypal', label: 'PayPal' },
  { icon: 'home-outline', label: 'Casa' },
  { icon: 'cart-outline', label: 'Súper' },
  { icon: 'restaurant-outline', label: 'Comida' },
  { icon: 'car-outline', label: 'Auto' },
  { icon: 'flash-outline', label: 'Servicios' },
  { icon: 'fitness-outline', label: 'Gym' },
  { icon: 'paw-outline', label: 'Mascota' },
  { icon: 'airplane-outline', label: 'Viajes' },
  { icon: 'medkit-outline', label: 'Salud' },
  { icon: 'cash-outline', label: 'Dinero' },
  { icon: 'briefcase-outline', label: 'Trabajo' },
];

/**
 * Detecta automáticamente si el título o descripción menciona una marca famosa
 * (Netflix, Steam, Spotify, Amazon, Xbox, PlayStation, etc.) y devuelve su ícono y color oficial.
 */
export function detectBrandFromText(text?: string): BrandPreset | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const preset of BRAND_PRESETS) {
    if (preset.keywords.some((kw) => lower.includes(kw))) {
      return preset;
    }
  }
  return null;
}

interface SmartIconProps {
  iconName?: string;
  color?: string;
  titleForAutoBrand?: string;
  size?: number;
  boxSize?: number;
}

export const SmartIcon: React.FC<SmartIconProps> = ({
  iconName = 'pricetag-outline',
  color = '#38BDF8',
  titleForAutoBrand,
  size = 21,
  boxSize = 42,
}) => {
  const detected = detectBrandFromText(titleForAutoBrand);

  const finalColor = detected ? detected.color : color;
  const isMci = detected
    ? detected.family === 'mci'
    : iconName.startsWith('mci:');
  const cleanIconName = detected
    ? detected.iconName
    : iconName.replace(/^mci:/, '');

  return (
    <View
      style={[
        styles.box,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: Math.round(boxSize * 0.28),
          backgroundColor: finalColor + '25',
        },
      ]}
    >
      {isMci ? (
        <MaterialCommunityIcons
          name={cleanIconName as any}
          size={size}
          color={finalColor}
        />
      ) : (
        <Ionicons name={cleanIconName as any} size={size} color={finalColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
