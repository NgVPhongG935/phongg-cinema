import { useEffect, useRef } from 'react'

/** Update the light and perspective without re-rendering the movie catalog. */
export default function DepthSurface({ as: Tag = 'div', className = '', children, style, ...props }) {
  const surface = useRef(null)
  const frame = useRef(null)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const reset = () => {
    cancelAnimationFrame(frame.current)
    const node = surface.current
    if (!node) return
    for (const variable of ['--depth-x', '--depth-y', '--light-x', '--light-y']) node.style.removeProperty(variable)
  }

  const move = (event) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    const node = surface.current
    const bounds = node.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      node.style.setProperty('--depth-x', `${(0.5 - y) * 9}deg`)
      node.style.setProperty('--depth-y', `${(x - 0.5) * 12}deg`)
      node.style.setProperty('--light-x', `${x * 100}%`)
      node.style.setProperty('--light-y', `${y * 100}%`)
    })
  }

  return <Tag {...props} ref={surface} style={style} className={`depth-surface ${className}`} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}>{children}</Tag>
}
