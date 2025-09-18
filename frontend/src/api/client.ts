import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvhtzgyrqcofpahuaazv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aHR6Z3lycWNvZnBhaHVhYXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDI5OTMsImV4cCI6MjA3Mzc3ODk5M30.44xFYcRQzdrBZwaSMysPXtdzYfWgNR4sYK91WZDnXmU'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Word {
  word: string
  upvotes: number
  downvotes: number
  score: number
}

export interface PaginatedWordsRequest {
  page_size: number
  page_number: number
}

export interface PaginatedWordsResponse {
  words: Word[]
}

export interface WordVoteRequest {
  target: string
}

export interface AddWordRequest {
  new_word: string
}

export interface RemoveWordRequest {
  target: string
}

export interface SearchWordsRequest {
  query: string
  limit_count?: number
}

export interface SearchWord {
  word: string
  upvotes: number
  downvotes: number
  score: number
  similarity: number
}

export class PhictionaryAPI {
  static async getWordsPaginated(request: PaginatedWordsRequest): Promise<PaginatedWordsResponse> {
    const { data, error } = await supabase.rpc('get_words_paginated', request)
    
    if (error) {
      throw new Error(`Failed to fetch words: ${error.message}`)
    }
    
    // Handle case where data might be the array directly or wrapped in a words property
    if (Array.isArray(data)) {
      return { words: data }
    }
    
    return data || { words: [] }
  }

  static async getRandomWord(): Promise<Word> {
    const { data, error } = await supabase.rpc('get_random_word')
    
    if (error) {
      throw new Error(`Failed to fetch random word: ${error.message}`)
    }

    // Handle case where data is an array (take first element)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('No words available')
      }
      return data[0]
    }
    
    return data
  }

  static async upvoteWord(request: WordVoteRequest): Promise<void> {
    const { error } = await supabase.rpc('upvote_word', request)
    
    if (error) {
      throw new Error(`Failed to upvote word: ${error.message}`)
    }
  }

  static async downvoteWord(request: WordVoteRequest): Promise<void> {
    const { error } = await supabase.rpc('downvote_word', request)
    
    if (error) {
      throw new Error(`Failed to downvote word: ${error.message}`)
    }
  }

  static async addWord(request: AddWordRequest): Promise<string> {
    const { data, error } = await supabase.rpc('add_word', request)
    
    if (error) {
      throw new Error(`Failed to add word: ${error.message}`)
    }
    
    return data || 'Word added successfully'
  }

  static async removeWord(request: RemoveWordRequest): Promise<string> {
    const { data, error } = await supabase.rpc('remove_word', request)
    
    if (error) {
      throw new Error(`Failed to remove word: ${error.message}`)
    }
    
    return data || 'Word removed successfully'
  }

  static async searchWords(request: SearchWordsRequest): Promise<SearchWord[]> {
    const { data, error } = await supabase.rpc('search_words', request)
    
    if (error) {
      throw new Error(`Failed to search words: ${error.message}`)
    }
    
    return data || []
  }
}
