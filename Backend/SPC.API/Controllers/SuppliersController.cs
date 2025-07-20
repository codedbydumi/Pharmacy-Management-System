using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPC.Core.DTOs.Supplier;
using SPC.Core.Interfaces.Services;

namespace SPC.API.Controllers;

public class SuppliersController : BaseApiController
{
    private readonly ISupplierService _supplierService;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(
        ISupplierService supplierService, 
        ILogger<SuppliersController> logger)
    {
        _supplierService = supplierService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize] // Only requires authentication, any role can access
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SupplierDto>>> GetAllSuppliers(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var suppliers = await _supplierService.GetAllSuppliersAsync(page, pageSize);
        return Ok(suppliers);
    }

    [HttpGet("{id}")]
    [Authorize] // Only requires authentication, any role can access
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SupplierDto>> GetSupplierById(int id)
    {
        var supplier = await _supplierService.GetSupplierByIdAsync(id);
        
        return supplier == null 
            ? NotFound($"Supplier with ID {id} not found") 
            : Ok(supplier);
    }

    [HttpPost]
    [Authorize] // Only requires authentication, any role can access
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierDto supplierDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdSupplier = await _supplierService.CreateSupplierAsync(supplierDto);
        return CreatedAtAction(
            nameof(GetSupplierById), 
            new { id = createdSupplier.Id }, 
            createdSupplier
        );
    }

    [HttpPut("{id}")]
    [Authorize] // Only requires authentication, any role can access
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(
        int id, 
        [FromBody] UpdateSupplierDto supplierDto)
    {
        var updatedSupplier = await _supplierService.UpdateSupplierAsync(id, supplierDto);
        
        return updatedSupplier == null 
            ? NotFound($"Supplier with ID {id} not found") 
            : Ok(updatedSupplier);
    }

    [HttpDelete("{id}")]
    [Authorize] // Only requires authentication, any role can access
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSupplier(int id)
    {
        var result = await _supplierService.DeleteSupplierAsync(id);
        
        return result 
            ? NoContent() 
            : NotFound($"Supplier with ID {id} not found");
    }
}