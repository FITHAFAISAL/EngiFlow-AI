import re
import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Document, DocumentChunk
from app.schemas.dtos import RAGQueryResponseDTO

class RAGEngine:
    @staticmethod
    def query_engineering_docs(db: Session, project_id: int, query: str) -> RAGQueryResponseDTO:
        chunks = db.query(DocumentChunk).join(Document).filter(
            Document.project_id == project_id
        ).all()

        if not chunks:
            return RAGQueryResponseDTO(
                query=query,
                answer="No engineering documents uploaded for this project.",
                confidence=0.0,
                sources=[],
                has_insufficient_evidence=True
            )

        query_terms = set(re.findall(r'\w+', query.lower()))

        scored_chunks = []
        for chk in chunks:
            text = chk.chunk_text.lower()
            doc_title = chk.document.title
            doc_code = chk.document.doc_code

            # Compute term overlap score
            matches = sum(1 for term in query_terms if term in text)
            score = matches / max(1, len(query_terms))

            # Domain keyword boosting (e.g. gain, vswr, frequency, thermal, test)
            for key in ["gain", "vswr", "frequency", "temperature", "dbi", "ghz", "thermal", "anechoic", "chamber"]:
                if key in query.lower() and key in text:
                    score += 0.25

            if score > 0.15:
                scored_chunks.append({
                    "doc_code": doc_code,
                    "doc_title": doc_title,
                    "section": chk.section_title or "General",
                    "text": chk.chunk_text,
                    "score": min(1.0, score)
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)

        if not scored_chunks:
            return RAGQueryResponseDTO(
                query=query,
                answer="No supporting evidence found in uploaded engineering documents.",
                confidence=0.0,
                sources=[],
                has_insufficient_evidence=True
            )

        top_sources = scored_chunks[:3]
        best_source = top_sources[0]

        # Formulate evidence-backed response string
        answer_text = f"Based on verified document '{best_source['doc_title']}' [{best_source['doc_code']}]:\n\n\"{best_source['text']}\""

        return RAGQueryResponseDTO(
            query=query,
            answer=answer_text,
            confidence=round(best_source["score"], 2),
            sources=top_sources,
            has_insufficient_evidence=False
        )
