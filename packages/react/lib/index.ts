import * as React from 'react'
import type {ProtectedBox, BoxData, GetSnapshot} from "@boites/core"


export type {ProtectedBox, BoxData, GetSnapshot}

export default function useSyncBoxStore<T extends ProtectedBox>(box: T): BoxData<T>
export default function useSyncBoxStore<T extends ProtectedBox, G extends GetSnapshot<T>>(box: T, getSnapshot: G): ReturnType<G>
export default function useSyncBoxStore(box: any, getSnapshot?: any) {
  const [, forceRender] = React.useReducer(s => s + 1, 0)

  const {getData, addUpdateListener, removeListener} = box
  const getState = () => typeof getSnapshot === "function" ? getSnapshot(getData()) : getData()

  React.useEffect(() => {
    const listener = addUpdateListener(forceRender, getState)
    return () => removeListener(listener)
  }, [])

  return getState()
}