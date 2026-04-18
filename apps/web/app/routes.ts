import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  layout('routes/_shell.tsx', [
    index('routes/_index.tsx'),
    route('quotes/new', 'routes/quotes.new.tsx'),
    route('quotes/:id', 'routes/quotes.$id.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('*', 'routes/_catchall.tsx'),
  ]),
] satisfies RouteConfig
