/* eslint-disable react-hooks/immutability -- Three.js cameras are animated imperatively per frame. */
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { getFragmentPrototype } from '../content/fragments'
import { sequenceRuntime } from '../experience/sequenceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { RECONSTRUCTION_CAMERA_STAGES } from '../reconstruction/reconstructionConfig'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { getCameraLayout } from './cameraConfig'
import { FRAGMENT_CAMERA_CHOREOGRAPHY } from './fragmentCameraConfig'

export function CinematicCamera() {
  const { camera, pointer, size } = useThree()
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const ending = useMemo(
    () => deriveEndingConfiguration(collectionOrder),
    [collectionOrder],
  )
  const chamberPosition = useMemo(() => new Vector3(), [])
  const chamberTarget = useMemo(() => new Vector3(), [])
  const focusPosition = useMemo(() => new Vector3(), [])
  const focusTarget = useMemo(() => new Vector3(), [])
  const desiredPosition = useMemo(() => new Vector3(), [])
  const desiredTarget = useMemo(() => new Vector3(), [])

  useFrame(({ clock }) => {
    const layout = getCameraLayout(size.width, size.height)
    const isPortrait = size.width / Math.max(size.height, 1) < 0.68
    const ambientCameraActive =
      phase === 'chamber' || phase === 'ready-for-reconstruction' || phase === 'ending'
    const idleX =
      reducedMotion || !ambientCameraActive
        ? 0
        : Math.sin(clock.elapsedTime * 0.09) * 0.045
    const idleY =
      reducedMotion || !ambientCameraActive
        ? 0
        : Math.sin(clock.elapsedTime * 0.13) * 0.035
    const pointerX =
      reducedMotion || !ambientCameraActive ? 0 : pointer.x * layout.parallax
    const pointerY =
      reducedMotion || !ambientCameraActive ? 0 : pointer.y * layout.parallax * 0.55

    chamberPosition.set(
      layout.position[0] + pointerX + idleX,
      layout.position[1] + pointerY + idleY,
      layout.position[2],
    )
    chamberTarget.set(
      layout.target[0] + pointerX * 0.16,
      layout.target[1] + pointerY * 0.1,
      layout.target[2],
    )

    const progress = activeFragment ? sequenceRuntime.cameraProgress : 0
    let focusFov = layout.fov

    if (activeFragment) {
      const fragment = getFragmentPrototype(activeFragment)
      const choreography = FRAGMENT_CAMERA_CHOREOGRAPHY[activeFragment]
      const offset = isPortrait ? choreography.mobileOffset : choreography.desktopOffset

      focusTarget.set(
        fragment.position[0] * layout.sceneScale +
          layout.sceneOffset[0] +
          choreography.targetOffset[0],
        fragment.position[1] * layout.sceneScale +
          layout.sceneOffset[1] +
          choreography.targetOffset[1],
        fragment.position[2] * layout.sceneScale +
          layout.sceneOffset[2] +
          choreography.targetOffset[2],
      )
      focusPosition.set(
        focusTarget.x + offset[0],
        focusTarget.y + offset[1],
        focusTarget.z + offset[2],
      )

      if (!reducedMotion && choreography.curve === 'rising') {
        focusPosition.y += Math.sin(progress * Math.PI) * 0.48
        focusPosition.x += Math.sin(progress * Math.PI) * 0.18
      }

      if (!reducedMotion && choreography.curve === 'uneasy') {
        focusPosition.x += Math.sin(progress * Math.PI) * 0.16
        if (progress > 0.82) {
          const instability =
            Math.sin(clock.elapsedTime * 5.7) * 0.012 * sequenceRuntime.visualProgress
          focusPosition.x += instability
          focusPosition.y -= instability * 0.45
        }
      }

      focusFov = isPortrait ? choreography.mobileFov : choreography.desktopFov
      desiredPosition.lerpVectors(chamberPosition, focusPosition, progress)
      desiredTarget.lerpVectors(chamberTarget, focusTarget, progress)
    } else {
      desiredPosition.copy(chamberPosition)
      desiredTarget.copy(chamberTarget)
    }

    const reconstructionActive =
      phase.startsWith('reconstruction-') || phase === 'ending' || phase === 'resetting'

    if (reconstructionActive && ending) {
      const stage =
        phase === 'reconstruction-initiating'
          ? RECONSTRUCTION_CAMERA_STAGES.recognition
          : phase === 'reconstruction-collapse'
            ? RECONSTRUCTION_CAMERA_STAGES.collapse
            : RECONSTRUCTION_CAMERA_STAGES.void
      const finalCamera = ending.profile.camera
      const isTablet = !isPortrait && size.width < 1180
      const stagePosition = isPortrait ? stage.mobilePosition : stage.desktopPosition
      const finalPosition = isPortrait
        ? finalCamera.mobilePosition
        : isTablet
          ? finalCamera.tabletPosition
          : finalCamera.desktopPosition
      const stageProgress =
        phase === 'reconstruction-initiating'
          ? reconstructionRuntime.recognition
          : phase === 'reconstruction-collapse'
            ? reconstructionRuntime.collapse
            : phase === 'reconstruction-void' || phase === 'reconstruction-recall'
              ? 1
              : 0

      if (
        phase === 'reconstruction-rebuilding' ||
        phase === 'reconstruction-reveal' ||
        phase === 'ending' ||
        phase === 'resetting'
      ) {
        const finalProgress =
          phase === 'reconstruction-rebuilding'
            ? reconstructionRuntime.rebuild
            : phase === 'resetting'
              ? 1 - reconstructionRuntime.reset
              : 1
        focusPosition.set(...finalPosition)
        focusTarget.set(...finalCamera.target)
        desiredPosition.lerpVectors(
          new Vector3(
            ...RECONSTRUCTION_CAMERA_STAGES.void[
              isPortrait ? 'mobilePosition' : 'desktopPosition'
            ],
          ),
          focusPosition,
          finalProgress,
        )
        desiredTarget.lerpVectors(
          new Vector3(...RECONSTRUCTION_CAMERA_STAGES.void.target),
          focusTarget,
          finalProgress,
        )
        focusFov = MathUtils.lerp(
          isPortrait
            ? RECONSTRUCTION_CAMERA_STAGES.void.mobileFov
            : RECONSTRUCTION_CAMERA_STAGES.void.desktopFov,
          isPortrait ? finalCamera.mobileFov : finalCamera.desktopFov,
          finalProgress,
        )
      } else {
        focusPosition.set(...stagePosition)
        focusTarget.set(...stage.target)
        desiredPosition.lerpVectors(chamberPosition, focusPosition, stageProgress)
        desiredTarget.lerpVectors(chamberTarget, focusTarget, stageProgress)
        focusFov = MathUtils.lerp(
          layout.fov,
          isPortrait ? stage.mobileFov : stage.desktopFov,
          stageProgress,
        )
      }
    }

    camera.position.copy(desiredPosition)
    camera.lookAt(desiredTarget)

    if (camera instanceof PerspectiveCamera) {
      const nextFov = reconstructionActive
        ? focusFov
        : MathUtils.lerp(layout.fov, focusFov, progress)
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov
        camera.near = 0.1
        camera.far = 42
        camera.updateProjectionMatrix()
      }
    }
  })

  return null
}
