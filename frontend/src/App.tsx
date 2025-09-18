import { useState } from 'react'
import { WordList } from './components/WordList'
import { VotingMode } from './components/VotingMode'
import { WordSuggestion } from './components/WordSuggestion'
import { SearchMode } from './components/SearchMode'

type AppMode = 'list' | 'voting' | 'suggest' | 'search'

function App() {
  const [mode, setMode] = useState<AppMode>('list')

  const handleBackToList = () => {
    setMode('list')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 mb-2 sm:mb-3 tracking-tight">
            Phictionary
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-md mx-auto px-4">
            Contribute to the best collection of words the world has ever seen
          </p>
        </header>

        <nav className="flex justify-center mb-6 sm:mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full max-w-md sm:w-auto">
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-center gap-1">
              <button
                onClick={() => setMode('list')}
                className={`px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-base ${
                  mode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Rankings
              </button>
              <button
                onClick={() => setMode('voting')}
                className={`px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-base ${
                  mode === 'voting'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Vote
              </button>
              <button
                onClick={() => setMode('suggest')}
                className={`px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-base ${
                  mode === 'suggest'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Suggest
              </button>
              <button
                onClick={() => setMode('search')}
                className={`px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-base ${
                  mode === 'search'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Search
              </button>
            </div>
          </div>
        </nav>

        <main className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {mode === 'list' ? (
            <WordList />
          ) : mode === 'voting' ? (
            <VotingMode onBack={handleBackToList} />
          ) : mode === 'search' ? (
            <SearchMode onBack={handleBackToList} />
          ) : (
            <WordSuggestion />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
