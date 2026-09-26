import { BookHeart, Blocks, CalendarHeart, ChefHat, Clapperboard, Gift, House, Images, ListChecks, Settings, type LucideIcon } from 'lucide-react';
import { PATHS } from '@/app/paths';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  emoji: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_HOME: NavItem = { to: PATHS.home, label: 'Home', icon: House, emoji: '🏠' };
export const NAV_TIMELINE: NavItem = { to: PATHS.timeline, label: 'Timeline', icon: BookHeart, emoji: '💞' };
export const NAV_BUCKET: NavItem = { to: PATHS.bucket, label: 'Bucket List', icon: ListChecks, emoji: '🌠' };
export const NAV_ANIME: NavItem = { to: PATHS.anime, label: 'Anime', icon: Clapperboard, emoji: '🎬' };
export const NAV_RECIPES: NavItem = { to: PATHS.recipes, label: 'Rezepte', icon: ChefHat, emoji: '🍜' };
export const NAV_DATES: NavItem = { to: PATHS.dates, label: 'Dates', icon: CalendarHeart, emoji: '📍' };
export const NAV_FUNKOS: NavItem = { to: PATHS.funkos, label: 'Funko Pops', icon: Gift, emoji: '🎁' };
export const NAV_LEGO: NavItem = { to: PATHS.lego, label: 'LEGO', icon: Blocks, emoji: '🧱' };
export const NAV_MEMORIES: NavItem = { to: PATHS.memories, label: 'Memories', icon: Images, emoji: '📸' };
export const NAV_SETTINGS: NavItem = { to: PATHS.settings, label: 'Einstellungen', icon: Settings, emoji: '⚙️' };

export const NAV_GROUPS: NavGroup[] = [
  { items: [NAV_HOME] },
  { label: '❤️ Unsere Welt', items: [NAV_TIMELINE, NAV_BUCKET] },
  { label: 'Zusammen', items: [NAV_ANIME, NAV_RECIPES, NAV_DATES] },
  { label: 'Sammlungen', items: [NAV_FUNKOS, NAV_LEGO, NAV_MEMORIES] },
];

/** Mobile bottom bar – the rest lives behind "Mehr". */
export const MOBILE_PRIMARY: NavItem[] = [NAV_HOME, NAV_ANIME, NAV_DATES, NAV_RECIPES];
export const MOBILE_MORE: NavItem[] = [NAV_TIMELINE, NAV_BUCKET, NAV_FUNKOS, NAV_LEGO, NAV_MEMORIES, NAV_SETTINGS];
