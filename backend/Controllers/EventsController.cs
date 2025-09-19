using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class EventsController : ControllerBase{

    private readonly IEventService _eventService;

    public EventsController(IEventService eventService){
        _eventService = eventService;
    }

    // GET all events
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Event>>> GetAllEvents(){
        IEnumerable<Event> events = await _eventService.GetAllAsync();
        return Ok(events);
    }

    // GET event by ID
    [HttpGet("{eventId}")]
    public async Task<ActionResult<Event>> GetEventByID(Guid eventId){
     try{ 
        Event? eventItem = await _eventService.GetByIdAsync(eventId);
        if (eventItem == null) return NotFound();
      return Ok(eventItem);
     } catch (Exception e){
       return BadRequest($"Invalid Request: {e.Message}");
     }
    }

    // POST create event
    [HttpPost]
    public async Task<IActionResult> CreateEvent(Event eventItem){
      // Implement furhter logic
      await _eventService.Create(eventItem);
      return NoContent();
    }

    // PUT update event
    [HttpPut("{eventId}")]
    public async Task<IActionResult> UpdateEvent(Guid eventId, Event eventItem){
      await _eventService.Update(eventId, eventItem);
      return NoContent();
    }

    // DELETE delete event
    [HttpDelete("{eventId}")]
    public async Task<IActionResult> DeleteEvent(Guid eventId){
      await _eventService.Delete(eventId);
      return NoContent();
    }
        
}
