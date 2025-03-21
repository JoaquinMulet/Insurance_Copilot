// pages/signin/[...index].js
import { SignIn } from "@clerk/nextjs"; 
import Head from 'next/head'; 
import { Shield } from 'lucide-react';  

export default function SignInPage() {   
  return (     
    <div className="min-h-screen flex flex-col bg-slate-50">       
      <Head>         
        <title>Iniciar Sesión | Insurance Copilot</title>         
        <meta name="description" content="Iniciar sesión en Insurance Copilot" />       
      </Head>        
      
      {/* Header */}       
      <header className="w-full bg-slate-800 text-white shadow-md">         
        <div className="container mx-auto py-4 px-6">           
          <div className="flex items-center">             
            <div className="bg-slate-700 p-2 rounded mr-3">               
              <Shield className="w-5 h-5 text-slate-200" />             
            </div>             
            <div>               
              <h1 className="text-xl font-medium tracking-tight">Insurance Copilot</h1>             
            </div>           
          </div>         
        </div>       
      </header>        
      
      <main className="flex-grow flex items-center justify-center p-6">         
        <div className="mx-auto w-full max-w-md">           
          <SignIn             
            routing="path"             
            path="/signin"             
            signUpUrl="/signup"             
            redirectUrl="/"
            appearance={{
              layout: {
                logoPlacement: "none",
                showOptionalFields: true,
                socialButtonsPlacement: "bottom"
              },
              elements: {
                // Ocultar todos los mensajes de Clerk
                footerAction: "hidden",
                footer: "hidden",
                logoBox: "hidden",
                logoImage: "hidden",
                
                // Ocultar "Secured by" y "Development mode"
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
          />         
        </div>       
      </main>        
      
      {/* Footer */}       
      <footer className="border-t border-slate-200 bg-white">         
        <div className="container mx-auto py-3 px-6">           
          <div className="flex flex-col md:flex-row justify-between items-center">             
            <div className="flex items-center mb-2 md:mb-0">               
              <Shield className="w-4 h-4 text-slate-400 mr-2" />               
              <span className="text-xs md:text-sm text-slate-600">Insurance Copilot</span>             
            </div>             
            <div className="flex space-x-4 text-xs text-slate-500">               
              <a href="#" className="hover:text-slate-800">Soporte</a>               
              <a href="#" className="hover:text-slate-800">Privacidad</a>               
              <a href="#" className="hover:text-slate-800">Términos</a>               
              <span>&copy; {new Date().getFullYear()}</span>             
            </div>           
          </div>         
        </div>       
      </footer>     
    </div>
  ); 
}