from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.prediction_engine import PredictionEngine
from app.services.critical_path_engine import CriticalPathEngine

router = APIRouter(prefix="/api/predictions", tags=["Predictions & Critical Path"])

@router.get("/project/{project_id}")
def get_project_predictions(project_id: int, db: Session = Depends(get_db)):
    pred = PredictionEngine.predict_project_completion(db, project_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found")
    return pred

@router.get("/project/{project_id}/critical-path")
def get_critical_path(project_id: int, db: Session = Depends(get_db)):
    res = CriticalPathEngine.analyze_critical_path(db, project_id)
    return res
