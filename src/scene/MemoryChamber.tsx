import { useThree } from '@react-three/fiber'
import { getCameraLayout } from '../camera/cameraConfig'
import { FRAGMENT_PROTOTYPES } from '../content/fragments'
import { Atmosphere } from '../environment/Atmosphere'
import { ChamberArchitecture } from '../environment/ChamberArchitecture'
import { CollectedConsequences } from '../environment/CollectedConsequences'
import { MemoryFragment } from '../fragments/MemoryFragment'
import { EndingStructures } from '../reconstruction/EndingStructures'
import { MemoryRecallTraces } from '../reconstruction/MemoryRecallTraces'
import { ReconstructionSpectacle } from '../reconstruction/ReconstructionSpectacle'
import { FeliciaCore } from './FeliciaCore'
import { TrialWorlds } from '../trials/TrialWorlds'

export function MemoryChamber() {
  const { size } = useThree()
  const layout = getCameraLayout(size.width, size.height)

  return (
    <group position={layout.sceneOffset} scale={layout.sceneScale}>
      <ChamberArchitecture />
      <FeliciaCore />
      <CollectedConsequences />
      <EndingStructures />
      <MemoryRecallTraces />
      <ReconstructionSpectacle />
      <TrialWorlds />
      {FRAGMENT_PROTOTYPES.map((fragment) => (
        <MemoryFragment key={fragment.id} fragment={fragment} />
      ))}
      <Atmosphere />
    </group>
  )
}
