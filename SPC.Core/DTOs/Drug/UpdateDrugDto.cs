using System.ComponentModel.DataAnnotations;

namespace SPC.Core.DTOs.Drug;

public class UpdateDrugDto
{
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; }

    [StringLength(200, MinimumLength = 2)]
    public string GenericName { get; set; }

    public string Description { get; set; }

    [StringLength(100)]
    public string Category { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal? UnitPrice { get; set; }

    [Range(0, int.MaxValue)]
    public int? MinimumStock { get; set; }

    public bool? RequiresPrescription { get; set; }

    [Range(1, int.MaxValue)]
    public int? SupplierId { get; set; }
}