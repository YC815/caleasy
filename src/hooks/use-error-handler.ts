"use client"

import { useState, useCallback } from "react"

export type ErrorState = {
  error: string | null
  isError: boolean
}

// 統一的錯誤處理 hook
export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  })

  const setError = useCallback((error: string | Error | null) => {
    if (error === null) {
      setErrorState({ error: null, isError: false })
    } else {
      const errorMessage = error instanceof Error ? error.message : error
      setErrorState({ error: errorMessage, isError: true })
      console.error("Error occurred:", errorMessage)
    }
  }, [])

  const clearError = useCallback(() => {
    setErrorState({ error: null, isError: false })
  }, [])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      clearError()
      return await asyncFn()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setError(err)
      onError?.(err)
      return null
    }
  }, [setError, clearError])

  return {
    ...errorState,
    setError,
    clearError,
    handleAsyncError
  }
}