using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPC.Core.DTOs.Order;
using SPC.Core.Interfaces.Services;

namespace SPC.API.Controllers;

public class OrdersController : BaseApiController
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderService orderService, 
        ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OrderDto>>> GetAllOrders(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var orders = await _orderService.GetAllOrdersAsync(page, pageSize);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        
        return order == null 
            ? NotFound($"Order with ID {id} not found") 
            : Ok(order);
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto orderDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdOrder = await _orderService.CreateOrderAsync(orderDto);
        return CreatedAtAction(
            nameof(GetOrderById), 
            new { id = createdOrder.Id }, 
            createdOrder
        );
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Pharmacist")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(
        int id, 
        [FromBody] UpdateOrderStatusDto statusDto)
    {
        var updatedOrder = await _orderService.UpdateOrderStatusAsync(id, statusDto);
        
        return updatedOrder == null 
            ? NotFound($"Order with ID {id} not found") 
            : Ok(updatedOrder);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelOrder(int id)
    {
        var result = await _orderService.CancelOrderAsync(id);
        
        return result 
            ? NoContent() 
            : NotFound($"Order with ID {id} not found");
    }
}