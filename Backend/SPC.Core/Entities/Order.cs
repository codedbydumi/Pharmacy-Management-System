// File: SPC.Core/Entities/Order.cs
using SPC.Core.Enums;

namespace SPC.Core.Entities;

public class Order 
{
    public int Id { get; set; }
    public required string PharmacyId { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}