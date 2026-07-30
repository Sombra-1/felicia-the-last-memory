# Routes

The app is a Vite SPA with one route (`/`). There is no React Router. Experience
states are driven by the Zustand phase machine and rendered inside the same canvas.

## `/`

- Entry: `src/main.tsx`
- App: `src/app/App.tsx`
- Layout: `src/ui/ExperienceShell.tsx`
- 3D canvas: `src/experience/ExperienceCanvas.tsx`
- Scene root: `src/scene/FoundationScene.tsx`
- Stateful interface: `src/ui/MemoryInterface.tsx`

```tsx
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
```

Primary render phases: loading, intro, chamber, trial-departure, trial-arrival,
trial-active, trial-completing, trial-returning, ready-for-reconstruction,
reconstruction-synchronizing, reconstruction-initiating, reconstruction-collapse,
reconstruction-void, reconstruction-recall, reconstruction-rebuilding, ending.
