const YANDEX_METRIKA_COUNTER_ID = 113435703

declare global {
  interface Window {
    ym?: (counterId: number, method: 'reachGoal', target: string) => void
  }
}

export const reachGoal = (target: string) => {
  if (typeof window !== 'undefined') {
    window.ym?.(YANDEX_METRIKA_COUNTER_ID, 'reachGoal', target)
  }
}
