import React, { useMemo } from 'react'
import createBox from '@boites/core'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import useSyncBoxStore from '../lib'
import './App.css'

const defaultCountValue = {
  count1: 0,
  count2: 0,
  sharedCount: 0,
}

const countBox = createBox(defaultCountValue)

function App() {
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div>
        <a href="https://www.npmjs.com/package/@boites/react" target="_blank" className="package">
          <code>📦 @boites/react</code>
        </a>
      </div>
      <div className="row">
   
      <Counter type="1" />
      <Counter type = "2" />
      </div>
      <StatusBar />
      <p className="read-the-docs">
        Click on the Vite and React logos and Package Name to learn more
      </p>
    </>
  )
}

export default App

function Counter({type}: {type: '1' | '2'}) {
  const key = `count${type}`
  const count = useSyncBoxStore(countBox, d => d[key])
  const sharedCount = useSyncBoxStore(countBox, d => d.sharedCount)
  const countButtonProps = useMemo(() => {
    return {
      key: `${key}_${count}`,
      className: count > defaultCountValue[key] ? 'flash-button' : ''
    }
  }, [count])

  const sharedCountButtonProps = useMemo(() => {
    return {
      key: `sharedCount_${sharedCount}`,
      className:  sharedCount > defaultCountValue.sharedCount ? 'flash-button' : '',
    }
  }, [sharedCount])


  return <DiceCard text={`Counter ${type === '1' ?  '☝️' : '✌️'} Rending...`}>
  <button {...countButtonProps} onClick={() => countBox.setData((prev) => ({...prev, [key]: prev[key] + 1}))}>
    {key} is {count}
  </button>
  <button  {...sharedCountButtonProps} style={{marginTop: '.5em'}} onClick={() => countBox.setData((prev) => ({...prev, sharedCount: prev.sharedCount + 1}))}>
    sharedCount is {sharedCount}
  </button>
</DiceCard>
}


function DiceCard({children, text}: {children?: React.ReactNode; text?: React.ReactNode}) {
  return  <div className="dice-card">
    <div className="head">
      <AnimationDice text={text} />
    </div>
    <div className="content">
      {children}
    </div>
</div>
}


function AnimationDice({text = 'Render...'}: {text?: React.ReactNode}) {
  const textRef = React.useRef<HTMLDivElement>(null)
  const handleChangeTextStyle = (style = '') => {
    if(textRef.current === null) return
    textRef.current.setAttribute('style', style)
  }
  return <div className='dice-box'>
    <div 
      key={Date.now()}
      className='dice' 
      onAnimationStart={() => handleChangeTextStyle()} 
      onAnimationEnd={() => handleChangeTextStyle("opacity: 0; display: none;")}
    >
      🎲
    </div>
    <div ref={textRef} className='text'>{text}</div>
  </div>
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <DiceCard>{isOnline ? '✅ Online' : '❌ Disconnected'}</DiceCard>;
}



const deviceInfoBox = createBox(navigator.onLine)

function useOnlineStatus() {
  const isOnline = useSyncBoxStore(deviceInfoBox)
  React.useEffect(() => {
    const handler = () => deviceInfoBox.setData(navigator.onLine)

    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    };
  }, [])
  return isOnline;
}
