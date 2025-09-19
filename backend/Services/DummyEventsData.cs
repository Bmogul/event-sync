using backend.Models;

namespace backend.Services;

public static class DummyEventsData
{
    public static List<Event> Events { get; set; } =
        new()
        {
            new Event
            {
                // ✅ FIXED: "0" is not a valid GUID
                Id = Guid.Parse("b37da238-9000-0000-0000-000000000000"),
                LegacyId = "B37DA2389S",
                Title = "Sakina Weds Mohammad",
                Slug = "sakina-weds-mohammad",
                LegacySheetId = "1VWd-vWBJoiE5JNu6tOMId79LQkN5W_S8iYBJVGg-Nrs",
                LogoUrl = new Uri("https://i.imgur.com/PVHMOzK.png"),
                Settings = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SubEvents = new List<SubEvent>
                {
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and removed 's' character
                        EventId = Guid.Parse("b37da238-9000-0000-0000-000000000000"),
                        LegacyFuncNum = 0,
                        Title = "Khushi Jaman and Majlis",
                        Description = "",
                        CardImageUrl = new Uri("https://i.imgur.com/Vq7vqkn.jpeg"),
                        EventDate = new DateOnly(2025, 8, 2),
                        EventTime = new TimeOnly(17, 45),
                        Location = "341 Dunhams Corner Rd, East Brunswick, NJ 08816",
                        EventOrder = 0,
                        Settings = "{\"funcCol\": \"MainInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and removed 's' character
                        EventId = Guid.Parse("b37da238-9000-0000-0000-000000000000"),
                        LegacyFuncNum = 1,
                        Title = "Sakina's Shitabi",
                        Description = "",
                        CardImageUrl = new Uri("https://i.imgur.com/0OIvxSe.jpeg"),
                        EventDate = new DateOnly(2025, 8, 1),
                        EventTime = new TimeOnly(18, 0),
                        Location = "10 Wood Lake Court, North Brunswick NJ 08902",
                        EventOrder = 1,
                        Settings = "{\"funcCol\": \"ShitabiInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            },
            new Event
            {
                Id = Guid.Parse("c11e1b80-1000-0000-0000-000000000000"),
                LegacyId = "C11E1B801X",
                Title = "Zainab & Hasan Wedding",
                Slug = "zainab-hasan-wedding",
                LegacySheetId = "sheet-zainab-hasan",
                LogoUrl = new Uri("https://i.imgur.com/zainabhasan.png"),
                Settings = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SubEvents = new List<SubEvent>
                {
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        EventId = Guid.Parse("c11e1b80-1000-0000-0000-000000000000"),
                        LegacyFuncNum = 0,
                        Title = "Wedding Ceremony",
                        CardImageUrl = new Uri("https://i.imgur.com/zainabwedding.jpg"),
                        EventDate = new DateOnly(2025, 9, 14),
                        EventTime = new TimeOnly(16, 0),
                        Location = "Hilton Garden, Edison, NJ",
                        EventOrder = 0,
                        Settings = "{\"funcCol\": \"CeremonyInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        EventId = Guid.Parse("c11e1b80-1000-0000-0000-000000000000"),
                        LegacyFuncNum = 1,
                        Title = "Reception",
                        CardImageUrl = new Uri("https://i.imgur.com/zainabreception.jpg"),
                        EventDate = new DateOnly(2025, 9, 15),
                        EventTime = new TimeOnly(19, 0),
                        Location = "Royal Albert's Palace, Fords, NJ",
                        EventOrder = 1,
                        Settings = "{\"funcCol\": \"ReceptionInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            },
            new Event
            {
                Id = Guid.Parse("d22f2c90-2000-0000-0000-000000000000"),
                LegacyId = "D22F2C902Y",
                Title = "Ali's Graduation Bash",
                Slug = "ali-graduation-bash",
                LegacySheetId = "sheet-ali-grad",
                LogoUrl = new Uri("https://i.imgur.com/aligrad.png"),
                Settings = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SubEvents = new List<SubEvent>
                {
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        EventId = Guid.Parse("d22f2c90-2000-0000-0000-000000000000"),
                        LegacyFuncNum = 0,
                        Title = "Graduation Party",
                        CardImageUrl = new Uri("https://i.imgur.com/aligradparty.jpg"),
                        EventDate = new DateOnly(2025, 6, 30),
                        EventTime = new TimeOnly(17, 30),
                        Location = "Ali's Backyard, Plainsboro, NJ",
                        EventOrder = 0,
                        Settings = "{\"funcCol\": \"GradInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            },
            new Event
            {
                // ✅ FIXED: Replaced 'g' with valid hex character
                Id = Guid.Parse("e33a3d70-3000-0000-0000-000000000000"),
                LegacyId = "E33G3D703Z",
                Title = "Iman & Zahra Nikah",
                Slug = "iman-zahra-nikah",
                LegacySheetId = "sheet-iman-zahra",
                LogoUrl = new Uri("https://i.imgur.com/imanzahra.png"),
                Settings = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SubEvents = new List<SubEvent>
                {
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and replaced 'g' with 'a'
                        EventId = Guid.Parse("e33a3d70-3000-0000-0000-000000000000"),
                        LegacyFuncNum = 0,
                        Title = "Nikah",
                        CardImageUrl = new Uri("https://i.imgur.com/nikah.jpg"),
                        EventDate = new DateOnly(2025, 11, 20),
                        EventTime = new TimeOnly(15, 0),
                        Location = "Masjid Al-Noor, Bridgewater, NJ",
                        EventOrder = 0,
                        Settings = "{\"funcCol\": \"NikahInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and replaced 'g' with 'a'
                        EventId = Guid.Parse("e33a3d70-3000-0000-0000-000000000000"),
                        LegacyFuncNum = 1,
                        Title = "Dinner",
                        CardImageUrl = new Uri("https://i.imgur.com/nikahdinner.jpg"),
                        EventDate = new DateOnly(2025, 11, 20),
                        EventTime = new TimeOnly(18, 30),
                        Location = "Masjid Hall, Bridgewater, NJ",
                        EventOrder = 1,
                        Settings = "{\"funcCol\": \"DinnerInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and replaced 'g' with 'a'
                        EventId = Guid.Parse("e33a3d70-3000-0000-0000-000000000000"),
                        LegacyFuncNum = 2,
                        Title = "Post-Nikah Brunch",
                        CardImageUrl = new Uri("https://i.imgur.com/brunch.jpg"),
                        EventDate = new DateOnly(2025, 11, 21),
                        EventTime = new TimeOnly(10, 30),
                        Location = "Family Home, Hillsborough, NJ",
                        EventOrder = 2,
                        Settings = "{\"funcCol\": \"BrunchInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            },
            new Event
            {
                // ✅ FIXED: Replaced 'h' with valid hex character
                Id = Guid.Parse("f44a4e60-4000-0000-0000-000000000000"),
                LegacyId = "F44H4E604W",
                Title = "Community Eid Gathering",
                Slug = "eid-gathering-2025",
                LegacySheetId = "sheet-eid-gathering",
                LogoUrl = new Uri("https://i.imgur.com/eidlogo.png"),
                Settings = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SubEvents = new List<SubEvent>
                {
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and replaced 'h' with 'a'
                        EventId = Guid.Parse("f44a4e60-4000-0000-0000-000000000000"),
                        LegacyFuncNum = 0,
                        Title = "Eid Prayers",
                        CardImageUrl = new Uri("https://i.imgur.com/eidprayers.jpg"),
                        EventDate = new DateOnly(2025, 10, 6),
                        EventTime = new TimeOnly(9, 0),
                        Location = "Edison Islamic Center",
                        EventOrder = 0,
                        Settings = "{\"funcCol\": \"PrayerInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SubEvent
                    {
                        Id = Guid.NewGuid(),
                        // ✅ FIXED: Match parent Event ID and replaced 'h' with 'a'
                        EventId = Guid.Parse("f44a4e60-4000-0000-0000-000000000000"),
                        LegacyFuncNum = 1,
                        Title = "Lunch",
                        CardImageUrl = new Uri("https://i.imgur.com/eidlunch.jpg"),
                        EventDate = new DateOnly(2025, 10, 6),
                        EventTime = new TimeOnly(12, 30),
                        Location = "Community Hall, Edison, NJ",
                        EventOrder = 1,
                        Settings = "{\"funcCol\": \"LunchInvite\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            }
        };
}
