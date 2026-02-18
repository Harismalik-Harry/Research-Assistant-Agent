"""
api.py — FastAPI application for the Research Assistant Agent.
Endpoints:
  POST   /sessions                    Create a new research session
  GET    /sessions                    List all sessions
  GET    /sessions/{id}               Get session details + analysts
  GET    /sessions/{id}/report        Get the final report
  POST   /sessions/{id}/feedback      Submit human feedback (approve or text)
  GET    /sessions/{id}/stream        SSE — stream live agent progress
  DELETE /sessions/{id}               Delete a session
"""
import asyncio
import json
import os
import sys
from contextlib import asynccontextmanager
from typing import Optional
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
load_dotenv()
sys.path.insert(0, os.path.dirname(__file__))
from database import SessionStatus, get_db, init_db
import crud
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
app = FastAPI(
    title="Research Assistant Agent API",
    description="API to run multi-analyst AI research reports powered by LangGraph + Gemini.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class CreateSessionRequest(BaseModel):
    topic: str
    max_analysts: int = 3
class FeedbackRequest(BaseModel):
    feedback: str  
class AnalystOut(BaseModel):
    id: int
    name: str
    role: str
    affiliation: str
    description: str
    class Config:
        from_attributes = True
class SessionOut(BaseModel):
    id: int
    topic: str
    max_analysts: int
    status: str
    human_analyst_feedback: Optional[str]
    created_at: str
    updated_at: str
    analysts: list[AnalystOut] = []
    class Config:
        from_attributes = True
class ReportOut(BaseModel):
    id: int
    session_id: int
    introduction: Optional[str]
    content: Optional[str]
    conclusion: Optional[str]
    final_report: str
    created_at: str
    class Config:
        from_attributes = True
def session_to_dict(s) -> dict:
    return {
        "id": s.id,
        "topic": s.topic,
        "max_analysts": s.max_analysts,
        "status": s.status.value if hasattr(s.status, "value") else s.status,
        "human_analyst_feedback": s.human_analyst_feedback,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        "analysts": [analyst_to_dict(a) for a in (s.analysts or [])],
    }
def analyst_to_dict(a) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "role": a.role,
        "affiliation": a.affiliation,
        "description": a.description,
    }
