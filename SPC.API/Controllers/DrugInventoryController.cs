using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPC.Core.DTOs.Drug;
using SPC.Core.Interfaces.Services;

namespace SPC.API.Controllers;

public class DrugInventoryController : BaseApiController
{
    private readonly IDrugService _drugService;
    private readonly ILogger<DrugInventoryController> _logger;

    public DrugInventoryController(
        IDrugService drugService, 
        ILogger<DrugInventoryController> logger)
    {
        _drugService = drugService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<DrugDto>>> GetAllDrugs()
    {
        try 
        {
            var drugs = await _drugService.GetAllDrugsAsync();
            return Ok(drugs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving drugs");
            return BadRequest("Could not retrieve drugs");
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DrugDto>> GetDrugById(int id)
    {
        var drug = await _drugService.GetDrugByIdAsync(id);
        
        return drug == null 
            ? NotFound($"Drug with ID {id} not found") 
            : Ok(drug);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DrugDto>> CreateDrug([FromBody] CreateDrugDto drugDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try 
        {
            var createdDrug = await _drugService.CreateDrugAsync(drugDto);
            return CreatedAtAction(
                nameof(GetDrugById), 
                new { id = createdDrug.Id }, 
                createdDrug
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating drug");
            return BadRequest("Could not create drug");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Pharmacist")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DrugDto>> UpdateDrug(
        int id, 
        [FromBody] UpdateDrugDto drugDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try 
        {
            var updatedDrug = await _drugService.UpdateDrugAsync(id, drugDto);
            return updatedDrug == null 
                ? NotFound($"Drug with ID {id} not found") 
                : Ok(updatedDrug);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating drug");
            return BadRequest("Could not update drug");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDrug(int id)
    {
        var result = await _drugService.DeleteDrugAsync(id);
        
        return result 
            ? NoContent() 
            : NotFound($"Drug with ID {id} not found");
    }
}