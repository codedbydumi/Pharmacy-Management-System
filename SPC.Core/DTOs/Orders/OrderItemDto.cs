namespace SPC.Core.DTOs.Order;

public class OrderItemDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int DrugId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}