import '../styles/global.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '../components/ui/toaster.jsx';

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
      <Toaster />
    </ClerkProvider>
  );
}

export default MyApp;