from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from database import chat_history_collection
from auth import get_current_user_id
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
import logging
import os

router = APIRouter(tags=["chat"])

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OLLAMA_URL = os.environ.get('OLLAMA_URL', '').strip()

SYSTEM_PROMPT = (
    "You are an expert agricultural AI advisor for AquaSense AI platform. "
    "You specialize in precision irrigation, crop health analysis, soil management, "
    "pest control, crop prediction, mandi pricing, government schemes, and farm finance. "
    "Provide clear, actionable advice to farmers. Be specific with recommendations."
)


async def _chat_gemini(message: str, session_id: str) -> str:
    chat = LlmChat(
        api_key=GEMINI_API_KEY, session_id=session_id, system_message=SYSTEM_PROMPT
    ).with_model("gemini", "gemini-3-pro-preview")
    return await chat.send_message(UserMessage(text=message))


async def _chat_ollama(message: str, session_id: str) -> str:
    history = await chat_history_collection.find(
        {"session_id": session_id}, {"_id": 0, "role": 1, "content": 1}
    ).sort("timestamp", -1).limit(10).to_list(10)
    history.reverse()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": os.environ.get("OLLAMA_MODEL", "llama3"), "messages": messages, "stream": False},
            timeout=aiohttp.ClientTimeout(total=120)
        ) as resp:
            if resp.status != 200:
                raise Exception(f"Ollama returned status {resp.status}")
            data = await resp.json()
            return data.get("message", {}).get("content", "No response from Ollama")


@router.post("/chat")
async def chat_with_advisor(request: dict, user_id: str = Depends(get_current_user_id)):
    message = request.get("message")
    session_id = request.get("session_id")
    try:
        response_text = await (_chat_ollama(message, session_id) if OLLAMA_URL else _chat_gemini(message, session_id))
        await chat_history_collection.insert_many([
            {"user_id": user_id, "session_id": session_id, "role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()},
            {"user_id": user_id, "session_id": session_id, "role": "assistant", "content": response_text, "timestamp": datetime.now(timezone.utc).isoformat()}
        ])
        return {"response": response_text, "timestamp": datetime.now(timezone.utc).isoformat(), "llm_mode": "ollama" if OLLAMA_URL else "gemini"}
    except Exception as e:
        logging.error(f"Chat error: {e}")
        return {"response": "I'm experiencing technical difficulties. Please check your sensor data and weather forecasts.", "timestamp": datetime.now(timezone.utc).isoformat(), "llm_mode": "error"}


@router.get("/chat/mode")
async def get_chat_mode():
    return {
        "mode": "ollama" if OLLAMA_URL else "gemini",
        "ollama_url": OLLAMA_URL if OLLAMA_URL else None,
        "ollama_model": os.environ.get("OLLAMA_MODEL", "llama3") if OLLAMA_URL else None,
    }
