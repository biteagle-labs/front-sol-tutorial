import { useEffect, useState } from "react"

export const useMounted = (
  onMounted?: () => void,
  onUnmounted?: () => void
) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    onMounted?.()

    return onUnmounted
  }, [])

  return {
    isMounted,
    isNotMounted: !isMounted,
  }
}
