import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { PhictionaryAPI, type Word } from '../api/client'

export function WordList() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(20)
  const [votingWords, setVotingWords] = useState<Set<string>>(new Set())
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)

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

  const handleDeleteWord = async (word: string) => {
    try {
      const response = await PhictionaryAPI.removeWord({ target: word })
      console.log(response)
      
      // Remove the word from the current list
      setWords(prev => prev.filter(w => w.word !== word))
    } catch (err) {
      console.error(`Failed to delete word "${word}":`, err)
    }
  }

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault()
        if (hoveredWord) {
          handleDeleteWord(hoveredWord)
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (hoveredWord && !votingWords.has(hoveredWord)) {
          handleVote(hoveredWord, 'upvote')
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (hoveredWord && !votingWords.has(hoveredWord)) {
          handleVote(hoveredWord, 'downvote')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hoveredWord, votingWords])

  const fetchWords = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await PhictionaryAPI.getWordsPaginated({
        page_size: pageSize,
        page_number: pageNumber
      })
      setWords(response.words)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch words')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWords()
  }, [pageNumber])

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1)
    }
  }

  const handleNextPage = () => {
    setPageNumber(pageNumber + 1)
  }

  const handleRefresh = () => {
    fetchWords()
  }

  const handleVote = async (word: string, action: 'upvote' | 'downvote') => {
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
      
      // Update the word's score optimistically and re-sort by score
      setWords(prev => {
        const updatedWords = prev.map(w => 
          w.word === word ? {
            ...w,
            upvotes: action === 'upvote' ? w.upvotes + 1 : w.upvotes,
            downvotes: action === 'downvote' ? w.downvotes + 1 : w.downvotes,
            score: action === 'upvote' ? w.score + 1 : w.score - 1
          } : w
        )
        
        // Sort by score (descending - highest scores first)
        return updatedWords.sort((a, b) => b.score - a.score)
      })
      
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


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading words...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Rankings</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Mobile Card Layout */}
      <div className="block sm:hidden space-y-3">
        {words && words.map((word, index) => (
          <div 
            key={`${word.word}-${index}`} 
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
            onTouchStart={() => setHoveredWord(word.word)}
            onTouchEnd={() => setHoveredWord(null)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-slate-900">{word.word}</div>
              <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                word.score > 0 ? 'text-emerald-700 bg-emerald-100' :
                word.score < 0 ? 'text-red-700 bg-red-100' :
                'text-slate-600 bg-slate-100'
              }`}>
                {word.score}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  ↑ {word.upvotes}
                </div>
                <div className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  ↓ {word.downvotes}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote(word.word, 'upvote')}
                disabled={hasUserVotedOnWord(word.word) || votingWords.has(word.word)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  hasUserVotedOnWord(word.word)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                title={hasUserVotedOnWord(word.word) ? 'You have already voted on this word' : 'Upvote this word'}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Upvote
              </button>
              <button
                onClick={() => handleVote(word.word, 'downvote')}
                disabled={hasUserVotedOnWord(word.word) || votingWords.has(word.word)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  hasUserVotedOnWord(word.word)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                title={hasUserVotedOnWord(word.word) ? 'You have already voted on this word' : 'Downvote this word'}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Downvote
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Word
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
              {words && words.map((word, index) => (
                <tr 
                  key={`${word.word}-${index}`} 
                  className="hover:bg-slate-50 transition-colors"
                  onMouseEnter={() => setHoveredWord(word.word)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-lg font-semibold text-slate-900">{word.word}</div>
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

        {words && words.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No words found on this page.
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 pt-6 border-t border-slate-200 gap-4">
        <div className="text-sm text-slate-600 font-medium">
          Page {pageNumber} • {words ? words.length : 0} words
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviousPage}
            disabled={pageNumber === 1}
            className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!words || words.length < pageSize}
            className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
