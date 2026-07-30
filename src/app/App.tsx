import { Suspense, lazy } from 'react'
import { FocusCoordinator } from '../accessibility/FocusCoordinator'
import { AudioCoordinator } from '../audio/AudioCoordinator'
import { ExperienceDiagnostics } from '../dev/ExperienceDiagnostics'
import { EntranceSequenceCoordinator } from '../experience/EntranceSequenceCoordinator'
import { TransitionDirector } from '../experience/TransitionDirector'
import { useExperiencePreferences } from '../hooks/useExperiencePreferences'
import { installEvidenceBridge } from '../reconstruction/evidenceBridge'
import { TrialGameplayCoordinator } from '../trials/TrialGameplayCoordinator'
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
      <EntranceSequenceCoordinator />
      <TransitionDirector />
      <TrialGameplayCoordinator />
      <AudioCoordinator />
      <FocusCoordinator />
      <ExperienceDiagnostics />
      <Suspense fallback={<LoadingScreen label="Preparing memory chamber" />}>
        <ExperienceCanvas />
      </Suspense>
    </ExperienceShell>
  )
}
