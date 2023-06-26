export type ProtectedBox = ReturnType<typeof createBox>
export type BoxData<T extends ProtectedBox> = ReturnType<T['getData']>
export type GetSnapshot<T extends ProtectedBox, D = BoxData<T>> = (data: D) => any
export interface Options {
  cache?: string | {
    key: string
    expires?: number | (() => boolean)
    context?: {
      getItem: (key: string) => any
      setItem: (key:string, val: any) => void
      removeItem: (key: string) => void
    }
  }
}

export default function createBox<T, D = T extends () => any ? ReturnType<T> : T>(iData: T, options?: Options) {
  const initialData = typeof iData === 'function' ? iData() : iData
  const box = new Box<D>(initialData, options)

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

interface Cache<D> {
  get: () => D | null
  set: (data: D) => void
}

class Box<T> {
  constructor(initialData: T, options: Options = {}) {
    let data = initialData
    if(options.cache) {
      this.cache = checkAndFormatCacheOption<T>(options.cache)
      const cacheData =  this.cache && this.cache.get && this.cache.get()
      if(cacheData) data = cacheData
    }
    this.data = data
  }

  data: T
  cache: Cache<T> | null = null
  listeners = new Set<Listener>()

  get() {
    return this.data
  }

  set(nextData: T) {
    this.cache && this.cache.set && this.cache.set(nextData)
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

declare var window: any
type CacheOption = NonNullable<Options['cache']>
function checkAndFormatCacheOption<D>(cache: CacheOption): Cache<D>{

  const key = typeof cache === "object" ? cache.key : cache
  if(typeof key !== "string") throw new Error("Create the cache box requires a unique string key as a parameter.")
  if(typeof window === 'undefined' && (typeof cache === "string" || cache.context === undefined)) throw new Error("The current host environment won't work unless you pass in the correct cache context when creating the cache box.")
  
  const context = typeof cache === "object" && cache.context ? cache.context : {
    getItem: (key: string) => {
      const strVal = window.localStorage.getItem(key)
      try {
        return JSON.parse(strVal)
      } catch (error) {
        return strVal
      }
    },
    setItem: (key: string, val: any) => window.localStorage.setItem(key, JSON.stringify(val)),
    removeItem: () => window.localStorage.removeItem(key)
  }

  return {
    get: () => {
      const res = context.getItem(key)
      
      if(!res) return null

      if(typeof cache === "object" && cache.expires) {
        const expiration = res && res.expiration ? +res.expiration : 0
      
        const isValid = typeof cache.expires === "function" 
          ? cache.expires()
          : expiration
            ? Date.now() <= expiration
            : true
        
        if(isValid === false) {
          context.removeItem(key)
          return null
        }
      }
      return res.value ? res.value : null
    },
    set: (data: D) => {
      context.setItem(key, {
        expiration: typeof cache === "object" && typeof cache.expires === "number" ? cache.expires : 0,
        value: data
      })
    }
  }
}
