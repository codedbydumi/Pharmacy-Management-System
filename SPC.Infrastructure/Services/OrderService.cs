using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SPC.Core.DTOs.Order;
using SPC.Core.Entities;
using SPC.Core.Enums;
using SPC.Core.Interfaces.Services;
using SPC.Infrastructure.Data;

namespace SPC.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public OrderService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync(int page = 1, int pageSize = 10)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Drug)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return _mapper.Map<List<OrderDto>>(orders);
    }

    public async Task<OrderDto> GetOrderByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Drug)
            .FirstOrDefaultAsync(o => o.Id == id);

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto)
    {
        // Validate drug availability and calculate total amount
        var orderItems = new List<OrderItem>();
        decimal totalAmount = 0;

        var order = new Order
        {
            PharmacyId = orderDto.PharmacyId,
            Status = OrderStatus.Pending,
            TotalAmount = 0, // Will be updated after adding items
            CreatedAt = DateTime.UtcNow,
            OrderItems = new List<OrderItem>()
        };

        // Create order first to get the ID
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        foreach (var item in orderDto.OrderItems)
        {
            var drug = await _context.Drugs.FindAsync(item.DrugId);
            if (drug == null)
                throw new ArgumentException($"Drug with ID {item.DrugId} not found");

            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                Order = order,
                DrugId = item.DrugId,
                Drug = drug,
                Quantity = item.Quantity,
                UnitPrice = drug.UnitPrice,
                TotalPrice = drug.UnitPrice * item.Quantity
            };

            orderItems.Add(orderItem);
            totalAmount += orderItem.TotalPrice;
        }

        // Update order with items and total amount
        order.OrderItems = orderItems;
        order.TotalAmount = totalAmount;
        
        await _context.SaveChangesAsync();

        return _mapper.Map<OrderDto>(order);
    }

#pragma warning disable CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    public async Task<OrderDto?> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto statusDto)
#pragma warning restore CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return null;

        order.Status = statusDto.Status;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<OrderDto>(order);
    }

    public async Task<bool> CancelOrderAsync(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return false;

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }
}