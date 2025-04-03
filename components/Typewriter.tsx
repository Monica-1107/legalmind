"use client"

import { useState, useEffect } from "react"

interface TypewriterProps {
  texts: string[]
  delay: number
  loop?: boolean
}

export function Typewriter({ texts, delay, loop = true }: TypewriterProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const typeText = () => {
      const fullText = texts[currentTextIndex]
      setCurrentText((prev) =>
        isDeleting ? fullText.substring(0, prev.length - 1) : fullText.substring(0, prev.length + 1),
      )

      if (!isDeleting && currentText === fullText) {
        timeout = setTimeout(() => setIsDeleting(true), 1000)
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false)
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length)
        if (currentTextIndex === texts.length - 1 && !loop) {
          return
        }
      } else {
        timeout = setTimeout(typeText, delay)
      }
    }

    timeout = setTimeout(typeText, delay)

    return () => clearTimeout(timeout)
  }, [currentText, currentTextIndex, delay, isDeleting, loop, texts])

  return <span className="text-primary">{currentText}</span>
}

