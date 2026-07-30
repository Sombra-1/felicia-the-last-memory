export interface EntranceRuntime {
  progress: number
  pulse: number
  sweep: number
  core: number
  identity: number
  fear: number
  hope: number
  architecture: number
  atmosphere: number
}

export const entranceRuntime: EntranceRuntime = {
  progress: 0,
  pulse: 0,
  sweep: 0,
  core: 0.08,
  identity: 0,
  fear: 0,
  hope: 0,
  architecture: 0,
  atmosphere: 0,
}

export function completeEntranceRuntime() {
  entranceRuntime.progress = 1
  entranceRuntime.pulse = 1
  entranceRuntime.sweep = 1
  entranceRuntime.core = 1
  entranceRuntime.identity = 1
  entranceRuntime.fear = 1
  entranceRuntime.hope = 1
  entranceRuntime.architecture = 1
  entranceRuntime.atmosphere = 1
}

export function resetEntranceRuntime() {
  entranceRuntime.progress = 0
  entranceRuntime.pulse = 0
  entranceRuntime.sweep = 0
  entranceRuntime.core = 0.08
  entranceRuntime.identity = 0
  entranceRuntime.fear = 0
  entranceRuntime.hope = 0
  entranceRuntime.architecture = 0
  entranceRuntime.atmosphere = 0
}
