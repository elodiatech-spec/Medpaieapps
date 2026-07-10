import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Erreur non gérée', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-base font-medium text-slate-800">Une erreur est survenue</p>
          <p className="max-w-sm text-sm text-slate-600">{this.state.error.message}</p>
          <button
            onClick={() => window.location.assign('/')}
            className="rounded-lg bg-brand-600 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Retour à l'accueil
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
