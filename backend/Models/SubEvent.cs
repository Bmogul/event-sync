using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class SubEvent
{

    [Key]
    public required Guid Id { get; set; }

    [ForeignKey(nameof(Event))]
    public required Guid EventId { get; set; }

    // legacy property for google sheets
    public int? LegacyFuncNum { get; set; }

    [MaxLength(50)]
    public required string Title { get; set; } = "Welcoming Event";

    [MaxLength(300)]
    public string? Description { get; set; } = "";

    public DateOnly? EventDate { get; set; } = new DateOnly(2001, 12, 28);
    public TimeOnly? EventTime { get; set; } = new TimeOnly(18, 0, 0);

    public string? Location { get; set; }

    [Url]
    public Uri? CardImageUrl { get; set; }

    public int EventOrder { get; set; }

    // JSON string for settings
    public string? Settings { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // soft delete
    public DateTime? DeletedAt { get; set; }
}
