// File: SPC.Core/Entities/OrderItem.cs
namespace SPC.Core.Entities;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public virtual Order Order { get; set; } = null!;
    public int DrugId { get; set; }
    public virtual Drug Drug { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}