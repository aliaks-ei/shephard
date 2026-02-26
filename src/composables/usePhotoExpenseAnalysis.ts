import { ref, computed, type Ref } from 'vue'
import { analyzeExpensePhoto } from 'src/api/ai'
import type { PhotoAnalysisResult } from 'src/api/ai'
import { useError } from './useError'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_OPTIMIZED_DIMENSION_PX = 1600
const TARGET_OPTIMIZED_SIZE_BYTES = 1.5 * 1024 * 1024
const MIN_SIZE_FOR_OPTIMIZATION_BYTES = 256 * 1024
const INITIAL_JPEG_QUALITY = 0.82
const MIN_JPEG_QUALITY = 0.6
const JPEG_QUALITY_STEP = 0.08

type ImageDimensions = {
  width: number
  height: number
}

type Heic2Any = (options: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>

let heic2anyLoader: Promise<{ default: Heic2Any }> | null = null

const loadHeic2Any = async (): Promise<Heic2Any> => {
  if (!heic2anyLoader) {
    heic2anyLoader = import('heic2any') as Promise<{ default: Heic2Any }>
  }

  const module = await heic2anyLoader
  return module.default
}

const canOptimizeImage = (): boolean =>
  typeof document !== 'undefined' &&
  typeof Image !== 'undefined' &&
  typeof URL !== 'undefined' &&
  typeof URL.createObjectURL === 'function' &&
  typeof URL.revokeObjectURL === 'function' &&
  typeof HTMLCanvasElement !== 'undefined' &&
  typeof HTMLCanvasElement.prototype.toBlob === 'function'

const getTargetDimensions = (width: number, height: number): ImageDimensions => {
  if (width <= MAX_OPTIMIZED_DIMENSION_PX && height <= MAX_OPTIMIZED_DIMENSION_PX) {
    return { width, height }
  }

  const scale = Math.min(MAX_OPTIMIZED_DIMENSION_PX / width, MAX_OPTIMIZED_DIMENSION_PX / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

const loadImageFromFile = async (file: File): Promise<HTMLImageElement> => {
  const objectUrl = URL.createObjectURL(file)

  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    image.src = objectUrl
  })
}

const canvasToJpegBlob = async (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode optimized image'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })

const toOptimizedFileName = (fileName: string): string =>
  fileName.includes('.') ? fileName.replace(/\.[^.]+$/, '.jpg') : `${fileName}.jpg`

const optimizeImageForAnalysis = async (file: File): Promise<File> => {
  if (
    file.type === 'image/gif' ||
    file.size < MIN_SIZE_FOR_OPTIMIZATION_BYTES ||
    !canOptimizeImage()
  ) {
    return file
  }

  const image = await loadImageFromFile(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const { width, height } = getTargetDimensions(sourceWidth, sourceHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return file
  }

  context.drawImage(image, 0, 0, width, height)

  let quality = INITIAL_JPEG_QUALITY
  let optimizedBlob = await canvasToJpegBlob(canvas, quality)

  while (optimizedBlob.size > TARGET_OPTIMIZED_SIZE_BYTES && quality > MIN_JPEG_QUALITY) {
    quality = Math.max(MIN_JPEG_QUALITY, quality - JPEG_QUALITY_STEP)
    optimizedBlob = await canvasToJpegBlob(canvas, quality)
  }

  const isDownscaled = width < sourceWidth || height < sourceHeight
  const isSmaller = optimizedBlob.size < file.size

  if (!isDownscaled && !isSmaller) {
    return file
  }

  return new File([optimizedBlob], toOptimizedFileName(file.name), {
    type: 'image/jpeg',
  })
}

export function usePhotoExpenseAnalysis(
  planId?: Ref<string | null>,
  currency?: Ref<string | null>,
) {
  const { handleError } = useError()

  const isAnalyzing = ref(false)
  const photoFile = ref<File | null>(null)
  const analysisResult = ref<PhotoAnalysisResult | null>(null)
  const analysisError = ref<string | null>(null)

  async function convertHEICtoJPEG(file: File): Promise<File> {
    if (file.type !== 'image/heic') {
      return file
    }

    try {
      const heic2any = await loadHeic2Any()
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      })

      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
      if (!blob) {
        throw new Error('Conversion resulted in empty blob')
      }

      return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
      })
    } catch (error) {
      handleError('AI.PHOTO_CONVERSION_FAILED', error, { fileName: file.name })
      throw new Error('Failed to convert HEIC image')
    }
  }

  function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64 || '')
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleFileAdded(files: readonly File[]) {
    if (files.length === 0) return

    analysisError.value = null
    analysisResult.value = null

    let file = files[0]!

    // Validate file format - only allow formats OpenAI supports
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedFormats.includes(file.type)) {
      analysisError.value = `Unsupported format: ${file.type}. Please use JPEG, PNG, WebP, or HEIC.`
      handleError('AI.PHOTO_INVALID_FORMAT', new Error(`Unsupported format: ${file.type}`), {
        fileType: file.type,
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      analysisError.value = 'Photo size exceeds 5MB limit. Please choose a smaller image.'
      handleError('AI.PHOTO_TOO_LARGE', new Error('File too large'), {
        size: String(file.size),
      })
      return
    }

    if (file.type === 'image/heic') {
      try {
        file = await convertHEICtoJPEG(file)
      } catch {
        analysisError.value = 'Failed to convert HEIC image. Please try JPEG or PNG.'
        return
      }
    }

    try {
      file = await optimizeImageForAnalysis(file)
    } catch (error) {
      // Continue with original file if optimization fails.
      console.warn('Failed to optimize image for analysis', error)
    }

    photoFile.value = file

    await analyzePhoto()
  }

  async function analyzePhoto() {
    if (!photoFile.value) {
      analysisError.value = 'No photo selected'
      return null
    }

    isAnalyzing.value = true
    analysisError.value = null

    try {
      const base64Image = await convertToBase64(photoFile.value)
      const currentPlanId = planId?.value ?? undefined
      const currentCurrency = currency?.value ?? 'EUR'

      const result = await analyzeExpensePhoto(base64Image, currentPlanId, currentCurrency)

      if (result.confidence < 0.5) {
        analysisError.value =
          'Could not recognize expense details clearly. Please try a clearer photo or enter details manually.'
      }

      analysisResult.value = result
      return result
    } catch (error) {
      analysisError.value = 'Failed to analyze photo. Please try again or enter details manually.'
      handleError('AI.PHOTO_ANALYSIS_FAILED', error, {
        fileName: photoFile.value.name,
      })
      return null
    } finally {
      isAnalyzing.value = false
    }
  }

  function clearPhoto() {
    photoFile.value = null
    analysisResult.value = null
    analysisError.value = null
    isAnalyzing.value = false
  }

  return {
    isAnalyzing: computed(() => isAnalyzing.value),
    photoFile: computed(() => photoFile.value),
    analysisResult: computed(() => analysisResult.value),
    hasError: computed(() => !!analysisError.value),
    errorMessage: computed(() => analysisError.value),
    hasPhoto: computed(() => !!photoFile.value),
    handleFileAdded,
    analyzePhoto,
    clearPhoto,
  }
}
