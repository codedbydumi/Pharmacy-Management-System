using System.ComponentModel.DataAnnotations;
using SPC.Core.Enums;

namespace SPC.Core.DTOs.Supplier;

public class UpdateSupplierDto
{
    [StringLength(200, MinimumLength = 2)]
    public string? Name { get; set; }

    [StringLength(50)]
    public string? LicenseNumber { get; set; }

    [EmailAddress]
    [StringLength(100)]
    public string? Email { get; set; }

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    public SupplierStatus? Status { get; set; }
}