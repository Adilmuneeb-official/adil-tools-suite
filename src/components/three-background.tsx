'use client'

/**
 * Three.js 3D background — fixed version.
 * BUG FROM WP VERSION: animation didn't render because the canvas container
 * wasn't on every page and Three.js wasn't always loaded before the init script.
 *
 * FIX: this is a self-contained client component that:
 *  - Dynamically imports Three.js (no CDN dependency)
 *  - Creates its own canvas inside its own div
 *  - Renders on EVERY page (mounted in root layout)
 *  - Respects prefers-reduced-motion
 *  - Cleans up on unmount
 *  - Pauses on tab hidden
 */

import { useEffect, useRef } from 'react'

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let renderer: any, scene: any, camera: any, animationId: number | null = null
    let nodePoints: any, lineSegments: any, shape1: any, shape2: any, glowSprites: any[] = []
    const nodes: any[] = []
    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0, scrollY = 0
    let resizeTimer: any
    let isActive = true

    const init = async () => {
      const THREE = await import('three')
      if (!isActive || !containerRef.current) return

      const container = containerRef.current
      scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x06070d, 0.0085)

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.set(0, 0, 60)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: window.matchMedia('(max-width: 768px)').matches ? 'default' : 'high-performance' })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x06070d, 0)
      container.appendChild(renderer.domElement)

      // Adaptive node count
      const w = window.innerWidth
      let nodeCount = 60
      if (w < 480) nodeCount = 30
      else if (w < 768) nodeCount = 50
      else if (w < 1280) nodeCount = 90
      else if (w < 1920) nodeCount = 140
      else nodeCount = 200
      nodeCount = Math.min(nodeCount, 220)

      const bounds = { x: 80, y: 50, z: 40 }
      const colors = [0x22d3ee, 0xe83bff, 0x9bff6b]
      const positions = new Float32Array(nodeCount * 3)
      const colorArr = new Float32Array(nodeCount * 3)

      for (let i = 0; i < nodeCount; i++) {
        const x = (Math.random() - 0.5) * bounds.x * 2
        const y = (Math.random() - 0.5) * bounds.y * 2
        const z = (Math.random() - 0.5) * bounds.z * 2
        nodes.push({
          x, y, z,
          vx: (Math.random() - 0.5) * 0.03,
          vy: (Math.random() - 0.5) * 0.03,
          vz: (Math.random() - 0.5) * 0.03,
        })
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z
        const c = new THREE.Color(colors[i % colors.length])
        colorArr[i * 3] = c.r; colorArr[i * 3 + 1] = c.g; colorArr[i * 3 + 2] = c.b
      }
      const nodeGeom = new THREE.BufferGeometry()
      nodeGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      nodeGeom.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))
      const nodeMat = new THREE.PointsMaterial({
        size: 0.7, vertexColors: true, transparent: true, opacity: 0.9,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      nodePoints = new THREE.Points(nodeGeom, nodeMat)
      scene.add(nodePoints)

      // Line buffer
      const maxLines = Math.min(nodeCount * 12, 1500)
      const linePositions = new Float32Array(maxLines * 6)
      const lineColors = new Float32Array(maxLines * 6)
      const lineGeom = new THREE.BufferGeometry()
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
      lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      lineSegments = new THREE.LineSegments(lineGeom, lineMat)
      scene.add(lineSegments)

      const connectDist = window.matchMedia('(max-width: 768px)').matches ? 9 : 12
      const connectDistSq = connectDist * connectDist

      // Wireframe shapes
      shape1 = new THREE.Mesh(
        new THREE.IcosahedronGeometry(14, 0),
        new THREE.MeshBasicMaterial({ color: 0xe83bff, wireframe: true, transparent: true, opacity: 0.18 })
      )
      shape1.position.set(-22, 10, -10)
      scene.add(shape1)
      shape2 = new THREE.Mesh(
        new THREE.TorusGeometry(10, 2.2, 12, 36),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.18 })
      )
      shape2.position.set(24, -8, -5)
      scene.add(shape2)

      // Glow sprites
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 128
      const ctx = canvas.getContext('2d')!
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(34,211,238,0.9)')
      grad.addColorStop(0.5, 'rgba(34,211,238,0.2)')
      grad.addColorStop(1, 'rgba(34,211,238,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 128, 128)
      const glowTex = new THREE.CanvasTexture(canvas)
      glowTex.needsUpdate = true
      for (let i = 0; i < 4; i++) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, transparent: true, opacity: 0.35,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }))
        const s = 12 + Math.random() * 16
        sprite.scale.set(s, s, 1)
        sprite.position.set(
          (Math.random() - 0.5) * bounds.x * 1.6,
          (Math.random() - 0.5) * bounds.y * 1.4,
          (Math.random() - 0.5) * 20,
        )
        sprite.userData = { speed: 0.005 + Math.random() * 0.008, phase: Math.random() * Math.PI * 2 }
        scene.add(sprite)
        glowSprites.push(sprite)
      }

      // Animation loop
      const animate = () => {
        if (!isActive) return
        animationId = requestAnimationFrame(animate)
        const posAttr = nodeGeom.attributes.position
        for (let i = 0; i < nodeCount; i++) {
          const n = nodes[i]
          n.x += n.vx; n.y += n.vy; n.z += n.vz
          if (Math.abs(n.x) > bounds.x) n.vx *= -1
          if (Math.abs(n.y) > bounds.y) n.vy *= -1
          if (Math.abs(n.z) > bounds.z) n.vz *= -1
          posAttr.array[i * 3] = n.x
          posAttr.array[i * 3 + 1] = n.y
          posAttr.array[i * 3 + 2] = n.z
        }
        posAttr.needsUpdate = true
        // Lines
        let lineIdx = 0
        for (let i = 0; i < nodeCount; i++) {
          for (let j = i + 1; j < nodeCount; j++) {
            const a = nodes[i], b = nodes[j]
            const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
            const dSq = dx * dx + dy * dy + dz * dz
            if (dSq < connectDistSq && lineIdx < maxLines) {
              const alpha = 1 - (dSq / connectDistSq)
              const ci = i * 3, cj = j * 3
              linePositions[lineIdx * 6] = a.x
              linePositions[lineIdx * 6 + 1] = a.y
              linePositions[lineIdx * 6 + 2] = a.z
              linePositions[lineIdx * 6 + 3] = b.x
              linePositions[lineIdx * 6 + 4] = b.y
              linePositions[lineIdx * 6 + 5] = b.z
              lineColors[lineIdx * 6] = colorArr[ci] * alpha
              lineColors[lineIdx * 6 + 1] = colorArr[ci + 1] * alpha
              lineColors[lineIdx * 6 + 2] = colorArr[ci + 2] * alpha
              lineColors[lineIdx * 6 + 3] = colorArr[cj] * alpha
              lineColors[lineIdx * 6 + 4] = colorArr[cj + 1] * alpha
              lineColors[lineIdx * 6 + 5] = colorArr[cj + 2] * alpha
              lineIdx++
            }
          }
        }
        for (let k = lineIdx; k < maxLines; k++) {
          linePositions[k * 6] = linePositions[k * 6 + 1] = linePositions[k * 6 + 2] = 0
          linePositions[k * 6 + 3] = linePositions[k * 6 + 4] = linePositions[k * 6 + 5] = 0
        }
        lineGeom.attributes.position.needsUpdate = true
        lineGeom.attributes.color.needsUpdate = true
        lineGeom.setDrawRange(0, lineIdx * 2)

        // Rotate shapes
        shape1.rotation.x += 0.002; shape1.rotation.y += 0.003
        shape2.rotation.x -= 0.003; shape2.rotation.y += 0.0025

        // Sprite drift
        const t = performance.now() * 0.001
        for (const sp of glowSprites) {
          sp.position.x += Math.sin(t + sp.userData.phase) * sp.userData.speed
          sp.position.y += Math.cos(t * 0.7 + sp.userData.phase) * sp.userData.speed
        }

        // Camera parallax + scroll dolly
        mouseX += (targetMouseX - mouseX) * 0.05
        mouseY += (targetMouseY - mouseY) * 0.05
        camera.position.x = mouseX * 6
        camera.position.y = -mouseY * 4
        camera.position.z = 60 - Math.min(scrollY * 0.02, 20)
        camera.lookAt(0, 0, 0)

        renderer.render(scene, camera)
      }
      animate()

      // Event handlers
      const onMouse = (e: MouseEvent) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2
      }
      const onScroll = () => { scrollY = window.scrollY }
      const onResize = () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (!camera || !renderer) return
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }, 120)
      }
      const onVisibility = () => {
        if (document.hidden) {
          if (animationId) { cancelAnimationFrame(animationId); animationId = null }
        } else if (!animationId && isActive) {
          animate()
        }
      }
      window.addEventListener('mousemove', onMouse, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibility)
    }

    init()

    return () => {
      isActive = false
      if (animationId) cancelAnimationFrame(animationId)
      if (renderer) {
        renderer.dispose?.()
        if (renderer.domElement?.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
      nodePoints?.geometry?.dispose?.()
      nodePoints?.material?.dispose?.()
      lineSegments?.geometry?.dispose?.()
      lineSegments?.material?.dispose?.()
      shape1?.geometry?.dispose?.()
      shape1?.material?.dispose?.()
      shape2?.geometry?.dispose?.()
      shape2?.material?.dispose?.()
      for (const sp of glowSprites) sp?.material?.dispose?.()
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="three-bg" aria-hidden="true" />
      <div className="bg-orbs" aria-hidden="true">
        <span className="bg-orb bg-orb-1"></span>
        <span className="bg-orb bg-orb-2"></span>
        <span className="bg-orb bg-orb-3"></span>
      </div>
    </>
  )
}
