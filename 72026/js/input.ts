export interface InputState {
  left: boolean
  right: boolean
  mouseX: number | null
  useMouse: boolean
}

export function createInputState(): InputState {
  return {
    left: false,
    right: false,
    mouseX: null,
    useMouse: false,
  }
}

export function setupInputListeners(input: InputState): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      input.left = true
      input.useMouse = false
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      input.right = true
      input.useMouse = false
    }
  })

  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      input.left = false
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      input.right = false
    }
  })

  document.addEventListener('mousemove', (e) => {
    input.mouseX = e.clientX
    input.useMouse = true
  })

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      input.mouseX = e.touches[0].clientX
      input.useMouse = true
    }
  })

  document.addEventListener('touchend', () => {
    input.mouseX = null
    input.useMouse = false
  })
}
