import { BedDouble, Dumbbell, Scissors, ShoppingBag, Stethoscope, Store, Utensils, Coffee, Car, Plane, GraduationCap, Sparkles, ShoppingCart, Fuel, Umbrella, HeartPulse, Wallet } from 'lucide-react';
import Icon from '../ui/Icon';

/** Maps the admin-chosen category icon key to a lucide glyph. */
export const CATEGORY_ICONS = {
  'bed-double': BedDouble,
  scissors: Scissors,
  'shopping-bag': ShoppingBag,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  plane: Plane,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
  'shopping-cart': ShoppingCart,
  fuel: Fuel,
  umbrella: Umbrella,
  'heart-pulse': HeartPulse,
  wallet: Wallet,
  store: Store,
};

export default function CategoryIcon({ name, ...props }) {
  return <Icon icon={CATEGORY_ICONS[name] || Store} {...props} />;
}
