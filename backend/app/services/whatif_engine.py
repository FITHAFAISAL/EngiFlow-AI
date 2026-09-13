from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Project
from app.services.prediction_engine import PredictionEngine
from app.schemas.dtos import WhatIfRequestDTO, WhatIfResultDTO

class WhatIfEngine:
    @staticmethod
    def run_simulation(db: Session, project_id: int, req: WhatIfRequestDTO) -> WhatIfResultDTO:
        # Get baseline prediction first
        base_pred = PredictionEngine.predict_project_completion(db, project_id)
        if not base_pred:
            raise ValueError(f"Project {project_id} not found")

        orig_completion = base_pred["predicted_completion"]
        orig_delay = base_pred["predicted_delay_days"]

        # Calculate delta impacts deterministically
        delta_days = 0.0
        impacts = []
        recovery_opts = []

        if req.procurement_delay_days != 0:
            delta_days += req.procurement_delay_days * 1.1
            impacts.append(f"Procurement adjustment ({req.procurement_delay_days:+} days): impact {req.procurement_delay_days * 1.1:+.1f} days on manufacturing start.")

        if req.manufacturing_engineer_delta > 0:
            saved = min(4.0, req.manufacturing_engineer_delta * 2.5)
            delta_days -= saved
            impacts.append(f"Added {req.manufacturing_engineer_delta} manufacturing engineer(s): accelerated manufacturing stage by -{saved:.1f} days.")
            recovery_opts.append(f"Expediting manufacturing with +{req.manufacturing_engineer_delta} engineer(s) recovers {saved:.1f} days.")

        if req.simulation_rerun_cycles > 0:
            added = req.simulation_rerun_cycles * 3.5
            delta_days += added
            impacts.append(f"Added {req.simulation_rerun_cycles} simulation cycle(s): added +{added:.1f} days for HFSS re-mesh and solve.")

        if req.testing_delay_days != 0:
            delta_days += req.testing_delay_days
            impacts.append(f"Anechoic chamber testing schedule shift: {req.testing_delay_days:+} days.")

        new_total_delay = round(max(0.0, orig_delay + delta_days), 1)
        
        orig_dt = datetime.strptime(base_pred["planned_completion"], "%Y-%m-%d")
        simulated_dt = orig_dt + timedelta(days=new_total_delay)

        summary = " ".join(impacts) if impacts else "No parameter changes applied in simulation sandbox."
        if not recovery_opts:
            recovery_opts = ["Consider expediting component shipping via priority carrier.", "Schedule weekend parallel testing in second anechoic chamber."]

        return WhatIfResultDTO(
            original_completion=orig_completion,
            simulated_completion=simulated_dt.strftime("%Y-%m-%d"),
            schedule_variance_days=round(delta_days, 1),
            impact_summary=summary,
            recovery_opportunities=recovery_opts
        )
