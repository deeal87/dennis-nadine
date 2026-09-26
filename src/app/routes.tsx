import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { PATHS } from './paths';

// Home is part of the main bundle for an instant first paint; everything else loads on demand.
import HomePage from '@/features/home/HomePage';
const AnimePage = lazy(() => import('@/features/anime/AnimePage'));
const RecipesPage = lazy(() => import('@/features/recipes/RecipesPage'));
const RecipeDetailPage = lazy(() => import('@/features/recipes/RecipeDetailPage'));
const DatesPage = lazy(() => import('@/features/dates/DatesPage'));
const FunkosPage = lazy(() => import('@/features/funkos/FunkosPage'));
const LegoPage = lazy(() => import('@/features/lego/LegoPage'));
const MemoriesPage = lazy(() => import('@/features/memories/MemoriesPage'));
const TimelinePage = lazy(() => import('@/features/timeline/TimelinePage'));
const BucketListPage = lazy(() => import('@/features/bucket-list/BucketListPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={PATHS.anime} element={<AnimePage />} />
        <Route path={PATHS.recipes} element={<RecipesPage />} />
        <Route path={`${PATHS.recipes}/:id`} element={<RecipeDetailPage />} />
        <Route path={PATHS.dates} element={<DatesPage />} />
        <Route path={PATHS.funkos} element={<FunkosPage />} />
        <Route path={PATHS.lego} element={<LegoPage />} />
        <Route path={PATHS.memories} element={<MemoriesPage />} />
        <Route path={PATHS.timeline} element={<TimelinePage />} />
        <Route path={PATHS.bucket} element={<BucketListPage />} />
        <Route path={PATHS.settings} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
