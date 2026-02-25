import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { usePhotoExpenseAnalysis } from './usePhotoExpenseAnalysis'
import type { PhotoAnalysisResult } from 'src/api/ai'
import * as aiApi from 'src/api/ai'
import * as errorComposable from './useError'
import heic2any from 'heic2any'

vi.mock('src/api/ai', () => ({
  analyzeExpensePhoto: vi.fn(),
}))

vi.mock('./useError', () => ({
  useError: vi.fn(),
}))

vi.mock('heic2any', () => ({
  default: vi.fn(),
}))

const mockAnalyzeExpensePhoto = vi.mocked(aiApi.analyzeExpensePhoto)
const mockHandleError = vi.fn()
const mockHeic2any = vi.mocked(heic2any)

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  vi.mocked(errorComposable.useError).mockReturnValue({
    handleError: mockHandleError,
  })
})

describe('usePhotoExpenseAnalysis', () => {
  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { isAnalyzing, photoFile, analysisResult, hasError, errorMessage, hasPhoto } =
        usePhotoExpenseAnalysis()

      expect(isAnalyzing.value).toBe(false)
      expect(photoFile.value).toBeNull()
      expect(analysisResult.value).toBeNull()
      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBeNull()
      expect(hasPhoto.value).toBe(false)
    })
  })

  describe('handleFileAdded', () => {
    it('should do nothing when files array is empty', async () => {
      const { handleFileAdded } = usePhotoExpenseAnalysis()

      await handleFileAdded([])

      expect(mockAnalyzeExpensePhoto).not.toHaveBeenCalled()
    })

    it('should reject unsupported image formats like AVIF', async () => {
      const { handleFileAdded, hasError, errorMessage } = usePhotoExpenseAnalysis()

      const avifFile = new File(['avif-data'], 'photo.avif', { type: 'image/avif' })

      await handleFileAdded([avifFile])

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toContain('Unsupported format')
      expect(errorMessage.value).toContain('image/avif')
      expect(mockHandleError).toHaveBeenCalledWith(
        'AI.PHOTO_INVALID_FORMAT',
        expect.any(Error),
        expect.objectContaining({ fileType: 'image/avif' }),
      )
      expect(mockAnalyzeExpensePhoto).not.toHaveBeenCalled()
    })

    it('should set error when file size exceeds 5MB', async () => {
      const { handleFileAdded, hasError, errorMessage } = usePhotoExpenseAnalysis()

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      await handleFileAdded([largeFile])

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toContain('5MB limit')
      expect(mockHandleError).toHaveBeenCalledWith(
        'AI.PHOTO_TOO_LARGE',
        expect.any(Error),
        expect.objectContaining({ size: String(largeFile.size) }),
      )
      expect(mockAnalyzeExpensePhoto).not.toHaveBeenCalled()
    })

    it('should convert HEIC files to JPEG before analysis', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Test Expense',
        amount: 50.0,
        categoryId: 'cat-1',
        categoryName: 'Food',
        confidence: 0.9,
        reasoning: 'Clear receipt',
      }

      const heicFile = new File(['heic-data'], 'photo.heic', { type: 'image/heic' })
      const jpegBlob = new Blob(['jpeg-data'], { type: 'image/jpeg' })

      mockHeic2any.mockResolvedValue(jpegBlob)
      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      // Mock FileReader to immediately call onload
      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded } = usePhotoExpenseAnalysis()

      await handleFileAdded([heicFile])

      expect(mockHeic2any).toHaveBeenCalledWith({
        blob: heicFile,
        toType: 'image/jpeg',
        quality: 0.9,
      })
      expect(mockAnalyzeExpensePhoto).toHaveBeenCalled()
    })

    it('should handle HEIC conversion failure', async () => {
      const heicFile = new File(['heic-data'], 'photo.heic', { type: 'image/heic' })

      mockHeic2any.mockRejectedValue(new Error('Conversion failed'))

      const { handleFileAdded, hasError, errorMessage } = usePhotoExpenseAnalysis()

      await handleFileAdded([heicFile])

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toContain('Failed to convert HEIC')
      expect(mockHandleError).toHaveBeenCalledWith(
        'AI.PHOTO_CONVERSION_FAILED',
        expect.any(Error),
        expect.objectContaining({ fileName: 'photo.heic' }),
      )
    })

    it('should analyze photo automatically after file is added', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Grocery Store',
        amount: 45.99,
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        confidence: 0.9,
        reasoning: 'Clear receipt',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded, analysisResult } = usePhotoExpenseAnalysis()

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      await handleFileAdded([validFile])

      expect(mockAnalyzeExpensePhoto).toHaveBeenCalledWith(
        'data:image/jpeg;base64,mockbase64data',
        undefined,
        'EUR',
      )
      expect(analysisResult.value).toEqual(mockResult)
    })

    it('should optimize images before sending for analysis when browser APIs are available', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Optimized Receipt',
        amount: 12.34,
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        confidence: 0.92,
        reasoning: 'Readable optimized image',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const createObjectURLMock = vi.fn(() => 'blob:optimized-image')
      const revokeObjectURLMock = vi.fn()
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      })

      class MockImage {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        naturalWidth = 3200
        naturalHeight = 1800
        width = 3200
        height = 1800

        set src(_value: string) {
          setTimeout(() => {
            this.onload?.()
          }, 0)
        }
      }
      vi.stubGlobal('Image', MockImage)

      const drawImageMock = vi.fn()
      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue({ drawImage: drawImageMock } as unknown as CanvasRenderingContext2D)
      const toBlobSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'toBlob')
        .mockImplementation((callback: BlobCallback) => {
          callback(new Blob(['optimized-image'], { type: 'image/jpeg' }))
        })

      const readAsDataURLMock = vi.fn(function (this: { onload: (() => void) | null }) {
        if (this.onload) {
          this.onload()
        }
      })

      const mockFileReader = {
        readAsDataURL: readAsDataURLMock,
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,optimizedbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded } = usePhotoExpenseAnalysis()

      const largePngFile = new File(['x'.repeat(300_000)], 'receipt.png', { type: 'image/png' })
      await handleFileAdded([largePngFile])

      expect(createObjectURLMock).toHaveBeenCalled()
      expect(getContextSpy).toHaveBeenCalled()
      expect(toBlobSpy).toHaveBeenCalled()
      expect(readAsDataURLMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'image/jpeg',
          name: 'receipt.jpg',
        }),
      )
      expect(mockAnalyzeExpensePhoto).toHaveBeenCalledWith(
        'data:image/jpeg;base64,optimizedbase64data',
        undefined,
        'EUR',
      )
    })
  })

  describe('analyzePhoto', () => {
    it('should return null and set error when no photo is selected', async () => {
      const { analyzePhoto, hasError, errorMessage } = usePhotoExpenseAnalysis()

      const result = await analyzePhoto()

      expect(result).toBeNull()
      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toBe('No photo selected')
    })

    it('should set loading state while analyzing', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Restaurant',
        amount: 25.5,
        categoryId: 'cat-2',
        categoryName: 'Dining',
        confidence: 0.85,
        reasoning: 'Restaurant receipt',
      }

      let resolvePromise: (value: PhotoAnalysisResult) => void
      const promise = new Promise<PhotoAnalysisResult>((resolve) => {
        resolvePromise = resolve
      })
      mockAnalyzeExpensePhoto.mockReturnValue(promise)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            setTimeout(() => {
              if (this.onload) this.onload()
            }, 0)
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded, isAnalyzing } = usePhotoExpenseAnalysis()

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      const fileAddedPromise = handleFileAdded([validFile])

      await nextTick()
      expect(isAnalyzing.value).toBe(true)

      resolvePromise!(mockResult)
      await fileAddedPromise

      expect(isAnalyzing.value).toBe(false)
    })

    it('should use planId and currency from refs', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Gas Station',
        amount: 50.0,
        categoryId: 'cat-3',
        categoryName: 'Transportation',
        confidence: 0.88,
        reasoning: 'Gas receipt',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const planId = ref('plan-123')
      const currency = ref('USD')

      const { handleFileAdded } = usePhotoExpenseAnalysis(planId, currency)

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      await handleFileAdded([validFile])

      expect(mockAnalyzeExpensePhoto).toHaveBeenCalledWith(
        'data:image/jpeg;base64,mockbase64data',
        'plan-123',
        'USD',
      )
    })

    it('should default to EUR when currency not provided', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Store',
        amount: 10.0,
        categoryId: 'cat-1',
        categoryName: 'Shopping',
        confidence: 0.7,
        reasoning: 'Receipt detected',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const planId = ref('plan-123')
      const { handleFileAdded } = usePhotoExpenseAnalysis(planId)

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      await handleFileAdded([validFile])

      expect(mockAnalyzeExpensePhoto).toHaveBeenCalledWith(
        'data:image/jpeg;base64,mockbase64data',
        'plan-123',
        'EUR',
      )
    })

    it('should set error message when confidence is below 0.5', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Unknown',
        amount: 0,
        categoryId: 'cat-default',
        categoryName: 'Other',
        confidence: 0.3,
        reasoning: 'Image too blurry',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded, hasError, errorMessage, analysisResult } = usePhotoExpenseAnalysis()

      const validFile = new File(['image-data'], 'blurry.jpg', { type: 'image/jpeg' })

      const fileAddedPromise = handleFileAdded([validFile])

      if (mockFileReader.onload) {
        mockFileReader.onload()
      }

      await fileAddedPromise

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toContain('Could not recognize')
      expect(analysisResult.value).toEqual(mockResult)
    })

    it('should handle API errors gracefully', async () => {
      mockAnalyzeExpensePhoto.mockRejectedValue(new Error('API error'))

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const { handleFileAdded, hasError, errorMessage, analysisResult } = usePhotoExpenseAnalysis()

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      await handleFileAdded([validFile])

      expect(hasError.value).toBe(true)
      expect(errorMessage.value).toContain('Failed to analyze photo')
      expect(analysisResult.value).toBeNull()
      expect(mockHandleError).toHaveBeenCalledWith(
        'AI.PHOTO_ANALYSIS_FAILED',
        expect.any(Error),
        expect.objectContaining({ fileName: 'receipt.jpg' }),
      )
    })
  })

  describe('clearPhoto', () => {
    it('should clear all state', async () => {
      const mockResult: PhotoAnalysisResult = {
        expenseName: 'Test',
        amount: 10.0,
        categoryId: 'cat-1',
        categoryName: 'Test',
        confidence: 0.9,
        reasoning: 'Test',
      }

      mockAnalyzeExpensePhoto.mockResolvedValue(mockResult)

      const mockFileReader = {
        readAsDataURL: vi.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) {
            this.onload()
          }
        }),
        onload: null as unknown as (() => void) | null,
        onerror: null as unknown as (() => void) | null,
        result: 'data:image/jpeg;base64,mockbase64data',
      }
      vi.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      )

      const {
        handleFileAdded,
        clearPhoto,
        photoFile,
        analysisResult,
        hasError,
        isAnalyzing,
        hasPhoto,
      } = usePhotoExpenseAnalysis()

      const validFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' })

      await handleFileAdded([validFile])

      expect(hasPhoto.value).toBe(true)
      expect(analysisResult.value).not.toBeNull()

      clearPhoto()

      expect(photoFile.value).toBeNull()
      expect(analysisResult.value).toBeNull()
      expect(hasError.value).toBe(false)
      expect(isAnalyzing.value).toBe(false)
      expect(hasPhoto.value).toBe(false)
    })
  })
})
