from sqlalchemy import create_engine, select, delete
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column

engine = create_engine(url="sqlite:///tasks.db", echo=False)

Session = sessionmaker(engine)

class Base(DeclarativeBase):
    pass

class Tasks(Base):
    __tablename__ = "Tasks"
    
    id: Mapped[str] = mapped_column(primary_key=True, index=True)
    ip_address: Mapped[str] = mapped_column(index=True)
    title: Mapped[str]
    completed: Mapped[bool]
    
def add_task_in_db(id: str, ip_address: str, title: str, completed: bool) -> None:
    with Session() as connection:
        new_task = Tasks(
            id=id,
            ip_address=ip_address,
            title=title,
            completed=completed,
        )
        connection.add(new_task)
        connection.commit()
    
def get_user_tasks(ip_address: str) -> list:
    with Session() as connection:
        query = select(Tasks).filter_by(ip_address=ip_address)
        result = connection.execute(query)
        return list(result.scalars().all())
    
def delete_task_from_db(ip_address: str, task_id: str) -> bool:
    with Session() as connection:
        query = select(Tasks).filter_by(id=task_id, ip_address=ip_address)
        result = connection.execute(query)
        task = result.scalar_one_or_none()
        
        if not result:
            return False
        
        delete_query = delete(Tasks).filter_by(id=task_id, ip_address=ip_address)
        connection.execute(delete_query)
        connection.commit()
        return True