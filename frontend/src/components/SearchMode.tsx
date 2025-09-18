import { useState } from 'react'
import { Search, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react'
import { PhictionaryAPI, type SearchWord } from '../api/client'

interface SearchModeProps {
  onBack: () => void
}

export function SearchMode({}: SearchModeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchWord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [votingWords, setVotingWords] = useState<Set<string>>(new Set())

  // Voting persistence using localStorage
  const VOTED_WORDS_KEY = 'phictionary_voted_words'
  
  const getVotedWords = (): Set<string> => {
    try {
      const votedWords = localStorage.getItem(VOTED_WORDS_KEY)
      return votedWords ? new Set(JSON.parse(votedWords)) : new Set()
    } catch (error) {
      console.error('Error reading voted words from localStorage:', error)
      return new Set()
    }
  }

  const markWordAsVoted = (word: string) => {
    try {
      const votedWords = getVotedWords()
      votedWords.add(word)
      localStorage.setItem(VOTED_WORDS_KEY, JSON.stringify([...votedWords]))
    } catch (error) {
      console.error('Error saving voted word to localStorage:', error)
    }
  }

  const hasUserVotedOnWord = (word: string): boolean => {
    return getVotedWords().has(word)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setHasSearched(true)
      
      const results = await PhictionaryAPI.searchWords({
        query: searchQuery.trim(),
        limit_count: 20
      })
      
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search words')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleVote = async (word: string, action: 'upvote' | 'downvote') => {
    // Check if user has already voted on this word
    if (hasUserVotedOnWord(word)) {
      console.log(`User has already voted on "${word}"`)
      return
    }

    // Check if currently voting on this word
    if (votingWords.has(word)) return

    try {
      setVotingWords(prev => new Set(prev).add(word))
      
      if (action === 'upvote') {
        await PhictionaryAPI.upvoteWord({ target: word })
      } else {
        await PhictionaryAPI.downvoteWord({ target: word })
      }
      
      // Mark word as voted in localStorage
      markWordAsVoted(word)
      
      // Update the word's score optimistically
      setSearchResults(prev => prev.map(w => 
        w.word === word ? {
          ...w,
          upvotes: action === 'upvote' ? w.upvotes + 1 : w.upvotes,
          downvotes: action === 'downvote' ? w.downvotes + 1 : w.downvotes,
          score: action === 'upvote' ? w.score + 1 : w.score - 1
        } : w
      ))
      
    } catch (err) {
      console.error(`Failed to ${action} word:`, err)
    } finally {
      setVotingWords(prev => {
        const newSet = new Set(prev)
        newSet.delete(word)
        return newSet
      })
    }
  }

  const formatSimilarity = (similarity: number): string => {
    return `${Math.round(similarity * 100)}%`
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Search</h2>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a word to search for..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 font-medium">Error: {error}</div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  Search Results for "{searchQuery}" ({searchResults.length} found)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Word
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Similarity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Upvotes
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Downvotes
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Vote
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {searchResults.map((word, index) => (
                      <tr key={`${word.word}-${index}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-lg font-semibold text-slate-900">{word.word}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                            {formatSimilarity(word.similarity)}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                            {word.upvotes}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full inline-block">
                            {word.downvotes}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
                            word.score > 0 ? 'text-emerald-700 bg-emerald-100' :
                            word.score < 0 ? 'text-red-700 bg-red-100' :
                            'text-slate-600 bg-slate-100'
                          }`}>
                            {word.score}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleVote(word.word, 'upvote')}
                              disabled={hasUserVotedOnWord(word.word) || votingWords.has(word.word)}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                                hasUserVotedOnWord(word.word)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                              title={hasUserVotedOnWord(word.word) ? 'You have already voted on this word' : 'Upvote this word'}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Up
                            </button>
                            <button
                              onClick={() => handleVote(word.word, 'downvote')}
                              disabled={hasUserVotedOnWord(word.word) || votingWords.has(word.word)}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                                hasUserVotedOnWord(word.word)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                              title={hasUserVotedOnWord(word.word) ? 'You have already voted on this word' : 'Downvote this word'}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Down
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No words found</h3>
              <p className="text-slate-500">
                No words match your search for "{searchQuery}". Try a different search term.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-slate-600 mb-2">Search for Words</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Use the search box above to find specific words. The search uses fuzzy matching, 
            so you can find words even if you don't spell them exactly right.
          </p>
        </div>
      )}
    </div>
  )
}
