import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, CheckCircle, Share, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-2xl brand-gradient mx-auto flex items-center justify-center shadow-lg">
          <Printer className="w-10 h-10 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Instalar Stellar Print</h1>
          <p className="text-muted-foreground">
            Instale o app no seu celular para acesso rápido, mesmo offline.
          </p>
        </div>

        {isInstalled ? (
          <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted/50">
            <CheckCircle className="w-12 h-12 text-accent" />
            <p className="font-semibold text-lg">App já instalado!</p>
            <p className="text-sm text-muted-foreground">Abra pela tela inicial do seu dispositivo.</p>
          </div>
        ) : isIOS ? (
          <div className="space-y-4 p-6 rounded-xl bg-muted/50 text-left">
            <p className="font-semibold text-center">Como instalar no iPhone/iPad:</p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3 items-start">
                <span className="font-bold text-foreground shrink-0">1.</span>
                <span>Toque no ícone <Share className="w-4 h-4 inline text-foreground" /> <strong className="text-foreground">Compartilhar</strong> na barra do Safari</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="font-bold text-foreground shrink-0">2.</span>
                <span>Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong></span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="font-bold text-foreground shrink-0">3.</span>
                <span>Toque em <strong className="text-foreground">"Adicionar"</strong> para confirmar</span>
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full h-12 brand-gradient text-primary-foreground font-semibold text-base">
            <Download className="w-5 h-5 mr-2" />
            Instalar Agora
          </Button>
        ) : (
          <div className="space-y-4 p-6 rounded-xl bg-muted/50 text-left">
            <p className="font-semibold text-center">Como instalar:</p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3 items-start">
                <span className="font-bold text-foreground shrink-0">1.</span>
                <span>Abra o menu do navegador (⋮ três pontos)</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="font-bold text-foreground shrink-0">2.</span>
                <span>Toque em <strong className="text-foreground">"Instalar app"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong></span>
              </li>
            </ol>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { icon: '⚡', label: 'Rápido' },
            { icon: '📱', label: 'Offline' },
            { icon: '🔔', label: 'Notificações' },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs text-muted-foreground">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
