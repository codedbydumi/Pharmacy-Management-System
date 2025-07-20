// SPC.Core/Entities/Drug.cs
namespace SPC.Core.Entities;

public class Drug
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int MinimumStock { get; set; }
    public bool RequiresPrescription { get; set; }
    public int SupplierId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}