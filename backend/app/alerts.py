from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
from .schemas import SMSAlert, AlertUpdate
from .database import insert_sms_alert, get_sms_alerts, update_sms_alert_status

router = APIRouter(prefix="/sms", tags=["alerts"])

@router.post("/alert")
def create_sms_alert(alert: SMSAlert):
    try:
        alert_id = insert_sms_alert(alert.recipient, alert.message, alert.location, alert.risk_level)
        return {"status": "success", "alert_id": alert_id, "timestamp": datetime.now().isoformat()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def list_sms_alerts(location: Optional[str] = None, limit: int = 50):
    try:
        alerts = get_sms_alerts(location, limit)
        return {"count": len(alerts), "location": location or "all", "alerts": alerts}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.post("/alert/{alert_id}/status")
def update_alert_status(alert_id: int, update: AlertUpdate):
    try:
        update_sms_alert_status(alert_id, update.status)
        return {"status": "success", "alert_id": alert_id, "new_status": update.status}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))