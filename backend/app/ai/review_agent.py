from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import WorkflowStage, Requirement, Simulation, Document
from app.schemas.dtos import AIReviewResultDTO

class AIReviewAgent:
    @staticmethod
    def perform_pre_review(db: Session, stage_id: int) -> AIReviewResultDTO:
        stage = db.query(WorkflowStage).filter(WorkflowStage.id == stage_id).first()
        if not stage:
            raise ValueError(f"Stage {stage_id} not found.")

        reqs = db.query(Requirement).filter(Requirement.project_id == stage.project_id).all()
        findings = []
        satisfied_count = 0
        missing_count = 0

        for r in reqs:
            if r.verification_status == "VERIFIED":
                satisfied_count += 1
                findings.append({
                    "req_code": r.req_code,
                    "status": "PASS",
                    "severity": "INFO",
                    "finding": f"Requirement {r.req_code} verified against simulation evidence.",
                    "evidence": r.target_value or r.specification_text
                })
            else:
                missing_count += 1
                severity = "HIGH" if r.category in ["Electrical/RF", "Thermal"] else "MEDIUM"
                findings.append({
                    "req_code": r.req_code,
                    "status": "MISSING_EVIDENCE",
                    "severity": severity,
                    "finding": f"No verified simulation report or thermal evidence attached for {r.req_code}.",
                    "evidence": "Verification pending."
                })

        # Add explicit thermal and mechanical checks
        thermal_found = any("Thermal" in r.category or "Temperature" in r.specification_text for r in reqs if r.verification_status == "VERIFIED")
        if not thermal_found:
            findings.append({
                "req_code": "REQ-004",
                "status": "WARNING",
                "severity": "HIGH",
                "finding": "REQ-004: No thermal simulation evidence (-40°C to +85°C) found in HFSS report.",
                "evidence": "Thermal Chamber test report pending."
            })

        rec = "SUGGEST_APPROVE" if missing_count <= 1 else "CAUTION_REJECT"

        return AIReviewResultDTO(
            stage_id=stage.id,
            stage_name=stage.stage_name,
            requirements_checked=len(reqs),
            requirements_satisfied=satisfied_count,
            missing_evidence_count=missing_count,
            findings=findings,
            ai_recommendation=rec
        )
