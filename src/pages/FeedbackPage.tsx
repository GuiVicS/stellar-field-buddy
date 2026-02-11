import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const FeedbackPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  const [osInfo, setOsInfo] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) { setError('Link inválido'); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from('feedback')
        .select('*, os:service_orders(code, customer:customers(name))')
        .eq('token', token)
        .maybeSingle();
      if (err || !data) { setError('Pesquisa não encontrada'); setLoading(false); return; }
      if (data.submitted_at) { setSubmitted(true); setRating(data.rating || 0); setComment(data.comment || ''); }
      setFeedback(data);
      setOsInfo(data.os);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const { error: err } = await supabase
      .from('feedback')
      .update({ rating, comment: comment.trim().slice(0, 1000), submitted_at: new Date().toISOString() })
      .eq('token', token!);
    if (err) { setError('Erro ao enviar. Tente novamente.'); setSubmitting(false); return; }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error && !feedback) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Link inválido</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Obrigado pelo seu feedback!</h1>
        <p className="text-muted-foreground text-sm">
          Sua avaliação nos ajuda a melhorar nossos serviços.
        </p>
        <div className="flex justify-center gap-1 mt-4">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={cn("w-7 h-7", s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30")} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Pesquisa de Satisfação</h1>
          {osInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              Ordem de Serviço: <span className="font-medium">{osInfo.code}</span>
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Como você avalia o nosso atendimento?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={cn(
                    "w-10 h-10 transition-colors",
                    s <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"
                  )} />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
              <span>Péssimo</span>
              <span>Excelente</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Deixe um comentário (opcional)
            </p>
            <Textarea
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={1000}
              className="min-h-[100px] text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full h-12 brand-gradient text-primary-foreground font-semibold"
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
