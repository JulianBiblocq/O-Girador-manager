import React from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary a intercepté une erreur :", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-cordel-bg-light text-encre-noire font-sans select-none">
          <CordelCard variant="ocre" useExtremeBorder={true} className="max-w-md w-full p-6 text-center flex flex-col gap-4">
            <span className="text-3xl animate-bounce">⚠️</span>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-cordel-wood">
              Oups, un problème est survenu
            </h3>
            <p className="text-xs leading-relaxed font-semibold opacity-85">
              Une erreur inattendue est survenue lors du rendu de cette page. Pas de panique, vos données Firebase sont en sécurité !
            </p>
            {this.state.error?.message && (
              <div className="p-2 bg-black/10 dark:bg-white/10 rounded font-mono text-[9px] text-left overflow-x-auto select-text">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2.5 justify-center mt-2">
              <CordelButton 
                variant="default" 
                onClick={this.handleReload}
                useExtremeBorder={true}
                className="text-xs font-black uppercase tracking-wider"
              >
                🔄 Recharger la page
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      );
    }

    return this.props.children;
  }
}
