using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace backend.Models;

public class Event
{
    [Key]
    public required Guid Id { get; set; }

    [MaxLength(15)]
    public string? LegacyId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; } = "default";

    [Required]
    [MaxLength(50)]
    public required string Slug { get; set; } = null;

    [MaxLength(100)]
    public string? LegacySheetId { get; set; }

    [Url]
    public Uri? LogoUrl { get; set; }

    // JSON string for settings
    public string? Settings { get; set; }   

    // Collection of SubEvents under event
    public ICollection<SubEvent> SubEvents {get; set;} = new List<SubEvent>();
    
    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // soft delete
    public DateTime? DeletedAt { get; set; } 
}
