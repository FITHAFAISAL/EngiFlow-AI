from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.whatif_engine import WhatIfEngine
from app.schemas.dtos import WhatIfRequestDTO

router = APIRouter(prefix="/api/whatif", tags=["What-If Simulator"])

@router.post("/project/{project_id}/simulate")
def run_whatif_simulation(project_id: int, payload: WhatIfRequestDTO, db: Session = Depends(get_db)):
    result = WhatIfEngine.run_simulation(db, project_id, payload)
    return result
