from fastapi import FastAPI
from enum import Enum
from pydantic import AfterValidator, AnyHttpUrl, BaseModel, StrictFloat

app = FastAPI()

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"


# Basic get
@app.get("/")
async def root():
    return {"message":"Hello World"}

# Path parameters
@app.get("/events/{event_id}")
async def read_event(event_id: int):
    return {"event_id" : event_id}

# Using Enums
@app.get("/models/{model_name}")
async def get_model(model_name: ModelName):
    if model_name is ModelName.alexnet:
        return {"model_name" : model_name, "message" : "Deep Learning FTW"}
    if model_name is ModelName.lenet:
        return {"model_name" : model_name, "message" : "LeCNN all the images"}
    return {"model_name" : model_name, "message" : "Have some residuals"}

# Query Parameters
@app.get("/{event_id}/rsvp")
async def get_rsvp_page(event_id : int, guid : str | None = None):
    return {"event_id": event_id, "guid" : guid}

# Query Parameters type conversion
# valus for bool will be coverted to a True or False
@app.get("/{event_id}")
async def get_event(event_id : str, guid : str | None = None, short: bool = False):
    event = {"event_id" : event_id}
    if guid:
        event.update({"guid":guid})
    if not short:
        event.update({"description": "This is an amazing event that has a long desc"})
    return event

# Request body
class Event_Function(BaseModel):
    func_num: int = 0
    func_title: str
    func_col: str = ""
    card_link: str | None = None
    date: str = ""
    location: str = ""
class Event(BaseModel):
    event_id: str
    sheet_id: str = ""
    event_title: str = ""
    num_of_functions: int = 0
    logo: str | None = None
    functions: list[Event_Function] = []

@app.post("/events")
async def create_event(event: Event):
    return event

# Additional validaton
# this allows for the query parameter q to be optional
# but if provided it cannot be more that 50 characters long
# results is also explicity defined as a dict[str,object] as to 
# avoid errors from linter
# using Query() indicates that the valdation is being done
# to a Query parameter

# Other Query parameters:
# min_lenght
# pattern for regex
# title for setting the title for the parameter metadata
# description for more metadata
# alias for differnet name in url
# deprecated to mark it as no longer supported but still valid
# include_in_schema=False will prevent auto docs from seeing this query paramter

# Custom validation via pydantics AfterValidator insid annotated
from typing import Annotated, Literal
from fastapi import Query

# Check if item id start with isbn- or imdb-
def check_valid_id(id:str):
    if not id.startswith(("isbn-","imdb-")):
        raise ValueError('Invalid ID format, it must start with isbn- or imdb-')
    return id

@app.get("/items")
async def read_items(q: Annotated[str | None, Query(max_length=50), AfterValidator(check_valid_id)] = None):
    results: dict[str, object] = {"items": [{"items_id":"Foo"}, {"item_id":"Bar"}]}
    if q:
        results.update({"q":q})
    return results

# Additional validation for Path variables
# ge is >=
# gt is >
# le is <=
# lt is <
from fastapi import Path

@app.get("/items/{item_id}")
async def read_item(
    item_id: Annotated[int, Path(title="The ID of the item to get", gt=0, le=1000)], 
    q: Annotated[str | None, Query(alia="item-query")] = None):
    results: dict[str,object] = {"item_id":item_id}
    if q: 
        results.update({"q":q})
    return results

# Query Parameter Models
# using pydantic models for query paramters 
# for reusability and better data validation and metadata
from pydantic import Field
from typing import Annotated

class FilterParams(BaseModel):
    limit:int = Field(100, gt=0, le=100)
    offset:int = Field(0, ge=0)
    order_by: Literal['created_at', 'updated_at'] = 'created_at'
    tags: list[str] = []

@app.get('/items2')
async def read_items2(filter_query: Annotated[FilterParams, Query()]):
    return filter_query
