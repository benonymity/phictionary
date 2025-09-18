import { useState } from 'react'
import { Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { PhictionaryAPI } from '../api/client'

export function WordSuggestion() {
  const [word, setWord] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!word.trim()) {
      setError('Please enter a word')
      return
    }

    if (word.length > 25) {
      setError('Word is too long (maximum 25 characters)')
      return
    }

    if (!word.includes('ph')) {
      setError('Word must contain "ph"')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const trimmedWord = word.trim()
      const result = await PhictionaryAPI.addWord({ new_word: trimmedWord })
      
      // Automatically upvote the newly added word
      try {
        await PhictionaryAPI.upvoteWord({ target: trimmedWord })
        setSuccess(`${result} and automatically upvoted!`)
      } catch (upvoteErr) {
        // If upvote fails, still show success for adding the word
        console.warn('Failed to auto-upvote word:', upvoteErr)
        setSuccess(`${result} (Note: Auto-upvote failed)`)
      }
      
      setWord('')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add word')
    } finally {
      setLoading(false)
    }
  }

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z\s]/g, '')
    setWord(value)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="text-left mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Suggest</h2>
      </div>

      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="word" className="block text-sm font-semibold text-slate-700 mb-2">
              Word
            </label>
            <input
              id="word"
              type="text"
              value={word}
              onChange={handleWordChange}
              placeholder="Enter a word with 'ph' (max 25 characters)"
              maxLength={25}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-medium"
              disabled={loading}
            />
            <div className="mt-1 text-sm text-slate-500">
              {word.length}/25 characters
            </div>
          </div>

          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
              <span className="text-emerald-700 font-medium">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !word.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold text-base sm:text-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                Adding Word...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-3" />
                Suggest Word
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold text-slate-700 mb-2">Guidelines:</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Words must be 25 characters or less</li>
            <li>• Only letters and spaces are allowed (no numbers or symbols)</li>
            <li>• Word must contain "ph"</li>
            <li>• Duplicate words will be ignored</li>
            <li>• Words will be added to the collection for voting</li>
            <li>• Your suggested word will be automatically upvoted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
