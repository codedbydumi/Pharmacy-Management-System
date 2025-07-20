using SPC.Core.DTOs.Order;

namespace SPC.Core.Interfaces.Services;

public interface IOrderService
{
    Task<List<OrderDto>> GetAllOrdersAsync(int page = 1, int pageSize = 10);
    Task<OrderDto> GetOrderByIdAsync(int id);
    Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto);
    Task<OrderDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto statusDto);
    Task<bool> CancelOrderAsync(int id);
}