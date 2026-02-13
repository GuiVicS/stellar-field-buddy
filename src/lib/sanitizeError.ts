/**
 * Sanitizes error messages to prevent leaking internal implementation details
 * (table names, constraint names, etc.) to end users.
 */
export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');

  // Log full error for debugging (only visible in dev tools / server logs)
  console.error('[APP_ERROR]', error);

  // Map common Supabase / Postgres patterns to safe messages
  if (message.includes('duplicate key')) return 'Este registro já existe.';
  if (message.includes('foreign key')) return 'Não foi possível completar a operação. Registro relacionado não encontrado.';
  if (message.includes('violates')) return 'Os dados fornecidos são inválidos.';
  if (message.includes('permission denied') || message.includes('row-level security'))
    return 'Você não tem permissão para esta ação.';
  if (message.includes('JWT') || message.includes('token'))
    return 'Sua sessão expirou. Faça login novamente.';
  if (message.includes('Failed to fetch') || message.includes('NetworkError'))
    return 'Erro de conexão. Verifique sua internet.';
  if (message.includes('User already registered'))
    return 'Este e-mail já está cadastrado.';
  if (message.includes('Invalid login credentials'))
    return 'E-mail ou senha inválidos.';
  if (message.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de fazer login.';

  return 'Ocorreu um erro. Tente novamente.';
}
