from typing import Annotated,List,TypedDict
from langgraph.graph import  MessagesState
from schemas import Analyst
import operator
class GenerateAnalystsState(TypedDict):
    topic: str  
    max_analysts: int  
    human_analyst_feedback: str  
    analysts: List[Analyst]  
class InterviewState(MessagesState):
    max_num_turns: int  
    context: Annotated[list, operator.add]  
    analyst: Analyst  
    interview: str  
    sections: list  
class ResearchGraphState(TypedDict):
    topic: str  
    max_analysts: int  
    human_analyst_feedback: str  
    analysts: List[Analyst]  
    sections: Annotated[list, operator.add]  
    introduction: str  
    content: str  
    conclusion: str  
    final_report: str  
