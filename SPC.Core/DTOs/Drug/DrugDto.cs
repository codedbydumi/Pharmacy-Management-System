namespace SPC.Core.DTOs.Drug;

public class DrugDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string GenericName { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public decimal UnitPrice { get; set; }
    public int MinimumStock { get; set; }
    public bool RequiresPrescription { get; set; }
    public int SupplierId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}