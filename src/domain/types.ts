export type HardCondition = 'needs_attic' | 'fears_mirrors' | 'avoids_humans' | 'needs_darkness' | 'needs_solitude'
export type SoftCondition = 'loves_damp' | 'prefers_quiet'
export type Condition = HardCondition | SoftCondition

export type HumanPresence = 'none' | 'occasional' | 'constant'

export interface Ghost {
  id: string
  name: string
  anxiety: number
  favoriteTemp: number
  deadline: string
  conditions: Condition[]
}

export interface Place {
  id: string
  name: string
  capacity: number
  lighting: number
  noise: number
  humidity: number
  temperature: number
  humans: HumanPresence
  hasAttic: boolean
  hasMirrors: boolean
  maxAnxiety: number | null
}

export type ManualChoices = Record<string, string | null>

export interface BureauData {
  ghosts: Ghost[]
  places: Place[]
  manual: ManualChoices
}

export interface Factor {
  label: string
  points: number
}

export type BlockerCode =
  | 'deadline'
  | 'attic'
  | 'mirrors'
  | 'humans'
  | 'anxious_humans'
  | 'light'
  | 'max_anxiety'
  | 'capacity'
  | 'solitude_needs_empty'
  | 'solitude_taken'

export interface Blocker {
  code: BlockerCode
  message: string
  detail?: string
}

export type Fit = 'great' | 'good' | 'poor'

export interface Placement {
  ghostId: string
  placeId: string | null
  mode: 'auto' | 'manual'
  score: number | null
  fit: Fit | null
  factors: Factor[]
  violations: Blocker[]
  warnings: string[]
  unplacedReasons: string[]
}

export interface PlaceLoad {
  placeId: string
  occupants: string[]
  capacity: number
  overloaded: boolean
  exclusiveConflict: boolean
}

export interface Plan {
  placements: Placement[]
  loads: PlaceLoad[]
}
