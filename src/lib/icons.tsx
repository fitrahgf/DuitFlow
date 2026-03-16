import React from 'react';
import {
  TrendingUp, ShoppingBag, Utensils, Coffee, Car,
  ReceiptText, Home, Zap, Smartphone, FolderKanban,
  Gift, Bell, HelpCircle
} from 'lucide-react';

const iconMap = {
  shopping: ShoppingBag,
  food: Utensils,
  coffee: Coffee,
  transport: Car,
  bill: ReceiptText,
  home: Home,
  electricity: Zap,
  phone: Smartphone,
  game: Bell,
  health: HelpCircle,
  flight: FolderKanban,
  gift: Gift,
  income: TrendingUp,
  expense: ReceiptText,
} as const;

type IconKey = keyof typeof iconMap;

export const getCategoryIcon = (
  categoryName: string | undefined,
  type: string,
  size = 18,
  iconKey?: string
) => {
  if (type === 'income') return <TrendingUp size={size} />;
  if (iconKey && iconKey in iconMap) {
    const Icon = iconMap[iconKey as IconKey];
    return <Icon size={size} />;
  }
  if (!categoryName) return <ShoppingBag size={size} />;
  
  const name = categoryName.toLowerCase();
  if (name.includes('food') || name.includes('makan')) return <Utensils size={size} />;
  if (name.includes('coffee') || name.includes('kopi')) return <Coffee size={size} />;
  if (name.includes('transport') || name.includes('bensin')) return <Car size={size} />;
  if (name.includes('bill') || name.includes('tagihan')) return <ReceiptText size={size} />;
  if (name.includes('home') || name.includes('rumah')) return <Home size={size} />;
  if (name.includes('electricity') || name.includes('listrik')) return <Zap size={size} />;
  if (name.includes('phone') || name.includes('pulsa')) return <Smartphone size={size} />;
  
  return <ShoppingBag size={size} />;
};
