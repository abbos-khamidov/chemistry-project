import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { I18nProvider } from './i18n/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { WarehouseProvider } from './context/WarehouseContext';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <WarehouseProvider>
          <RouterProvider router={router} />
        </WarehouseProvider>
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton />
    </I18nProvider>
  );
}
