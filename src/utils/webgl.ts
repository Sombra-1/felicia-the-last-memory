export function canInitializeWebGL() {
  try {
    const probe = document.createElement('canvas')
    const context =
      probe.getContext('webgl2') ??
      probe.getContext('webgl') ??
      probe.getContext('experimental-webgl')
    return context !== null
  } catch {
    return false
  }
}
