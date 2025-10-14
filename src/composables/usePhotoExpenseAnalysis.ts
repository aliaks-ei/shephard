import { ref, computed, type Ref } from 'vue'
import heic2any from 'heic2any'
import { analyzeExpensePhoto } from 'src/api/ai'
import type { PhotoAnalysisResult } from 'src/api/ai'
import { useError } from './useError'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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
