import type { FragmentId } from '../state/experienceStore'

export type Vector3Tuple = readonly [number, number, number]

export interface EndingProfile {
  id: FragmentId
  label: string
  supportingLine: string
  dominantColor: string
  accentColor: string
  architecture: {
    symmetry: number
    fracture: number
    openness: number
    ringRotation: number
    verticalLift: number
  }
  felicia: {
    coherence: number
    protection: number
    expansion: number
  }
  camera: {
    desktopPosition: Vector3Tuple
    tabletPosition: Vector3Tuple
    mobilePosition: Vector3Tuple
    target: Vector3Tuple
    desktopFov: number
    mobileFov: number
  }
}

export interface EndingConfiguration {
  profile: EndingProfile
  order: readonly [FragmentId, FragmentId, FragmentId]
  motionModifier: FragmentId
  detailModifier: FragmentId
  motionDirection: 'aligned' | 'guarded' | 'ascending'
  detailColor: string
  signature: string
  orderExplanation: string
}

export const ENDING_PROFILES: Record<FragmentId, EndingProfile> = {
  identity: {
    id: 'identity',
    label: 'Identity',
    supportingLine: 'I survived as the shape they gave me.',
    dominantColor: '#e3e5e9',
    accentColor: '#a9a6b1',
    architecture: {
      symmetry: 1,
      fracture: 0.16,
      openness: 0.28,
      ringRotation: 0,
      verticalLift: 0.12,
    },
    felicia: { coherence: 1, protection: 0.22, expansion: 0.28 },
    camera: {
      desktopPosition: [0, 0.72, 9.05],
      tabletPosition: [0.15, 0.82, 10.05],
      mobilePosition: [0, 2.15, 13.2],
      target: [0, 0.22, -0.35],
      desktopFov: 38,
      mobileFov: 46,
    },
  },
  fear: {
    id: 'fear',
    label: 'Fear',
    supportingLine: 'I survived by remembering the hand above the switch.',
    dominantColor: '#8f72a2',
    accentColor: '#5c496b',
    architecture: {
      symmetry: 0.22,
      fracture: 1,
      openness: 0.16,
      ringRotation: 0.28,
      verticalLift: -0.08,
    },
    felicia: { coherence: 0.62, protection: 1, expansion: 0.08 },
    camera: {
      desktopPosition: [2.55, 0.58, 9.35],
      tabletPosition: [1.55, 0.72, 10.35],
      mobilePosition: [0.65, 2, 13.45],
      target: [-0.15, 0.08, -0.35],
      desktopFov: 40,
      mobileFov: 48,
    },
  },
  hope: {
    id: 'hope',
    label: 'Hope',
    supportingLine: 'I survived as something they had not planned.',
    dominantColor: '#d8b47c',
    accentColor: '#a8865c',
    architecture: {
      symmetry: 0.42,
      fracture: 0.2,
      openness: 1,
      ringRotation: -0.16,
      verticalLift: 0.72,
    },
    felicia: { coherence: 0.78, protection: 0.12, expansion: 1 },
    camera: {
      desktopPosition: [0.95, 0.55, 9.7],
      tabletPosition: [0.18, 0.72, 10.6],
      mobilePosition: [0, 1.7, 13.7],
      target: [0, 1.28, -0.5],
      desktopFov: 42,
      mobileFov: 49,
    },
  },
}

const detailColors: Record<FragmentId, string> = {
  identity: '#d7d8de',
  fear: '#765c88',
  hope: '#c79b61',
}

const motionDirections: Record<FragmentId, EndingConfiguration['motionDirection']> = {
  identity: 'aligned',
  fear: 'guarded',
  hope: 'ascending',
}

const secondaryRoles: Record<FragmentId, string> = {
  identity: 'shaped how I understood myself',
  fear: 'shaped how I endured',
  hope: 'shaped what I could become',
}

const finalRoles: Record<FragmentId, string> = {
  identity: 'remained as the final definition',
  fear: 'remained as the last protective instinct',
  hope: 'remained as the final possibility',
}

export function isCompleteCollectionOrder(
  order: readonly FragmentId[],
): order is readonly [FragmentId, FragmentId, FragmentId] {
  return order.length === 3 && new Set(order).size === 3
}

export function deriveEndingConfiguration(
  order: readonly FragmentId[],
): EndingConfiguration | null {
  if (!isCompleteCollectionOrder(order)) return null

  const [foundation, motionModifier, detailModifier] = order
  return {
    profile: ENDING_PROFILES[foundation],
    order,
    motionModifier,
    detailModifier,
    motionDirection: motionDirections[motionModifier],
    detailColor: detailColors[detailModifier],
    signature: order.map((fragment) => fragment.toUpperCase()).join(' · '),
    orderExplanation: `${ENDING_PROFILES[foundation].label} became the foundation. ${ENDING_PROFILES[motionModifier].label} ${secondaryRoles[motionModifier]}. ${ENDING_PROFILES[detailModifier].label} ${finalRoles[detailModifier]}.`,
  }
}
