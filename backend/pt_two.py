from typing import Annotated

from fastapi import FastAPI, Path
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str

@app.put("/items/{item_id}")
async def update_item():
    return    
