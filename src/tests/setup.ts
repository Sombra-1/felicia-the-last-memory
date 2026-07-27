import '@testing-library/jest-dom/vitest'

class MatchMediaMock {
  matches = false
  media = ''
  onchange = null

  addListener() {}
  removeListener() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => Object.assign(new MatchMediaMock(), { media: query }),
})

const storage = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size
    },
  } satisfies Storage,
})
