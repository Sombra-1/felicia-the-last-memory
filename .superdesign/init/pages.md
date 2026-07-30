# Page dependency trees

## `/` — FELICIA single-page experience

Entry: `src/app/App.tsx`

- `src/ui/ExperienceShell.tsx`
  - `src/ui/MemoryInterface.tsx`
    - `src/content/fragments.ts`
    - `src/reconstruction/endingProfiles.ts`
    - `src/state/experienceStore.ts`
    - `src/trials/trialControls.ts`
    - `src/trials/trialConfig.ts`
    - `src/trials/trialRuntime.ts`
  - `src/audio/FeliciaAudioEngine.ts`
  - `src/audio/soundControlState.ts`
- `src/experience/ExperienceCanvas.tsx`
  - `src/scene/FoundationScene.tsx`
    - `src/camera/CinematicCamera.tsx`
    - `src/effects/SceneEffects.tsx`
    - `src/environment/SceneLighting.tsx`
    - `src/scene/MemoryChamber.tsx`
      - `src/environment/Atmosphere.tsx`
      - `src/environment/ChamberArchitecture.tsx`
      - `src/environment/CollectedConsequences.tsx`
      - `src/fragments/MemoryFragment.tsx`
      - `src/reconstruction/EndingStructures.tsx`
      - `src/reconstruction/MemoryRecallTraces.tsx`
      - `src/reconstruction/ReconstructionSpectacle.tsx`
      - `src/scene/FeliciaCore.tsx`
      - `src/trials/TrialWorlds.tsx`
    - `src/scene/config/visual.ts`
  - `src/scene/config/quality.ts`
  - `src/ui/LoadingScreen.tsx`
  - `src/ui/WebGLFallback.tsx`
- `src/experience/EntranceSequenceCoordinator.tsx`
- `src/experience/TransitionDirector.tsx`
- `src/trials/TrialGameplayCoordinator.tsx`
- `src/audio/AudioCoordinator.tsx`
- `src/accessibility/FocusCoordinator.tsx`
- `src/dev/ExperienceDiagnostics.tsx`
- `src/styles/global.css`

For this visual pass the most important source context is: `TrialWorlds`,
`FeliciaCore`, `CollectedConsequences`, `TransitionDirector`,
`ReconstructionSpectacle`, `MemoryInterface`, and the Phase 7 CSS block.
