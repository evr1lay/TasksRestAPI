from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from uuid import uuid4
import uvicorn

app = FastAPI()

class TaskSchema(BaseModel):
    id: str
    title: str
    completed: bool
    
class TaskAddSchema(BaseModel):
    title: str
    
tasks: list[TaskSchema] = []

@app.post("/tasks/add", tags=["📚 POST-ЗАПРОСЫ"])
async def add_task(payload: TaskAddSchema) -> dict:
    new_task = TaskSchema(
        id = str(uuid4()),
        title = payload.title,
        completed = False,
    )
    tasks.append(new_task)
    
    return {"success": True}
    
@app.get("/tasks", tags=["🔍 GET-ЗАПРОСЫ"])
async def get_tasks() -> list:
    return tasks

@app.get("/tasks/{task_id}", tags=["🔍 GET-ЗАПРОСЫ"])
async def get_tasks(task_id: str) -> dict:
    for task in tasks:
        if task.id == task_id:
            return task
    HTTPException(status_code=404, detail="Task not found")

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)