def report_to_dict(r) -> dict:
    return {
        "id": r.id,
        "session_id": r.session_id,
        "introduction": r.introduction,
        "content": r.content,
        "conclusion": r.conclusion,
        "final_report": r.final_report,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
_sse_queues: dict[int, asyncio.Queue] = {}
def get_or_create_queue(session_id: int) -> asyncio.Queue:
    if session_id not in _sse_queues:
        _sse_queues[session_id] = asyncio.Queue()
    return _sse_queues[session_id]
async def push_event(session_id: int, event_type: str, data: dict):
    """Push an SSE event to the queue for a session."""
    q = get_or_create_queue(session_id)
    await q.put({"event": event_type, "data": json.dumps(data)})
async def run_agent(session_id: int, topic: str, max_analysts: int):
    """
    Run the LangGraph research graph in a background thread.
    Pushes SSE events at each key stage.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        from main import graph
        crud.update_session_status(db, session_id, SessionStatus.running)
        await push_event(session_id, "status", {"message": "Agent started", "status": "running"})
        thread_config = {"configurable": {"thread_id": str(session_id)}}
        loop = asyncio.get_event_loop()
        def _invoke_step1():
            return graph.invoke(
                {"topic": topic, "max_analysts": max_analysts},
                thread_config,
            )
        state = await loop.run_in_executor(None, _invoke_step1)
        analysts = state.get("analysts", [])
        crud.save_analysts(db, session_id, analysts)
        crud.update_session_status(db, session_id, SessionStatus.awaiting_feedback)
        analysts_data = [
            {
                "name": a.name,
                "role": a.role,
                "affiliation": a.affiliation,
                "description": a.description,
            }
            for a in analysts
        ]
        await push_event(
            session_id,
            "analysts_ready",
            {"analysts": analysts_data, "status": "awaiting_feedback"},
        )
        feedback = None
        for _ in range(300):  
            await asyncio.sleep(2)
            db.expire_all()
            session_row = crud.get_session(db, session_id)
            if session_row and session_row.human_analyst_feedback:
                feedback = session_row.human_analyst_feedback
                break
        if feedback is None:
            raise TimeoutError("Timed out waiting for human feedback.")
        await push_event(
            session_id,
            "feedback_received",
            {"feedback": feedback, "message": "Feedback received, running interviews..."},
        )
        crud.update_session_status(db, session_id, SessionStatus.running)
        def _invoke_step2():
            return graph.invoke(
                {"human_analyst_feedback": feedback},
                thread_config,
            )
        await push_event(
            session_id,
            "interview_progress",
            {"message": f"Running {len(analysts)} parallel analyst interviews..."},
        )
        final_state = await loop.run_in_executor(None, _invoke_step2)
        final_report = final_state.get("final_report", "")
        introduction = final_state.get("introduction", "")
        content = final_state.get("content", "")
        conclusion = final_state.get("conclusion", "")
        crud.save_report(
            db,
            session_id,
            final_report=final_report,
            introduction=introduction,
            content=content,
            conclusion=conclusion,
        )
        crud.update_session_status(db, session_id, SessionStatus.completed)
        await push_event(
            session_id,
            "report_ready",
            {"message": "Report complete!", "status": "completed"},
        )
    except Exception as e:
        crud.update_session_status(db, session_id, SessionStatus.failed)
        await push_event(session_id, "error", {"message": str(e), "status": "failed"})
    finally:
        db.close()
        q = get_or_create_queue(session_id)
        await q.put(None)  
@app.post("/sessions", status_code=201)
async def create_session(body: CreateSessionRequest, db: Session = Depends(get_db)):
    """Create a new research session and kick off the agent in the background."""
    if not body.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")
    if body.max_analysts < 1 or body.max_analysts > 10:
        raise HTTPException(status_code=400, detail="max_analysts must be between 1 and 10.")
    session = crud.create_session(db, topic=body.topic.strip(), max_analysts=body.max_analysts)
    asyncio.create_task(run_agent(session.id, session.topic, session.max_analysts))
    return session_to_dict(session)
@app.get("/sessions")
async def list_sessions(db: Session = Depends(get_db)):
    """Return all research sessions, newest first."""
    sessions = crud.list_sessions(db)
    return [session_to_dict(s) for s in sessions]
@app.get("/sessions/{session_id}")
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get a single session with its analysts."""
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session_to_dict(session)
@app.get("/sessions/{session_id}/report")
async def get_report(session_id: int, db: Session = Depends(get_db)):
    """Get the final report for a completed session."""
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    report = crud.get_report(db, session_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not yet available. Session status: " + str(session.status),
        )
    return report_to_dict(report)
@app.post("/sessions/{session_id}/feedback")
async def submit_feedback(
    session_id: int, body: FeedbackRequest, db: Session = Depends(get_db)
):
    """Submit human feedback. Use 'approve' to approve analysts, or any text to revise."""
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status != SessionStatus.awaiting_feedback:
        raise HTTPException(
            status_code=400,
            detail=f"Session is not awaiting feedback (current status: {session.status}).",
        )
    crud.update_session_feedback(db, session_id, body.feedback)
    return {"message": "Feedback submitted.", "feedback": body.feedback}
@app.get("/sessions/{session_id}/stream")
async def stream_session(session_id: int, db: Session = Depends(get_db)):
    """
    SSE endpoint — streams live agent progress events for a session.
    Event types:
      status            — general status update
      analysts_ready    — analysts generated, waiting for feedback
      feedback_received — feedback received, interviews starting
      interview_progress— interviews running
      report_ready      — final report is done
      error             — something went wrong
    """
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    queue = get_or_create_queue(session_id)
    async def event_generator():
        yield {
            "event": "status",
            "data": json.dumps(
                {
                    "status": session.status.value
                    if hasattr(session.status, "value")
                    else session.status,
                    "message": "Connected to session stream.",
                }
            ),
        }
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=30)
            except asyncio.TimeoutError:
                yield {"event": "ping", "data": json.dumps({"message": "keepalive"})}
                continue
            if item is None:
                break
            yield item
    return EventSourceResponse(event_generator())
@app.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a session and all its data."""
    deleted = crud.delete_session(db, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    _sse_queues.pop(session_id, None)
    return None
@app.get("/health")
async def health():
    return {"status": "ok", "service": "Research Assistant Agent API"}
