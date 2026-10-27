import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <RouterProvider
        router={router}
        fallbackElement={
          <div className="flex min-h-screen items-center justify-center bg-white text-gray-700">
            পেজ লোড হচ্ছে...
          </div>
        }
      />
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        duration={4000}
      />
    </>
  );
}