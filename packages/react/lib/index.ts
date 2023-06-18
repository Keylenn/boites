import * as React from 'react'
import type {ProtectedBox, BoxData, SetDataAction, MapDateFn} from "@boites/core"

export default function useBoxState<T extends ProtectedBox>(box: T): [BoxData<T>, SetDataAction<T>]
export default function useBoxState<T extends ProtectedBox, M extends MapDateFn<T>>(
  box: T,
  mapStateFn: M,
): [ReturnType<M>, SetDataAction<T>]
export default function useBoxState(box: any, mapStateFn?: any) {
  const [, forceRender] = React.useReducer(s => s + 1, 0)

  const {getData, setData, addUpdateListener, removeListener} = box
  const getState = () => getData(mapStateFn)

  React.useEffect(() => {
    const listener = addUpdateListener(forceRender, getState)
    return () => removeListener(listener)
  }, [])

  return [getState(), setData] as const
}