import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { PrimaryButton } from './FormControls';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Filet de sécurité global : sans lui, une erreur de rendu — par exemple un
 * fragment de page mis en cache par le service worker qui ne correspond plus
 * à la version déployée après une mise à jour — démonte tout l'arbre React et
 * laisse un fond uni vide, sans aucun moyen de continuer autrement qu'en
 * tuant l'application. On propose ici un rechargement en un geste.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur applicative interceptée :', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-coral/15 text-accent-coral">
            <RefreshCw className="size-6" />
          </span>
          <div>
            <h1 className="text-base font-semibold">Un problème est survenu</h1>
            <p className="mt-1 max-w-xs text-sm text-base-300">
              L’application n’a pas pu afficher cette page — une nouvelle version est peut-être disponible. Recharge l’application pour continuer.
            </p>
          </div>
          <PrimaryButton type="button" onClick={this.handleReload}>
            <RefreshCw className="size-4" /> Recharger l’application
          </PrimaryButton>
        </div>
      );
    }
    return this.props.children;
  }
}
