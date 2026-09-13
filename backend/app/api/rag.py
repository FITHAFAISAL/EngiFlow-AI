from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.rag_engine import RAGEngine
from app.services.knowledge_graph import KnowledgeGraphEngine
from app.schemas.dtos import RAGQueryRequestDTO

router_rag = APIRouter(prefix="/api/rag", tags=["Document RAG"])
router_graph = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])

@router_rag.post("/query")
def query_rag_docs(payload: RAGQueryRequestDTO, db: Session = Depends(get_db)):
    res = RAGEngine.query_engineering_docs(db, payload.project_id, payload.query)
    return res

@router_graph.get("/project/{project_id}")
def get_knowledge_graph(project_id: int, db: Session = Depends(get_db)):
    kg = KnowledgeGraphEngine.build_project_knowledge_graph(db, project_id)
    return kg
