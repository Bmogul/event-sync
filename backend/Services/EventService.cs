using backend.Models;
using System.Threading.Tasks;

namespace backend.Services;

public interface IEventService
{

    // CRUD
    Task<Event?> GetByIdAsync(Guid eventId);
    Task<IEnumerable<Event>> GetAllAsync();
    Task<Event> Create(Event eventItem);
    Task<Event> Update(Guid eventId, Event eventItem);
    Task<Event> Delete(Guid eventId);

    // Business Logic

}

public class EventService : IEventService
{
    public EventService(){}

    public async Task<Event?> GetByIdAsync(Guid eventId)
    {
        return await Task.FromResult(
            DummyEventsData.Events.FirstOrDefault(e => e.Id == eventId));
    }

    public async Task<IEnumerable<Event>> GetAllAsync(){
      return await Task.FromResult(DummyEventsData.Events);
    }

    public Task<Event> Create(Event eventItem)
    {
        throw new NotImplementedException();
    }

    public Task<Event> Update(Guid eventId, Event eventItem)
    {
        throw new NotImplementedException();
    }

    public Task<Event> Delete(Guid eventId)
    {
        throw new NotImplementedException();
    }
}
