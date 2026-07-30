/* eslint-disable react-hooks/immutability -- Three.js cameras are animated imperatively per frame. */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { updateRuntimeDiagnostics } from '../dev/runtimeDiagnostics'
import { entranceRuntime } from '../experience/entranceRuntime'
import { deriveEndingConfiguration } from '../reconstruction/endingProfiles'
import { RECONSTRUCTION_CAMERA_STAGES } from '../reconstruction/reconstructionConfig'
import { reconstructionRuntime } from '../reconstruction/reconstructionRuntime'
import { useExperienceStore } from '../state/experienceStore'
import { trialRuntime } from '../trials/trialRuntime'
import { getCameraLayout } from './cameraConfig'

export function CinematicCamera() {
  const { camera, pointer, size } = useThree()
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const phase = useExperienceStore((state) => state.phase)
  const activeFragment = useExperienceStore((state) => state.activeFragment)
  const collectionOrder = useExperienceStore((state) => state.collectionOrder)
  const endingExplorationReady = useExperienceStore(
    (state) => state.endingExplorationReady,
  )
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
  const voidPosition = useMemo(() => new Vector3(), [])
  const voidTarget = useMemo(() => new Vector3(), [])
  const widePosition = useMemo(() => new Vector3(), [])
  const wideTarget = useMemo(() => new Vector3(), [])

  useEffect(() => {
    const reconstructionActive =
      phase.startsWith('reconstruction-') || phase === 'ending' || phase === 'resetting'
    updateRuntimeDiagnostics({
      cameraOwner: reconstructionActive
        ? `reconstruction:${phase}`
        : activeFragment
          ? `fragment:${activeFragment}`
          : phase === 'chamber' || phase === 'ready-for-reconstruction'
            ? 'chamber:parallax'
            : 'idle',
    })
  }, [activeFragment, phase])

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

    const entranceSettle =
      phase === 'chamber' && !activeFragment
        ? MathUtils.smootherstep(entranceRuntime.progress, 0.08, 1)
        : 1
    const openingArc =
      phase === 'chamber' && !activeFragment && !reducedMotion
        ? Math.sin(entranceSettle * Math.PI) * 0.48
        : 0
    chamberPosition.set(
      layout.position[0] +
        pointerX +
        idleX +
        MathUtils.lerp(-0.82, 0, entranceSettle) +
        openingArc,
      layout.position[1] + pointerY + idleY + MathUtils.lerp(0.92, 0, entranceSettle),
      layout.position[2] + MathUtils.lerp(3.4, 0, entranceSettle),
    )
    chamberTarget.set(
      layout.target[0] + pointerX * 0.16,
      layout.target[1] + pointerY * 0.1 + MathUtils.lerp(0.52, 0, entranceSettle),
      layout.target[2],
    )

    const departureProgress = MathUtils.smootherstep(
      trialRuntime.departure * 0.56 + trialRuntime.passage * 0.44,
      0,
      1,
    )
    const progress = activeFragment
      ? phase === 'trial-returning'
        ? 1 - MathUtils.smootherstep(trialRuntime.returnProgress, 0.08, 1)
        : phase === 'trial-departure'
          ? departureProgress
          : phase.startsWith('trial-')
            ? 1
            : 0
      : 0
    let focusFov = layout.fov

    if (activeFragment) {
      const trialTargetY =
        activeFragment === 'hope' ? 0.7 : activeFragment === 'fear' ? 0.12 : 0.28
      const trialTargetZ = activeFragment === 'hope' ? -3.9 : -4.7
      focusTarget.set(
        layout.sceneOffset[0],
        trialTargetY * layout.sceneScale + layout.sceneOffset[1],
        trialTargetZ * layout.sceneScale + layout.sceneOffset[2],
      )
      focusPosition.set(
        activeFragment === 'fear' && !isPortrait ? 0.44 : 0,
        (isPortrait ? 1.25 : 0.46) + (activeFragment === 'hope' && !isPortrait ? 0.5 : 0),
        isPortrait ? 10.8 : 5.4,
      )

      if (!reducedMotion) {
        const passageArc = Math.sin(progress * Math.PI)
        if (activeFragment === 'identity') {
          focusPosition.x += Math.sin(progress * Math.PI * 2) * 0.12
          focusPosition.y += passageArc * 0.12
          focusPosition.z -= passageArc * 0.72
          focusTarget.z -= passageArc * 0.42
        } else if (activeFragment === 'fear') {
          focusPosition.z -= passageArc * 0.48
          focusPosition.x += Math.sin(progress * Math.PI * 1.4) * 0.16
          focusTarget.y += passageArc * 0.08
        } else {
          focusPosition.y += passageArc * 0.92
          focusPosition.x += passageArc * 0.24
          focusPosition.z -= passageArc * 0.36
          focusTarget.y += passageArc * 0.42
        }
      }

      focusFov = isPortrait
        ? activeFragment === 'hope'
          ? 49
          : 46
        : activeFragment === 'identity'
          ? 36
          : activeFragment === 'fear'
            ? 39
            : 42
      if (reducedMotion) {
        focusPosition.copy(chamberPosition)
        focusTarget.lerp(chamberTarget, 0.52)
        focusFov = layout.fov
      }
      desiredPosition.lerpVectors(chamberPosition, focusPosition, progress)
      desiredTarget.lerpVectors(chamberTarget, focusTarget, progress)

      if (phase === 'trial-returning' && !reducedMotion) {
        const returnArc = Math.sin(trialRuntime.returnProgress * Math.PI)
        desiredPosition.y += returnArc * (activeFragment === 'hope' ? 0.68 : 0.26)
        desiredPosition.x += returnArc * (activeFragment === 'identity' ? -0.22 : 0.12)
      }
    } else {
      desiredPosition.copy(chamberPosition)
      desiredTarget.copy(chamberTarget)
    }

    const reconstructionActive =
      phase.startsWith('reconstruction-') || phase === 'ending' || phase === 'resetting'

    if (reconstructionActive && ending) {
      const stage =
        phase === 'reconstruction-synchronizing' || phase === 'reconstruction-initiating'
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
        phase === 'reconstruction-synchronizing'
          ? MathUtils.smootherstep(trialRuntime.syncVisual, 0, 1) * 0.72
          : phase === 'reconstruction-initiating'
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
        focusTarget.set(
          finalCamera.target[0] + layout.sceneOffset[0],
          finalCamera.target[1] + layout.sceneOffset[1],
          finalCamera.target[2] + layout.sceneOffset[2],
        )
        voidPosition.set(
          ...RECONSTRUCTION_CAMERA_STAGES.void[
            isPortrait ? 'mobilePosition' : 'desktopPosition'
          ],
        )
        voidTarget.set(...RECONSTRUCTION_CAMERA_STAGES.void.target)

        const profile = ending.profile.id
        const pullbackProgress = MathUtils.smootherstep(finalProgress, 0.04, 0.4)
        const profileProgress = MathUtils.smootherstep(finalProgress, 0.58, 0.9)
        widePosition.set(
          profile === 'fear' ? focusPosition.x * 0.34 : focusPosition.x,
          profile === 'hope' ? focusPosition.y - 0.62 : focusPosition.y + 0.1,
          focusPosition.z + (profile === 'hope' ? 1.7 : 1.5),
        )
        wideTarget.set(
          focusTarget.x + (profile === 'fear' ? -0.18 : 0),
          focusTarget.y + (profile === 'hope' ? -0.34 : 0),
          focusTarget.z,
        )

        desiredPosition.lerpVectors(voidPosition, widePosition, pullbackProgress)
        desiredTarget.lerpVectors(voidTarget, wideTarget, pullbackProgress)
        desiredPosition.lerp(focusPosition, profileProgress)
        desiredTarget.lerp(focusTarget, profileProgress)

        if (phase === 'ending' && endingExplorationReady && !reducedMotion) {
          desiredPosition.x += trialRuntime.endingPointerX * 0.68
          desiredPosition.y += trialRuntime.endingPointerY * 0.32
          desiredTarget.x += trialRuntime.endingPointerX * 0.12
          desiredTarget.y += trialRuntime.endingPointerY * 0.08
        }

        const voidFov = isPortrait
          ? RECONSTRUCTION_CAMERA_STAGES.void.mobileFov
          : RECONSTRUCTION_CAMERA_STAGES.void.desktopFov
        const finalFov = isPortrait ? finalCamera.mobileFov : finalCamera.desktopFov
        const wideFov = finalFov + (profile === 'hope' ? 4 : 3)
        focusFov = MathUtils.lerp(voidFov, wideFov, pullbackProgress)
        focusFov = MathUtils.lerp(focusFov, finalFov, profileProgress)
      } else {
        focusPosition.set(...stagePosition)
        focusTarget.set(
          stage.target[0] + layout.sceneOffset[0],
          stage.target[1] + layout.sceneOffset[1],
          stage.target[2] + layout.sceneOffset[2],
        )
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
