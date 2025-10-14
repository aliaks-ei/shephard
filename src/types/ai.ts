export interface PhotoAnalysisResult {
  expenseName: string
  amount: number
  categoryId: string
  categoryName: string
  confidence: number
  reasoning: string
}

export interface PhotoAnalysisRequest {
  imageBase64: string
  planId?: string
  currency: string
}
