using SPC.Core.Enums;

namespace SPC.Core.DTOs.Supplier;

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string LicenseNumber { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Address { get; set; }
    public SupplierStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}