import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Eraser, Maximize2, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  initialValue?: string | null;
  disabled?: boolean;
}

const useSignatureCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  disabled: boolean,
  onDone?: (dataUrl: string) => void
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = 'hsl(var(--foreground))';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, [canvasRef]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      onDone?.(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * window.devicePixelRatio, rect.height * window.devicePixelRatio);
    setHasSignature(false);
  };

  const initCanvas = useCallback((initialValue?: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = initialValue;
    }
  }, [canvasRef]);

  return { isDrawing, hasSignature, setHasSignature, startDraw, draw, endDraw, clear, initCanvas };
};

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange, initialValue, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const main = useSignatureCanvas(canvasRef, !!disabled, (dataUrl) => {
    onSignatureChange?.(dataUrl);
  });

  const fs = useSignatureCanvas(fullscreenCanvasRef, false, () => {});

  useEffect(() => {
    main.initCanvas(initialValue);
  }, [initialValue]);

  // Init fullscreen canvas when dialog opens
  useEffect(() => {
    if (fullscreen) {
      // Small delay to let the dialog render
      const timer = setTimeout(() => {
        fs.initCanvas(initialValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fullscreen]);

  const handleFullscreenConfirm = () => {
    const canvas = fullscreenCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange?.(dataUrl);
      // Redraw main canvas with the fullscreen result
      const mainCanvas = canvasRef.current;
      if (mainCanvas) {
        const ctx = mainCanvas.getContext('2d');
        const rect = mainCanvas.getBoundingClientRect();
        if (ctx) {
          ctx.clearRect(0, 0, rect.width * window.devicePixelRatio, rect.height * window.devicePixelRatio);
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            main.setHasSignature(true);
          };
          img.src = dataUrl;
        }
      }
    }
    setFullscreen(false);
  };

  const handleClear = () => {
    main.clear();
    onSignatureChange?.(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none cursor-crosshair"
          onMouseDown={main.startDraw}
          onMouseMove={main.draw}
          onMouseUp={main.endDraw}
          onMouseLeave={main.endDraw}
          onTouchStart={main.startDraw}
          onTouchMove={main.draw}
          onTouchEnd={main.endDraw}
        />
        {!main.hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/40">
            <p className="text-xs">Desenhe a assinatura aqui</p>
          </div>
        )}
        {!disabled && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Tela cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {main.hasSignature && !disabled && (
        <Button variant="outline" size="sm" onClick={handleClear} className="text-xs">
          <Eraser className="w-3.5 h-3.5 mr-1" /> Limpar assinatura
        </Button>
      )}

      {/* Fullscreen Signature Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 rounded-none border-none [&>button]:hidden">
          <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Assinatura do Cliente</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { fs.clear(); }} className="text-xs">
                  <Eraser className="w-3.5 h-3.5 mr-1" /> Limpar
                </Button>
                <Button size="sm" onClick={handleFullscreenConfirm} className="text-xs brand-gradient text-primary-foreground">
                  <Check className="w-3.5 h-3.5 mr-1" /> Confirmar
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <canvas
                ref={fullscreenCanvasRef}
                className="w-full h-full touch-none cursor-crosshair"
                onMouseDown={fs.startDraw}
                onMouseMove={fs.draw}
                onMouseUp={fs.endDraw}
                onMouseLeave={fs.endDraw}
                onTouchStart={fs.startDraw}
                onTouchMove={fs.draw}
                onTouchEnd={fs.endDraw}
              />
              {!fs.hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/20">
                  <p className="text-lg">Desenhe a assinatura aqui</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignaturePad;