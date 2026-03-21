import logging
from datetime import datetime, timedelta, timezone as tz
from typing import List, Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import Case, Stats, DashboardState
from dependencies import get_db, get_current_user
from limiter_config import limiter
from schemas import ReportRequest, SyncRequest

router = APIRouter(prefix="/api", tags=["statistics"])

def get_or_create_stats(db: Session):
    stats = db.query(Stats).first()
    if not stats:
        stats = Stats()
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

def get_time_bounds():
    """Returns UTC boundaries for today, start of week, and start of month."""
    now = datetime.now(tz.utc)
    # Today = 00:00:00 UTC
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Week = Monday of the current week (UTC)
    week_start = today_start - timedelta(days=today_start.weekday())
    
    # Month = 1st of the current month (UTC)
    month_start = today_start.replace(day=1)
    
    return today_start, week_start, month_start

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
    
    global_stats = get_or_create_stats(db)
    today_start, week_start, month_start = get_time_bounds()
    
    def get_raw_stats(threshold):
        cases = db.query(Case).filter(Case.created_at >= threshold).all()
        scams = [c for c in cases if c.classification == "scam"]
        
        types_breakdown = {}
        for c in scams:
            st = c.scam_type or "OTHER"
            types_breakdown[st] = types_breakdown.get(st, 0) + 1
            
        unique_scammers = len(set(c.scammer_name for c in cases if c.scammer_name))
        
        return len(scams), types_breakdown, unique_scammers

    today_count, today_types, today_scammers = get_raw_stats(today_start)
    week_count, week_types, week_scammers = get_raw_stats(week_start)
    month_count, month_types, month_scammers = get_raw_stats(month_start)
    all_count, all_types, _ = get_raw_stats(datetime.min.replace(tzinfo=tz.utc))

    return {
        "today": today_count,
        "today_types": today_types,
        "today_scammers": today_scammers,
        
        "week": week_count,
        "week_types": week_types,
        "week_scammers": week_scammers,
        
        "month": month_count,
        "month_types": month_types,
        "month_scammers": month_scammers,
        
        "types": all_types,
        "reports_filed": global_stats.scams_prevented, # Total for uniqueScammers calculation in frontend
        "all_time": {
            "total_intercepted": global_stats.total_intercepted,
            "scams_prevented": global_stats.scams_prevented,
            "safe_conversations": global_stats.safe_conversations,
            "current_threat_level": global_stats.current_threat_level
        }
    }

@router.get("/cases")
def get_cases(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
    cases = db.query(Case).order_by(Case.created_at.desc()).limit(50).all()
    return cases

@router.post("/report")
@limiter.limit("10/minute")
async def submit_report(report: ReportRequest, request: Request, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Receives official scam reports from the frontend."""
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
    
    import json
    from fastapi import HTTPException

    # 1. Protect against Database Bloat / DoS
    metadata_raw = json.dumps(report.metadata) if report.metadata else "{}"
    if len(metadata_raw) > 1_000_000: # 1MB Limit
        raise HTTPException(status_code=413, detail="Forensic metadata exceeds permissible safety limits (1MB).")

    # 2. Cryptographic Integrity Check
    if report.is_sealed and report.forensic_signature:
        if len(report.forensic_signature) != 64:
            raise HTTPException(status_code=400, detail="Invalid forensic signature format. Expected SHA-256 hash.")
    new_case = Case(
        conversation_id=report.conversationId,
        scammer_name=report.scammerName,
        platform=report.platform,
        classification=report.classification,
        scam_type=report.scamType,
        confidence_score=report.confidenceScore,
        transcript=json.dumps(report.transcript),
        iocs=report.iocs,
        # New Phase 16 fields
        is_sealed=report.is_sealed,
        forensic_signature=report.forensic_signature,
        metadata_json=report.metadata
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

@router.get("/sync")
async def get_dashboard_sync(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Retrieves the persisted dashboard state for the current operator."""
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
    
    state = db.query(DashboardState).filter(DashboardState.username == current_user).first()
    if not state:
        return {"intelligence_data": None, "threat_coordinates": []}
    
    return {
        "intelligence_data": state.intelligence_data,
        "threat_coordinates": state.threat_coordinates,
        "updated_at": state.updated_at
    }

@router.post("/sync")
async def post_dashboard_sync(sync_data: SyncRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Persists the full dashboard state to ensure cross-device consistency."""
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
    
    state = db.query(DashboardState).filter(DashboardState.username == current_user).first()
    if not state:
        state = DashboardState(username=current_user)
        db.add(state)
    
    state.intelligence_data = sync_data.intelligence_data
    state.threat_coordinates = sync_data.threat_coordinates
    db.commit()
    
    logging.info(f"🔄 Dashboard Synced for Operator: {current_user}")
    return {"status": "synced"}
