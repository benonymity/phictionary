import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, RefreshCw, ArrowLeft } from 'lucide-react'
import { PhictionaryAPI, Word } from '../api/client'

interface VotingModeProps {
  onBack: () => void
}

export function VotingMode({ onBack }: VotingModeProps) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextWord, setNextWord] = useState<Word | null>(null)

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
      
      // Fetch a new word after deletion
      fetchRandomWord()
    } catch (err) {
      console.error(`Failed to delete word "${word}":`, err)
    }
  }

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "d") {
        event.preventDefault();
        if (currentWord) {
          handleDeleteWord(currentWord.word);
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (currentWord && !voting && !hasUserVotedOnWord(currentWord.word)) {
          handleVote("upvote");
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (currentWord && !voting && !hasUserVotedOnWord(currentWord.word)) {
          handleVote("downvote");
        }
      } else if (event.key === "r") {
        event.preventDefault();
        fetchRandomWord();
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentWord, voting])

  const fetchRandomWord = async (isPreload = false) => {
    try {
      if (!isPreload) {
        setLoading(true)
        setError(null)
      }
      const word = await PhictionaryAPI.getRandomWord()
      
      if (isPreload) {
        setNextWord(word)
      } else {
        setCurrentWord(word)
      }
    } catch (err) {
      if (!isPreload) {
        setError(err instanceof Error ? err.message : 'Failed to fetch word')
      }
    } finally {
      if (!isPreload) {
        setLoading(false)
      }
    }
  }

  const preloadNextWord = async () => {
    if (!nextWord) {
      await fetchRandomWord(true)
    }
  }

  useEffect(() => {
    fetchRandomWord()
    // Preload the next word after initial load
    setTimeout(() => preloadNextWord(), 1000)
  }, [])

  const handleVote = async (action: 'upvote' | 'downvote') => {
    if (!currentWord || voting) return

    // Check if user has already voted on this word
    if (hasUserVotedOnWord(currentWord.word)) {
      console.log(`User has already voted on "${currentWord.word}"`)
      return
    }

    try {
      setVoting(true)
      setError(null)
      
      if (action === 'upvote') {
        await PhictionaryAPI.upvoteWord({ target: currentWord.word })
      } else {
        await PhictionaryAPI.downvoteWord({ target: currentWord.word })
      }
      
      // Mark word as voted in localStorage
      markWordAsVoted(currentWord.word)
      
      // Use preloaded word or fetch new one immediately
      if (nextWord) {
        setCurrentWord(nextWord)
        setNextWord(null)
        // Preload the next word
        preloadNextWord()
      } else {
        await fetchRandomWord()
        // Preload the next word
        preloadNextWord()
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} word`)
    } finally {
      setVoting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score > 0) return 'text-green-600'
    if (score < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <span className="text-lg text-slate-600 font-medium">Loading word...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !currentWord) {
    return (
      <div className="p-8">
        <div className="text-center p-12">
          <div className="text-red-600 mb-6 text-lg font-medium">Error: {error}</div>
          <button
            onClick={fetchRandomWord}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => fetchRandomWord()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          New Word
        </button>
      </div>

      {currentWord && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
            <div className="text-center space-y-8">
              <div>
                <h3 className="text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                  {currentWord.word}
                </h3>
                <div className="flex justify-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                    <span className="font-semibold">↑</span>
                    <span className="font-bold">{currentWord.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
                    <span className="font-semibold">↓</span>
                    <span className="font-bold">{currentWord.downvotes}</span>
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold ${
                    currentWord.score > 0 ? 'text-emerald-700 bg-emerald-100' :
                    currentWord.score < 0 ? 'text-red-700 bg-red-100' :
                    'text-slate-600 bg-slate-100'
                  }`}>
                    <span>Score:</span>
                    <span>{currentWord.score}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}


              <div className="flex justify-center space-x-6">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={voting || (currentWord && hasUserVotedOnWord(currentWord.word))}
                  className={`flex items-center px-8 py-4 rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    currentWord && hasUserVotedOnWord(currentWord.word)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                  }`}
                  title={currentWord && hasUserVotedOnWord(currentWord.word) ? 'You have already voted on this word' : 'Upvote this word'}
                >
                  <ThumbsUp className="w-6 h-6 mr-3" />
                  Upvote
                </button>
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={voting || (currentWord && hasUserVotedOnWord(currentWord.word))}
                  className={`flex items-center px-8 py-4 rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    currentWord && hasUserVotedOnWord(currentWord.word)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                  }`}
                  title={currentWord && hasUserVotedOnWord(currentWord.word) ? 'You have already voted on this word' : 'Downvote this word'}
                >
                  <ThumbsDown className="w-6 h-6 mr-3" />
                  Downvote
                </button>
              </div>

              {voting && (
                <div className="flex items-center justify-center text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Processing vote...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
