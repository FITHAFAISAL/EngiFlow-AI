from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Requirement, RequirementVersion, Design, Simulation, Test, Document, AuditLog
from app.schemas.dtos import RequirementImpactDTO

class ImpactAnalysisEngine:
    @staticmethod
    def analyze_requirement_change(
        db: Session,
        requirement_id: int,
        new_target_value: str,
        new_specification_text: str,
        changed_by: str = "Lead Systems Engineer",
        change_reason: str = "Customer requested updated specification"
    ) -> RequirementImpactDTO:
        req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
        if not req:
            raise ValueError(f"Requirement {requirement_id} not found.")

        old_target = req.target_value or req.specification_text
        
        # Save version history
        latest_ver = len(req.versions) + 1
        new_version = RequirementVersion(
            requirement_id=req.id,
            version_number=latest_ver,
            title=req.title,
            specification_text=new_specification_text,
            target_value=new_target_value,
            changed_by=changed_by,
            change_reason=change_reason
        )
        db.add(new_version)

        # Update requirement fields & status
        req.target_value = new_target_value
        req.specification_text = new_specification_text
        req.verification_status = "UNVERIFIED"

        # Trace affected downstream engineering artifacts
        high_impact = []
        medium_impact = []
        low_impact = []

        # Find linked designs
        designs = db.query(Design).filter(Design.requirement_id == req.id).all()
        for d in designs:
            high_impact.append({
                "code": d.design_code,
                "type": "RF Design Model",
                "title": d.title,
                "action": "Aperture geometry re-optimization & feed network redesign required."
            })
            # Find linked simulations
            sims = db.query(Simulation).filter(Simulation.design_version_id.in_([v.id for v in d.versions])).all()
            for s in sims:
                high_impact.append({
                    "code": s.sim_code,
                    "type": "EM Simulation",
                    "title": s.name,
                    "action": "Re-run Ansys HFSS EM radiation pattern and S11 simulation."
                })
                # Find linked tests
                tests = db.query(Test).filter(Test.sim_id == s.id).all()
                for t in tests:
                    medium_impact.append({
                        "code": t.test_code,
                        "type": "Test Procedure",
                        "title": t.title,
                        "action": "Update anechoic chamber pass/fail acceptance threshold."
                    })

        # Add default documents & validation
        docs = db.query(Document).filter(Document.project_id == req.project_id).all()
        for doc in docs:
            low_impact.append({
                "code": doc.doc_code,
                "type": "Engineering Document",
                "title": doc.title,
                "action": "Re-generate traceability matrix & evidence compliance section."
            })

        # Recommended actions
        recommended_actions = [
            f"Review RF antenna aperture geometry for {req.req_code} ({new_target_value}).",
            "Trigger HFSS 3D EM simulation re-run to evaluate new gain/VSWR specs.",
            "Update Anechoic Chamber Test Acceptance Procedure criteria.",
            "Re-verify thermal & mechanical envelope compatibility.",
            "Re-issue baseline design review approval document."
        ]

        total_affected = len(high_impact) + len(medium_impact) + len(low_impact)

        # Audit log
        audit = AuditLog(
            project_id=req.project_id,
            user_name=changed_by,
            department="Requirements Engineering",
            action="REQUIREMENT_CHANGED",
            entity_type="Requirement",
            entity_id=req.req_code,
            details=f"Updated {req.req_code} target from '{old_target}' to '{new_target_value}'. Affected artifacts: {total_affected}."
        )
        db.add(audit)
        db.commit()

        return RequirementImpactDTO(
            requirement_code=req.req_code,
            old_value=old_target,
            new_value=new_target_value,
            total_affected_artifacts=total_affected,
            high_impact_artifacts=high_impact,
            medium_impact_artifacts=medium_impact,
            low_impact_artifacts=low_impact,
            recommended_actions=recommended_actions,
            critical_path_affected=True
        )
