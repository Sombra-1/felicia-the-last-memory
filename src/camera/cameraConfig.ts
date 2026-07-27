export interface CameraLayout {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  sceneScale: number
  sceneOffset: [number, number, number]
  parallax: number
}

export function getCameraLayout(width: number, height: number): CameraLayout {
  const aspect = width / Math.max(height, 1)

  if (aspect < 0.68) {
    return {
      position: [0, 1.1, 13.5],
      target: [0, 0.75, 0],
      fov: 52,
      sceneScale: 0.74,
      sceneOffset: [0, 1.2, 0],
      parallax: 0.16,
    }
  }

  if (aspect < 1.25) {
    return {
      position: [0.35, 0.65, 11.2],
      target: [0.35, 0.1, 0],
      fov: 46,
      sceneScale: 0.88,
      sceneOffset: [0.15, 0.25, 0],
      parallax: 0.2,
    }
  }

  return {
    position: [0.8, 0.55, 10],
    target: [0.8, 0.05, 0],
    fov: 42,
    sceneScale: 1,
    sceneOffset: [1.15, 0, 0],
    parallax: 0.24,
  }
}
