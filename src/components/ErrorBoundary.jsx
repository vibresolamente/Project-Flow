import React from 'react';
import { ShieldAlert, RefreshCw, ChevronRight } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center bg-slate-950 text-slate-100 rounded-xl border border-red-500/30 shadow-2xl max-w-2xl mx-auto my-12 animate-fade-in font-sans relative overflow-hidden">
          {/* Glassmorphic decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="h-16 w-16 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-500 mb-6 shadow-inner animate-pulse">
            <ShieldAlert size={36} />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-red-400 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Security Isolation & Component Fault
          </h2>
          
          <p className="text-slate-400 text-sm md:text-base max-w-md mb-6 leading-relaxed">
            The system intercepted an unhandled exception within this node. Standard isolation protocols have locked the viewport to prevent dashboard degradation.
          </p>

          {this.state.error && (
            <div className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg p-4 mb-8 font-mono text-xs text-red-400 overflow-x-auto max-h-48 scrollbar-thin">
              <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-1">Fault Diagnostic Log</div>
              <div className="font-semibold text-slate-300">{this.state.error.toString()}</div>
              {this.state.errorInfo && (
                <pre className="mt-2 text-[10px] text-slate-400 leading-normal">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
            <button 
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg transition-all active:scale-95 duration-150"
            >
              <RefreshCw size={16} /> Reinitialize Module
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 duration-150"
            >
              System Home <ChevronRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
