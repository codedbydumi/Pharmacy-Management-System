using System.ComponentModel.DataAnnotations;

namespace SPC.Core.DTOs.Order;

public class CreateOrderDto
{
    [Required]
    [StringLength(50)]
    public required string PharmacyId { get; set; }

    [Required]
    [MinLength(1)]
    public required List<CreateOrderItemDto> OrderItems { get; set; }
}

public class CreateOrderItemDto
{
    [Range(1, int.MaxValue)]
    public int DrugId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}