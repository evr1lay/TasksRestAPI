from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from contextlib import asynccontextmanager

from uuid import uuid4
from db import Base, engine, add_task_in_db, get_user_tasks, update_task_data, delete_task_from_db

import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield

app = FastAPI(title="TasksRestAPI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"], # p.s. ВАШ САЙТ
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskSchema(BaseModel):
    id: str
    title: str
    completed: bool
    
class TaskAddSchema(BaseModel):
    title: str
    
class TaskUpdateSchema(BaseModel):
    title: str
    completed: bool

@app.post("/tasks/add", tags=["📚 POST-ЗАПРОСЫ"])
async def add_task(payload: TaskAddSchema, request: Request) -> dict:
    user_ip_address = request.client.host
    new_task = TaskSchema(
        id = str(uuid4()),
        title = payload.title,
        completed = False,
    )
    add_task_in_db(
        id=new_task.id,
        ip_address=user_ip_address,
        title=new_task.title,
        completed=new_task.completed,
    )
    return {"success": True}
    
@app.get("/tasks", tags=["🔍 GET-ЗАПРОСЫ"])
async def get_tasks(request: Request) -> list:
    user_ip_address = request.client.host
    user_tasks = get_user_tasks(user_ip_address)
    
    return [{"id": task.id, "title": task.title, "completed": task.completed} for task in user_tasks]

@app.patch("/tasks/update/{task_id}", tags=["✏️ PATCH-ЗАПРОСЫ"])
async def update_task(payload: TaskUpdateSchema, task_id: str, request: Request) -> dict:
    user_ip_address = request.client.host
    updated = update_task_data(user_ip_address, task_id, payload.title, payload.completed)
    
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    return {"success": True}

@app.delete("/tasks/{task_id}", tags=["🗑️ DELETE-ЗАПРОСЫ"])
async def delete_task(task_id: str, request: Request) -> dict:
    user_ip_address = request.client.host
    deleted = delete_task_from_db(user_ip_address, task_id)
    
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
        
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)