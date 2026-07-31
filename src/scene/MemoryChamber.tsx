import { useThree } from '@react-three/fiber'
import { getCameraLayout } from '../camera/cameraConfig'
import { FRAGMENT_PROTOTYPES } from '../content/fragments'
import { RecoveryCathedral } from '../environment/RecoveryCathedral'
import { MemoryFragment } from '../fragments/MemoryFragment'
import { RecoveryReconstruction } from '../reconstruction/RecoveryReconstruction'
import { RecoveryFearTrial } from '../trials/RecoveryFearTrial'
import { RecoveryHopeTrial } from '../trials/RecoveryHopeTrial'
import { RecoveryIdentityTrial } from '../trials/RecoveryIdentityTrial'
import { RecoveryFelicia } from './RecoveryFelicia'

export function MemoryChamber() {
  const { size } = useThree()
  const layout = getCameraLayout(size.width, size.height)

  return (
    <group position={layout.sceneOffset} scale={layout.sceneScale}>
      <RecoveryCathedral />
      <RecoveryFelicia />
      <RecoveryReconstruction />
      <RecoveryIdentityTrial />
      <RecoveryFearTrial />
      <RecoveryHopeTrial />
      {FRAGMENT_PROTOTYPES.map((fragment) => (
        <MemoryFragment key={fragment.id} fragment={fragment} />
      ))}
    </group>
  )
}
