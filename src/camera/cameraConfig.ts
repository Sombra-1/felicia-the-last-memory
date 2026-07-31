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
      position: [0.35, 1.2, 13.8],
      target: [-0.15, 0.72, -0.45],
      fov: 50,
      sceneScale: 0.72,
      sceneOffset: [0, 1.1, 0],
      parallax: 0.12,
    }
  }

  if (aspect < 1.45) {
    return {
      position: [1.1, 0.76, 11.9],
      target: [-0.28, 0.2, -0.5],
      fov: 43,
      sceneScale: 0.88,
      sceneOffset: [0, 0.25, 0],
      parallax: 0.12,
    }
  }

  return {
    position: [1.45, 0.58, 10.85],
    target: [-0.35, 0.12, -0.62],
    fov: 38,
    sceneScale: 1,
    sceneOffset: [0, 0, 0],
    parallax: 0.12,
  }
}
