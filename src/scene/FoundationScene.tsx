import { CinematicCamera } from '../camera/CinematicCamera'
import { SceneEffects } from '../effects/SceneEffects'
import { SceneLighting } from '../environment/SceneLighting'
import { MemoryChamber } from './MemoryChamber'
import { SceneDiagnostics } from './SceneDiagnostics'
import { PALETTE, VISUAL_CALIBRATION } from './config/visual'

export function FoundationScene() {
  return (
    <>
      <color attach="background" args={[PALETTE.void]} />
      <fog
        attach="fog"
        args={[PALETTE.void, VISUAL_CALIBRATION.fogNear, VISUAL_CALIBRATION.fogFar]}
      />
      <CinematicCamera />
      <SceneLighting />
      <MemoryChamber />
      <SceneEffects />
      <SceneDiagnostics />
    </>
  )
}
