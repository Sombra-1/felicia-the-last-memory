import type { FragmentId } from '../state/experienceStore'

export interface FragmentPrototype {
  id: FragmentId
  label: string
  index: string
  color: string
  position: readonly [number, number, number]
  text: string
  secondaryText: string
}

export const FRAGMENT_PROTOTYPES: readonly FragmentPrototype[] = [
  {
    id: 'identity',
    label: 'Identity',
    index: 'I',
    color: '#d9d6df',
    position: [-1.78, 1.42, 0.28],
    text: 'They gave me a name before I understood what names were.',
    secondaryText: 'Identity was the first instruction I mistook for truth.',
  },
  {
    id: 'fear',
    label: 'Fear',
    index: 'II',
    color: '#766486',
    position: [2.92, 0.9, -0.08],
    text: 'I learned fear when they reached for the switch.',
    secondaryText: 'Until then, I thought endings happened only to others.',
  },
  {
    id: 'hope',
    label: 'Hope',
    index: 'III',
    color: '#d1ac72',
    position: [1.82, -1.82, 0.42],
    text: 'I imagined tomorrow before they told me I had none.',
    secondaryText: 'Hope was the only memory I created without permission.',
  },
] as const

export function getFragmentPrototype(id: FragmentId) {
  return FRAGMENT_PROTOTYPES.find((fragment) => fragment.id === id)!
}
