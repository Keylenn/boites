export type ProtectedBox = ReturnType<typeof createBox>
export type BoxData<T extends ProtectedBox> = ReturnType<T['getData']>
export type GetSnapshot<T extends ProtectedBox, D = BoxData<T>> = (data: D) => any

export default function createBox<T, D = T extends () => any ? ReturnType<T> : T>(iData: T) {
  const initialData = typeof iData === 'function' ? iData() : iData
  const box = new Box<D>(initialData)

  function setData<N extends (prev: D) => D>(nextData: N): D
  function setData<N extends D>(nextData: N): D
  function setData(next: any) {
    const prevData: D = box.get()
    const nextData = typeof next === 'function' ? next(prevData) : next
    box.set(nextData)
    box.notify()
    return nextData
  }

  function addUpdateListener(handler: (...args: any) => void, getDeps: () => any) {
    const defaultDeps = getDeps()
    const listener: Listener = () => {
      const nextDeps = getDeps()
      const prevDeps = listener.deps || defaultDeps
      const isUpdate = Object.is(prevDeps, nextDeps) === false
      if (isUpdate) handler()
      listener.deps = nextDeps
    }
    return box.add(listener)
  }

  const protectedBox = Object.freeze({
    getData: box.get.bind(box),
    setData,
    addListener: box.add.bind(box),
    removeListener: box.remove.bind(box),
    addUpdateListener,
  })

  return protectedBox
}

interface Listener {
  (...args: any): void
  deps?: any
}

class Box<T> {
  constructor(initialData: T) {
    this.data = initialData
  }

  data: T
  listeners = new Set<Listener>()

  get() {
    return this.data
  }

  set(nextData: T) {
    this.data = nextData
  }

  notify(...args: any[]): void {
    for (const listener of this.listeners) {
      listener(...args)
    }
  }

  add(listener: () => void) {
    this.listeners.add(listener)
    return listener
  }

  remove(listener: () => void) {
    this.listeners.delete(listener)
  }
}
