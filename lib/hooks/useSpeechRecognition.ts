'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  onResult: (transcript: string, isFinal: boolean) => void
  onError: () => void
}

type SpeechRecognitionAlternative = {
  transcript: string
  confidence: number
}

type SpeechRecognitionResult = {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
  length: number
}

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult
  length: number
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionErrorEvent = {
  error: string
  message: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
}

export function useSpeechRecognition({ onResult, onError }: Options) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  })

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    setIsSupported(!!SR)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const recognition: SpeechRecognitionInstance = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.results.length - 1]
      onResultRef.current(result[0].transcript, result.isFinal)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted') return
      setIsListening(false)
      recognitionRef.current = null
      onErrorRef.current()
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}
