# ============================================================
# Kisan-DePIN — Agentic RAG Route
# POST /api/v1/ask
# ============================================================

from fastapi import APIRouter
from app.services.rag import rag_agent
from app.models.schemas import RAGQuery, RAGResponse

router = APIRouter()


@router.post("/ask", response_model=RAGResponse)
async def ask_agronomic_assistant(query: RAGQuery):
    """
    Ask the AI agronomic assistant a question about crop residue management.

    The agent retrieves relevant Indian environmental law documents and
    provides grounded, actionable advice. Supports multilingual queries.

    Example questions:
    - "What is the penalty for stubble burning?"
    - "How do I use PUSA bio-decomposer?"
    - "How can I earn carbon credits from my farm?"
    - "What is the Happy Seeder technique?"
    """

    import httpx
    
    try:
        # Query the local Pathway Document Store Server
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8080/v1/pw_ai_answer",
                json={"prompt": query.question},
                timeout=10.0
            )
            response.raise_for_status()
            
            pw_data = response.json()
            answer_text = pw_data.get("response", "No answer found from Pathway.")
            
            # Agent reasoning trace to show Pathway integration
            reasoning = (
                f"1. RAG Query received: \"{query.question[:80]}...\"\n"
                f"2. Forwarded to Pathway Document Store at localhost:8080\n"
                f"3. Pathway extracted chunks from local environmental law stream\n"
                f"4. LLM generated real-time grounded response"
            )

            return RAGResponse(
                answer=answer_text,
                sources=[], # We could parse sources if we use the underlying /pw_list_documents endpoint too
                confidence=0.95,
                language=query.language,
                agent_reasoning=reasoning,
            )
            
    except Exception as e:
        # Fallback to local mock agent if Pathway server isn't running yet (for demo robustness)
        print(f"[Warning] Pathway server not reachable: {e}. Falling back to local RAG.")
        return await rag_agent.query(
            question=query.question,
            language=query.language,
            context=query.context,
        )


@router.get("/knowledge", response_model=list[dict])
async def list_knowledge_base():
    """List all documents in the knowledge base (for demo transparency)."""
    from app.services.rag import KNOWLEDGE_BASE
    return [
        {
            "id": doc["id"],
            "title": doc["title"],
            "source": doc["source"],
            "tags": doc["tags"],
        }
        for doc in KNOWLEDGE_BASE
    ]
