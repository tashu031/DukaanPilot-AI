from fastapi import APIRouter
from backend.app.schemas import (
    AIOrderExtractRequest,
    AIOrderExtractResponse,
    AIChatRequest,
    AIChatResponse
)
from backend.app.services.ai_service import (
    check_ollama_status,
    extract_order_with_ai,
    answer_business_assistant_query
)

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

@router.get("/status")
async def get_ai_status():
    return await check_ollama_status()

@router.post("/extract-order", response_model=AIOrderExtractResponse)
async def extract_order(payload: AIOrderExtractRequest):
    draft, source_model, confidence = await extract_order_with_ai(payload.text)
    return {
        "success": True,
        "source_model": source_model,
        "confidence": confidence,
        "extracted_data": draft,
        "raw_message": payload.text
    }

@router.post("/chat", response_model=AIChatResponse)
async def assistant_chat(payload: AIChatRequest):
    result = await answer_business_assistant_query(payload.message)
    return result
