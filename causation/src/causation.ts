
import {
  Action,
  ActionPredicate,
  CauseMatcher,
  EffectAbstract,
  EffectGroup,
  Observation,
} from './elements'

const cause =
  (predicate: ActionPredicate):
  CauseMatcher => ({predicate})

const effect =
  (group: EffectGroup) =>
  (predicate: ActionPredicate):
  EffectAbstract => ({predicate, group})

type CausationDef = [CauseMatcher, Array<EffectAbstract>]

const causations: Array<CausationDef> = [
  [
    cause(action => action.action_type === 'commit'),
    [
      effect(EffectGroup.Validators)(
        action => action.action_type === 'hold'
      )
    ]
  ]
]

export const resolveCause = (action: Action): Array<EffectAbstract> => {
  return flatten(
    causations
    .filter(([cause, _]) => {
      const match = cause.predicate(action)
    })
    .map((_, effects) => effects)
  )

}

const flatten = arrays => [].concat.apply([], arrays)
