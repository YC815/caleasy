import { useState, useCallback } from "react"
import type { LoadingState, LoadingStateMap } from "@/lib/loading-state"

export function useUnifiedLoading(initialStates: LoadingStateMap = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingStateMap>(initialStates)

  const setLoading = useCallback((key: string, state: LoadingState) => {
    setLoadingStates(prev => ({ ...prev, [key]: state }))
  }, [])

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] === "loading"
  }, [loadingStates])

  const isError = useCallback((key: string): boolean => {
    return loadingStates[key] === "error"
  }, [loadingStates])

  const isSuccess = useCallback((key: string): boolean => {
    return loadingStates[key] === "success"
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).includes("loading")

  const resetState = useCallback((key: string) => {
    setLoading(key, "idle")
  }, [setLoading])

  const resetAllStates = useCallback(() => {
    setLoadingStates({})
  }, [])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isError,
    isSuccess,
    isAnyLoading,
    resetState,
    resetAllStates
  }
}