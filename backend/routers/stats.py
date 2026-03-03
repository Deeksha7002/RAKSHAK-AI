import logging
from datetime import datetime, timedelta, timezone as tz
from typing import List, Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import Case, Stats
from dependencies import get_db
from schemas import ReportRequest

router = APIRouter(prefix="/api", tags=["statistics"])

def get_or_create_stats(db: Session):
    stats = db.query(Stats).first()
    if not stats:
        stats = Stats()
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    stats = get_or_create_stats(db)
    
    def get_stats_for_range(time_threshold):
        cases = db.query(Case).filter(Case.created_at >= time_threshold).all()
        scams = [c for c in cases if c.classification == "scam"]
        safe = [c for c in cases if c.classification == "safe"]
        
        # Calculate types breakdown
        types = {}
        for c in scams:
            t = c.scam_type or "Unknown"
            types[t] = types.get(t, 0) + 1
            
        return {
            "total_intercepted": len(cases),
            "scams_prevented": len(scams),
            "safe_conversations": len(safe),
            "breakdown": types
        }

    now = datetime.now(tz.utc)
    return {
        "today": get_stats_for_range(now - timedelta(days=1)),
        "week": get_stats_for_range(now - timedelta(days=7)),
        "month": get_stats_for_range(now - timedelta(days=30)),
        "all_time": {
            "total_intercepted": stats.total_intercepted,
            "scams_prevented": stats.scams_prevented,
            "safe_conversations": stats.safe_conversations,
            "current_threat_level": stats.current_threat_level
        }
    }

@router.get("/cases")
def get_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).limit(50).all()
    return cases

@router.post("/report")
async def submit_report(report: ReportRequest, db: Session = Depends(get_db)):
    """Receives official scam reports from the frontend."""
    new_case = Case(
        conversation_id=report.conversationId,
        scammer_name=report.scammerName,
        platform=report.platform,
        classification=report.classification,
        confidence_score=report.confidenceScore,
        transcript=report.transcript,
        iocs=report.iocs
    )
    db.add(new_case)
    
    # Update global stats
    stats = get_or_create_stats(db)
    stats.total_intercepted += 1
    if report.classification == "scam":
        stats.scams_prevented += 1
    else:
        stats.safe_conversations += 1
    
    db.commit()
    logging.info(f"📁 New Case Filed: {report.conversationId} ({report.classification})")
    return {"status": "filed", "case_id": report.conversationId}
