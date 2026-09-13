import networkx as nx
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.entities import Project, WorkflowStage, ProcurementOrder, StageState

class CriticalPathEngine:
    @staticmethod
    def analyze_critical_path(db: Session, project_id: int) -> Dict[str, Any]:
        stages = db.query(WorkflowStage).filter(
            WorkflowStage.project_id == project_id
        ).order_by(WorkflowStage.order_index).all()

        if not stages:
            return {"critical_path": [], "bottlenecks": [], "graph_nodes": [], "graph_edges": []}

        G = nx.DiGraph()
        nodes_list = []
        edges_list = []

        # Add nodes with duration weights
        for idx, stage in enumerate(stages):
            planned_dur = max(1.0, (stage.planned_end - stage.planned_start).total_seconds() / 86400.0)
            actual_dur = max(planned_dur, (stage.actual_end - stage.actual_start).total_seconds() / 86400.0) if stage.actual_start and stage.actual_end else planned_dur
            
            # If delayed/blocked, inflate weight for critical path detection
            weight = actual_dur
            if stage.is_blocked:
                weight += 5.0

            G.add_node(
                stage.stage_name,
                duration=weight,
                department=stage.department_name,
                state=stage.state,
                is_blocked=stage.is_blocked
            )

            nodes_list.append({
                "id": stage.stage_name,
                "label": stage.stage_name,
                "department": stage.department_name,
                "state": stage.state,
                "duration_days": round(weight, 1),
                "is_blocked": stage.is_blocked
            })

        # Add linear & dependency edges
        for i in range(len(stages) - 1):
            source = stages[i].stage_name
            target = stages[i + 1].stage_name
            G.add_edge(source, target, weight=G.nodes[target]["duration"])
            edges_list.append({"source": source, "target": target})

        # Calculate longest path (Critical Path) using NetworkX dag_longest_path
        try:
            critical_path = nx.dag_longest_path(G, weight="duration")
        except Exception:
            critical_path = [s.stage_name for s in stages]

        # Detect Bottlenecks
        bottlenecks = []
        
        # Check procurement order delays
        delayed_procurements = db.query(ProcurementOrder).filter(
            ProcurementOrder.project_id == project_id,
            ProcurementOrder.status.in_(["DELAYED", "PENDING"])
        ).all()

        for po in delayed_procurements:
            if po.delay_days > 0 or po.status == "DELAYED":
                bottlenecks.append({
                    "stage_name": "Procurement",
                    "department": "Procurement Department",
                    "reason": f"Critical component '{po.component_name}' delayed (+{po.delay_days} days). Supplier: {po.supplier}",
                    "impact": f"+{po.delay_days} days schedule impact on Manufacturing.",
                    "severity": "HIGH"
                })

        # Check blocked stages
        for stage in stages:
            if stage.is_blocked:
                bottlenecks.append({
                    "stage_name": stage.stage_name,
                    "department": stage.department_name,
                    "reason": stage.block_reason or "Stage is blocked due to upstream revision/failure.",
                    "impact": "Downstream execution suspended.",
                    "severity": "CRITICAL"
                })

        return {
            "project_id": project_id,
            "critical_path": critical_path,
            "bottlenecks": bottlenecks,
            "graph_nodes": nodes_list,
            "graph_edges": edges_list
        }
