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
    label: 'YouTube Premium',
    family: 'mci',
    iconName: 'youtube',
    color: '#FF0000',
    keywords: ['youtube'],
  },
  {
    id: 'brand-playstation',
    label: 'PlayStation / PS Plus',
    family: 'mci',
    iconName: 'sony-playstation',
    color: '#2563EB',
    keywords: ['playstation', 'psn', 'ps5', 'ps4', 'ps plus'],
  },
  {
    id: 'brand-xbox',
    label: 'Xbox / Game Pass',
    family: 'mci',
    iconName: 'microsoft-xbox',
    color: '#107C10',
    keywords: ['xbox', 'game pass', 'gamepass'],
  },
  {
    id: 'brand-nintendo',
    label: 'Nintendo Switch',
    family: 'mci',
    iconName: 'nintendo-switch',
    color: '#E60012',
    keywords: ['nintendo', 'switch'],
  },
  {
    id: 'brand-epic',
    label: 'Epic Games / Fortnite',
    family: 'mci',
    iconName: 'controller-classic-outline',
    color: '#A855F7',
    keywords: ['epic games', 'fortnite', 'riot', 'valorant', 'lol'],
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
    keywords: ['apple', 'icloud', 'app store', 'apple music', 'apple tv'],
  },
  {
    id: 'brand-google',
    label: 'Google One',
    family: 'ion',
    iconName: 'logo-google',
    color: '#4285F4',
    keywords: ['google', 'drive'],
  },
  {
    id: 'brand-microsoft',
    label: 'Microsoft 365',
    family: 'ion',
    iconName: 'logo-microsoft',
    color: '#00A4EF',
    keywords: ['microsoft', 'office', 'onedrive'],
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
    id: 'brand-venmo',
    label: 'Venmo / CashApp / Zelle',
    family: 'ion',
    iconName: 'logo-venmo',
    color: '#008CFF',
    keywords: ['venmo', 'zelle', 'cashapp', 'cash app'],
  },
  {
    id: 'brand-uber',
    label: 'Uber / Lyft / DoorDash',
    family: 'mci',
    iconName: 'car-connected',
    color: '#10B981',
    keywords: ['uber', 'lyft', 'doordash', 'instacart'],
  },
  {
    id: 'brand-starbucks',
    label: 'Starbucks / Café',
    family: 'mci',
    iconName: 'coffee-outline',
    color: '#00704A',
    keywords: ['starbucks', 'dunkin', 'cafe', 'coffee'],
  },
  {
    id: 'brand-mcdonalds',
    label: 'Fast Food / Burger',
    family: 'mci',
    iconName: 'hamburger',
    color: '#F59E0B',
    keywords: ['mcdonald', 'wendy', 'burger king', 'chick-fil-a', 'chipotle', 'taco bell'],
  },
  {
    id: 'brand-walmart',
    label: 'Walmart / Target / Costco',
    family: 'mci',
    iconName: 'cart-variant',
    color: '#0284C7',
    keywords: ['walmart', 'target', 'costco', 'sam', 'whole foods', 'trader joe', 'aldi', 'publix', 'kroger'],
  },
  {
    id: 'brand-ai',
    label: 'ChatGPT / Claude / IA',
    family: 'mci',
    iconName: 'robot-outline',
    color: '#14B8A6',
    keywords: ['chatgpt', 'openai', 'claude', 'midjourney', 'copilot'],
  },
  {
    id: 'brand-disney',
    label: 'Disney+ / HBO / Hulu',
    family: 'mci',
    iconName: 'movie-open-play-outline',
    color: '#6366F1',
    keywords: ['disney', 'hbo', 'max', 'hulu', 'paramount', 'peacock', 'crunchyroll'],
  },
  {
    id: 'brand-crypto',
    label: 'Bitcoin / Cripto',
    family: 'ion',
    iconName: 'logo-bitcoin',
    color: '#F7931A',
    keywords: ['bitcoin', 'btc', 'crypto', 'coinbase', 'binance'],
  },
];

