import { Suspense, lazy } from 'react'
import { FocusCoordinator } from '../accessibility/FocusCoordinator'
import { AudioCoordinator } from '../audio/AudioCoordinator'
import { FragmentSequenceCoordinator } from '../experience/FragmentSequenceCoordinator'
import { useExperiencePreferences } from '../hooks/useExperiencePreferences'
import { ReconstructionCoordinator } from '../reconstruction/ReconstructionCoordinator'
import { installEvidenceBridge } from '../reconstruction/evidenceBridge'
import { ExperienceShell } from '../ui/ExperienceShell'
import { LoadingScreen } from '../ui/LoadingScreen'

const ExperienceCanvas = lazy(() =>
  import('../experience/ExperienceCanvas').then((module) => ({
    default: module.ExperienceCanvas,
  })),
)

installEvidenceBridge()

export function App() {
  useExperiencePreferences()

  return (
    <ExperienceShell>
      <FragmentSequenceCoordinator />
      <ReconstructionCoordinator />
      <AudioCoordinator />
      <FocusCoordinator />
      <Suspense fallback={<LoadingScreen label="Preparing memory chamber" />}>
        <ExperienceCanvas />
      </Suspense>
    </ExperienceShell>
  )
}
