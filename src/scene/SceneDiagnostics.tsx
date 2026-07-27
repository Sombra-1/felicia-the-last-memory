import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { InstancedMesh, Line, Mesh, Points } from 'three'

export function SceneDiagnostics() {
  const frames = useRef(0)

  useFrame(({ scene }) => {
    if (!import.meta.env.DEV) return
    frames.current += 1
    if (frames.current < 15) return
    frames.current = 0

    let drawables = 0
    let triangles = 0

    scene.traverse((object) => {
      let hierarchyVisible = object.visible
      let parent = object.parent
      while (hierarchyVisible && parent) {
        hierarchyVisible = parent.visible
        parent = parent.parent
      }

      if (
        hierarchyVisible &&
        (object instanceof Mesh || object instanceof Line || object instanceof Points)
      ) {
        drawables += 1
      }

      if (hierarchyVisible && object instanceof Mesh) {
        const indexCount = object.geometry.index?.count
        const positionCount = object.geometry.attributes.position?.count ?? 0
        const instanceCount = object instanceof InstancedMesh ? object.count : 1
        triangles += Math.floor((indexCount ?? positionCount) / 3) * instanceCount
      }
    })

    document.documentElement.dataset.sceneDrawCalls = String(drawables)
    document.documentElement.dataset.sceneTriangles = String(triangles)
  })

  return null
}