export const GENERAL_ICONS: { icon: string; label: string; group: string }[] = [
  // Marcas, Gaming y Suscripciones
  { icon: 'mci:netflix', label: 'Netflix', group: 'Marcas y Gaming' },
  { icon: 'mci:steam', label: 'Steam', group: 'Marcas y Gaming' },
  { icon: 'mci:spotify', label: 'Spotify', group: 'Marcas y Gaming' },
  { icon: 'mci:youtube', label: 'YouTube', group: 'Marcas y Gaming' },
  { icon: 'mci:sony-playstation', label: 'PlayStation', group: 'Marcas y Gaming' },
  { icon: 'mci:microsoft-xbox', label: 'Xbox', group: 'Marcas y Gaming' },
  { icon: 'mci:nintendo-switch', label: 'Nintendo', group: 'Marcas y Gaming' },
  { icon: 'mci:controller-classic-outline', label: ' Control / Juegos', group: 'Marcas y Gaming' },
  { icon: 'logo-amazon', label: 'Amazon', group: 'Marcas y Gaming' },
  { icon: 'logo-apple', label: 'Apple', group: 'Marcas y Gaming' },
  { icon: 'logo-google', label: 'Google', group: 'Marcas y Gaming' },
  { icon: 'logo-microsoft', label: 'Microsoft', group: 'Marcas y Gaming' },
  { icon: 'logo-twitch', label: 'Twitch', group: 'Marcas y Gaming' },
  { icon: 'logo-discord', label: 'Discord', group: 'Marcas y Gaming' },
  { icon: 'mci:robot-outline', label: 'ChatGPT / IA', group: 'Marcas y Gaming' },
  { icon: 'mci:movie-open-play-outline', label: 'Cine / Disney+ / HBO', group: 'Marcas y Gaming' },
  { icon: 'mci:music-circle-outline', label: 'Música / Audio', group: 'Marcas y Gaming' },
  { icon: 'mci:cloud-outline', label: 'Nube / Hosting', group: 'Marcas y Gaming' },

  // Comida, Supermercado y Salidas
  { icon: 'cart-outline', label: 'Supermercado', group: 'Comida y Compras' },
  { icon: 'mci:cart-variant', label: 'Walmart / Costco', group: 'Comida y Compras' },
  { icon: 'restaurant-outline', label: 'Restaurante', group: 'Comida y Compras' },
  { icon: 'mci:hamburger', label: 'Hamburguesa / FastFood', group: 'Comida y Compras' },
  { icon: 'pizza-outline', label: 'Pizza', group: 'Comida y Compras' },
  { icon: 'mci:taco', label: 'Tacos / Mexicana', group: 'Comida y Compras' },
  { icon: 'mci:coffee-outline', label: 'Starbucks / Café', group: 'Comida y Compras' },
  { icon: 'beer-outline', label: 'Bar / Bebidas', group: 'Comida y Compras' },
  { icon: 'ice-cream-outline', label: 'Postres / Helado', group: 'Comida y Compras' },
  { icon: 'bag-handle-outline', label: 'Compras / Mall', group: 'Comida y Compras' },
  { icon: 'shirt-outline', label: 'Ropa / Zapatos', group: 'Comida y Compras' },
  { icon: 'gift-outline', label: 'Regalos', group: 'Comida y Compras' },

  // Hogar, Renta y Servicios
  { icon: 'home-outline', label: 'Casa / Renta', group: 'Hogar y Servicios' },
  { icon: 'flash-outline', label: 'Electricidad / Luz', group: 'Hogar y Servicios' },
  { icon: 'water-outline', label: 'Agua', group: 'Hogar y Servicios' },
  { icon: 'flame-outline', label: 'Gas / Calefacción', group: 'Hogar y Servicios' },
  { icon: 'wifi-outline', label: 'Internet / Wi-Fi', group: 'Hogar y Servicios' },
  { icon: 'phone-portrait-outline', label: 'Celular / Línea', group: 'Hogar y Servicios' },
  { icon: 'tv-outline', label: 'TV / Cable', group: 'Hogar y Servicios' },
  { icon: 'construct-outline', label: 'Reparaciones', group: 'Hogar y Servicios' },
  { icon: 'mci:washing-machine', label: 'Lavandería', group: 'Hogar y Servicios' },
  { icon: 'bed-outline', label: 'Muebles / Hogar', group: 'Hogar y Servicios' },

  // Transporte y Viajes
  { icon: 'car-outline', label: 'Auto / Cuota', group: 'Transporte y Viajes' },
  { icon: 'mci:gas-station-outline', label: 'Gasolina', group: 'Transporte y Viajes' },
  { icon: 'mci:car-connected', label: 'Uber / Lyft', group: 'Transporte y Viajes' },
  { icon: 'mci:car-wrench', label: 'Taller / Mecánico', group: 'Transporte y Viajes' },
  { icon: 'mci:parking', label: 'Parking / Peaje', group: 'Transporte y Viajes' },
  { icon: 'bus-outline', label: 'Bus / Metro / Tren', group: 'Transporte y Viajes' },
  { icon: 'airplane-outline', label: 'Vuelos / Avión', group: 'Transporte y Viajes' },
  { icon: 'mci:bed-king-outline', label: 'Hotel / Airbnb', group: 'Transporte y Viajes' },

  // Salud, Deporte y Vida Personal
  { icon: 'fitness-outline', label: 'Gimnasio / Deporte', group: 'Salud y Personal' },
  { icon: 'medkit-outline', label: 'Médico / Hospital', group: 'Salud y Personal' },
  { icon: 'mci:pill', label: 'Farmacia / CVS', group: 'Salud y Personal' },
  { icon: 'mci:tooth-outline', label: 'Dentista', group: 'Salud y Personal' },
  { icon: 'cut-outline', label: 'Barbería / Salón', group: 'Salud y Personal' },
  { icon: 'paw-outline', label: 'Mascota / Vet', group: 'Salud y Personal' },
  { icon: 'school-outline', label: 'Educación / Cursos', group: 'Salud y Personal' },
  { icon: 'book-outline', label: 'Libros', group: 'Salud y Personal' },

  // Finanzas, Bancos e Ingresos
  { icon: 'cash-outline', label: 'Sueldo / Efectivo', group: 'Finanzas e Ingresos' },
  { icon: 'briefcase-outline', label: 'Trabajo / Negocio', group: 'Finanzas e Ingresos' },
  { icon: 'card-outline', label: 'Tarjeta / Comisión', group: 'Finanzas e Ingresos' },
  { icon: 'logo-paypal', label: 'PayPal', group: 'Finanzas e Ingresos' },
  { icon: 'logo-venmo', label: 'Venmo / Zelle', group: 'Finanzas e Ingresos' },
  { icon: 'logo-bitcoin', label: 'Bitcoin / Cripto', group: 'Finanzas e Ingresos' },
  { icon: 'trending-up-outline', label: 'Inversiones / Bolsa', group: 'Finanzas e Ingresos' },
  { icon: 'shield-checkmark-outline', label: 'Seguro (Auto/Salud)', group: 'Finanzas e Ingresos' },
  { icon: 'document-text-outline', label: 'Impuestos / IRS', group: 'Finanzas e Ingresos' },
  { icon: 'mci:piggy-bank-outline', label: 'Ahorros / Meta', group: 'Finanzas e Ingresos' },
];

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
