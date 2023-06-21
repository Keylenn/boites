import './style.css'
import createBox from '../lib'
import viteLogo from './vite.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.npmjs.com/package/@boites/core" target="_blank" class="package">
      <code>📦@boites/core</code>
    </a>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite Logo and Package Name to learn more
    </p>
  </div>
`

const countBox = createBox(0)
  
setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

function setupCounter(element: HTMLButtonElement) {
  const setCounter = () => {
    element.innerHTML = `count is ${countBox.getData()}`
  }
  element.addEventListener('click', () => {
    countBox.setData(c => c + 1)
    setCounter()
  })
  setCounter()
}
