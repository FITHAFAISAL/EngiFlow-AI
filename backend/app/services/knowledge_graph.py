from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.entities import (
    Project, Requirement, Design, Simulation, ProcurementOrder, Test, Document, WorkflowStage
)
from app.schemas.dtos import KnowledgeGraphDTO

class KnowledgeGraphEngine:
    @staticmethod
    def build_project_knowledge_graph(db: Session, project_id: int) -> KnowledgeGraphDTO:
        nodes = []
        edges = []

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return KnowledgeGraphDTO(nodes=[], edges=[])

        # Central Project Node
        nodes.append({
            "id": f"proj_{project.id}",
            "label": project.code,
            "title": project.name,
            "category": "Project",
            "color": "#3f51b5"
        })

        # Requirements
        reqs = db.query(Requirement).filter(Requirement.project_id == project_id).all()
        for r in reqs:
            r_id = f"req_{r.id}"
            nodes.append({
                "id": r_id,
                "label": r.req_code,
                "title": f"{r.title}: {r.target_value or r.specification_text}",
                "category": "Requirement",
                "color": "#00bcd4"
            })
            edges.append({
                "source": f"proj_{project.id}",
                "target": r_id,
                "relation": "DEFINES_REQUIREMENT"
            })

        # Designs & Revisions
        designs = db.query(Design).filter(Design.project_id == project_id).all()
        for d in designs:
            d_id = f"des_{d.id}"
            nodes.append({
                "id": d_id,
                "label": f"{d.design_code} (V{d.current_version_number})",
                "title": f"{d.title} by {d.designer_name}",
                "category": "Design",
                "color": "#9c27b0"
            })
            if d.requirement_id:
                edges.append({
                    "source": f"req_{d.requirement_id}",
                    "target": d_id,
                    "relation": "SATISFIED_BY"
                })

            # Simulations
            for v in d.versions:
                for s in v.simulations:
                    s_id = f"sim_{s.id}"
                    nodes.append({
                        "id": s_id,
                        "label": s.sim_code,
                        "title": f"HFSS Sim: Gain {s.measured_gain_dbi} dBi, VSWR {s.vswr} ({s.status})",
                        "category": "Simulation",
                        "color": "#4caf50" if s.status == "PASS" else "#f44336"
                    })
                    edges.append({
                        "source": d_id,
                        "target": s_id,
                        "relation": "VERIFIED_BY"
                    })

                    # Tests
                    for t in s.tests:
                        t_id = f"test_{t.id}"
                        nodes.append({
                            "id": t_id,
                            "label": t.test_code,
                            "title": f"{t.title} ({t.status})",
                            "category": "Test",
                            "color": "#ff9800"
                        })
                        edges.append({
                            "source": s_id,
                            "target": t_id,
                            "relation": "VALIDATED_BY"
                        })

        # Procurement Orders
        pos = db.query(ProcurementOrder).filter(ProcurementOrder.project_id == project_id).all()
        for po in pos:
            po_id = f"po_{po.id}"
            nodes.append({
                "id": po_id,
                "label": po.po_code,
                "title": f"{po.component_name} ({po.status})",
                "category": "Procurement",
                "color": "#e91e63"
            })
            edges.append({
                "source": f"proj_{project.id}",
                "target": po_id,
                "relation": "PROCURED_THROUGH"
            })

        # Documents
        docs = db.query(Document).filter(Document.project_id == project_id).all()
        for doc in docs:
            doc_id = f"doc_{doc.id}"
            nodes.append({
                "id": doc_id,
                "label": doc.doc_code,
                "title": doc.title,
                "category": "Document",
                "color": "#607d8b"
            })
            edges.append({
                "source": f"proj_{project.id}",
                "target": doc_id,
                "relation": "DOCUMENTED_BY"
            })

        return KnowledgeGraphDTO(nodes=nodes, edges=edges)
