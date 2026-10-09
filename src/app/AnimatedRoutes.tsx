import { Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { TOOLS } from '../tools/registry';
import { NotFound } from './NotFound';
import { RouteFallback } from './RouteFallback';

/**
 * Routes with a quick fade/rise on enter. Uses a CSS keyframe (re-run by keying on the
 * pathname) rather than a JS-driven animation so a page can never get stuck invisible.
 */
export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="h-full animate-enter">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route index element={<Dashboard />} />
          {TOOLS.map((tool) => (
            <Route key={tool.id} path={tool.path} element={<tool.component />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}
