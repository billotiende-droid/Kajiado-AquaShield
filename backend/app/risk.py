from fastapi import APIRouter, HTTPException
from datetime import datetime
from .schemas import RiskAssessmentRequest
from .database import get_latest_risk_assessment

router = APIRouter(prefix="/risk", tags=["risk"])

@router.post("/assessment")
def submit_risk_assessment(request: RiskAssessmentRequest):
    try:
        risk = get_latest_risk_assessment(request.location)
        if not risk:
            raise HTTPException(status_code=404, detail=f"No assessment found for {request.location}")
        return {"location": request.location, "risk_assessment": risk, "timestamp": datetime.now().isoformat()}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/{location}")
def get_risk(location: str):
    try:
        risk = get_latest_risk_assessment(location)
        if not risk: raise HTTPException(status_code=404, detail=f"No risk assessment found for {location}")
        return {"location": location, "risk_assessment": risk, "timestamp": datetime.now().isoformat()}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))