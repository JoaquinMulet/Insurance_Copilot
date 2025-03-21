// pages/_app.js
import '../styles/global.css'; // Ajusta la ruta según tu estructura
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '../components/ui/toaster.jsx';

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          // Ocultar elementos de branding
          footerAction: "hidden",
          footer: "hidden",
          logoBox: "hidden",
          logoImage: "hidden",
          powerButton: "hidden",
          badge: "hidden",
          
          // Personalización para coincidir con tu estilo
          formButtonPrimary: "bg-slate-800 hover:bg-slate-700",
          card: "shadow-none",
          formFieldInput: "border-slate-300 focus:border-slate-500 focus:ring-slate-500",
          formFieldLabel: "text-slate-700",
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-500"
        }
      }}
    >
      <Component {...pageProps} />
      <Toaster />
    </ClerkProvider>
  );
}

export default MyApp;