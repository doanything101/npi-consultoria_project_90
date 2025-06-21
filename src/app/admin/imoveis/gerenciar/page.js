// src/app/admin/imoveis/gerenciar/page.js
// Este é agora um Server Component que importa dinamicamente o Client Component
import dynamic from 'next/dynamic';

// Importa o Client Component dinamicamente, desabilitando SSR
const GerenciarImovelClient = dynamic(
  () => import('./GerenciarImovelClient'),
  { ssr: false } // MUITO IMPORTANTE: Garante que este componente só roda no cliente
);

export default function GerenciarImovel() {
  // Este componente Server agora apenas renderiza o Client Component
  // Nenhuma lógica de estado ou hooks do React aqui, para evitar problemas de SSR
  return <GerenciarImovelClient />;
}
