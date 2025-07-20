// SPC.Core/Entities/Stock.cs
namespace SPC.Core.Entities;

public class Stock
{
    public int Id { get; set; }
    public int DrugId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public StockStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public enum StockStatus
{
    Available = 0,
    Reserved = 1,
    OutOfStock = 2,
    Expired = 3
}