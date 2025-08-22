from typing import Annotated,List,TypedDict
from langgraph.graph import  MessagesState
from schemas import Analyst
import operator

class GenerateAnalystsState(TypedDict):
    topic: str  # Research topic
    max_analysts: int  # Number of analysts
    human_analyst_feedback: str  # Human feedback
    analysts: List[Analyst]  # Analyst asking questions


class InterviewState(MessagesState):
    max_num_turns: int  # Number turns of conversation
    context: Annotated[list, operator.add]  # Source docs
    analyst: Analyst  # Analyst asking questions
    interview: str  # Interview transcript
    sections: list  # Final key we duplicate in outer state for Send() API


class ResearchGraphState(TypedDict):
    topic: str  # Research topic
    max_analysts: int  # Number of analysts
    human_analyst_feedback: str  # Human feedback
    analysts: List[Analyst]  # Analyst asking questions
    sections: Annotated[list, operator.add]  # Send() API key
    introduction: str  # Introduction for the final report
    content: str  # Content for the final report
    conclusion: str  # Conclusion for the final report
    final_report: str  # Final report
