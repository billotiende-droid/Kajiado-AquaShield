from fastapi import APIRouter, HTTPException
from datetime import datetime
import json
from .database import get_latest_risk_assessment

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary():
    try:
        locations = ["Kajiado Central", "Magadi", "Loitokitok", "Namanga", "Isinya"]
        summary = {"locations": [], "overall_risk": "LOW", "timestamp": datetime.now().isoformat(), "critical_alerts": 0}
        risk_scores = []
        for loc in locations:
            risk = get_latest_risk_assessment(loc)
            if risk:
                summary["locations"].append({
                    "name": loc,
                    "risk_level": risk.get('risk_level', 'UNKNOWN'),
                    "risk_score": risk.get('risk_score', 0)
                })
                risk_scores.append(risk.get('risk_score', 0))
                if risk.get('risk_level') in ['CRITICAL', 'VERY_HIGH']: summary['critical_alerts'] += 1
        if risk_scores:
            avg = sum(risk_scores) / len(risk_scores)
            if avg > 0.6: summary['overall_risk'] = 'CRITICAL'
            elif avg > 0.4: summary['overall_risk'] = 'HIGH'
            elif avg > 0.2: summary['overall_risk'] = 'MODERATE'
            else: summary['overall_risk'] = 'LOW'
        return summary
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))