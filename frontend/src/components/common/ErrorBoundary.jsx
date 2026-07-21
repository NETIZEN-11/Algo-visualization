import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {

    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })

    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white p-6"
      >
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            An unexpected error broke this view. Your data is safe — reloading
            will take you back to the dashboard.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
