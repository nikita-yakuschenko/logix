import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar07Shell } from '@/components/sidebar-07-shell'
import { QuoteNewPage } from '@/pages/quote-new-page'
import { QuoteDetailPage } from '@/pages/quote-detail-page'
import { QuotesListPage } from '@/pages/quotes-list-page'
import { SettingsPage } from '@/pages/settings-page'
import { SettingsProvider } from '@/settings/settings-context'

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Sidebar07Shell />}>
            <Route index element={<QuotesListPage />} />
            <Route path="quotes/new" element={<QuoteNewPage />} />
            <Route path="quotes/:id" element={<QuoteDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}
