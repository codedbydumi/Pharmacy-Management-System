using SPC.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace SPC.Core.DTOs.Order;

public class UpdateOrderStatusDto
{
    [Required]
    public OrderStatus Status { get; set; }

    public string? Comments { get; set; }
}