"""
crud.py — CRUD helper functions for all database operations.
All functions accept a SQLAlchemy Session and return ORM objects.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from database import AnalystRecord, Report, ResearchSession, SessionStatus
def create_session(db: Session, topic: str, max_analysts: int = 3) -> ResearchSession:
    """Create and persist a new research session."""
    session = ResearchSession(
        topic=topic,
        max_analysts=max_analysts,
        status=SessionStatus.pending,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
def get_session(db: Session, session_id: int) -> Optional[ResearchSession]:
    """Fetch a single session by ID (returns None if not found)."""
    return (
        db.query(ResearchSession)
        .filter(ResearchSession.id == session_id)
        .first()
    )
def list_sessions(db: Session, skip: int = 0, limit: int = 50) -> List[ResearchSession]:
    """Return all sessions ordered by most recent first."""
    return (
        db.query(ResearchSession)
        .order_by(ResearchSession.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
def update_session_status(
    db: Session, session_id: int, status: SessionStatus
) -> Optional[ResearchSession]:
    """Update the status field of a session."""
    session = get_session(db, session_id)
    if not session:
        return None
    session.status = status
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session
def update_session_feedback(
    db: Session, session_id: int, feedback: str
) -> Optional[ResearchSession]:
    """Store human analyst feedback on a session."""
    session = get_session(db, session_id)
    if not session:
        return None
    session.human_analyst_feedback = feedback
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session
def delete_session(db: Session, session_id: int) -> bool:
    """Delete a session and all related records (cascade). Returns True if deleted."""
    session = get_session(db, session_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True
def save_analysts(db: Session, session_id: int, analysts: list) -> List[AnalystRecord]:
    """
    Persist a list of Analyst pydantic objects (from schemas.py) to the DB.
    Clears any existing analysts for the session first (idempotent on re-run).
    """
    db.query(AnalystRecord).filter(AnalystRecord.session_id == session_id).delete()
    db.commit()
    records = []
    for analyst in analysts:
        record = AnalystRecord(
            session_id=session_id,
            name=analyst.name,
            role=analyst.role,
            affiliation=analyst.affiliation,
            description=analyst.description,
        )
        db.add(record)
        records.append(record)
    db.commit()
    for r in records:
        db.refresh(r)
    return records
def get_analysts(db: Session, session_id: int) -> List[AnalystRecord]:
    """Return all analyst records for a session."""
    return (
        db.query(AnalystRecord)
        .filter(AnalystRecord.session_id == session_id)
        .all()
    )
def save_report(
    db: Session,
    session_id: int,
    final_report: str,
    introduction: Optional[str] = None,
    content: Optional[str] = None,
    conclusion: Optional[str] = None,
) -> Report:
    """
    Create or update the report for a session.
    Uses upsert-style logic: deletes existing report then inserts fresh.
    """
    existing = db.query(Report).filter(Report.session_id == session_id).first()
    if existing:
        db.delete(existing)
        db.commit()
    report = Report(
        session_id=session_id,
        introduction=introduction,
        content=content,
        conclusion=conclusion,
        final_report=final_report,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
def get_report(db: Session, session_id: int) -> Optional[Report]:
    """Fetch the report for a session (returns None if not yet generated)."""
    return db.query(Report).filter(Report.session_id == session_id).first()
