using SPC.Core.DTOs.Drug;

namespace SPC.Core.Interfaces.Services;

public interface IDrugService
{
    Task<List<DrugDto>> GetAllDrugsAsync();
    Task<DrugDto> GetDrugByIdAsync(int id);
    Task<DrugDto> CreateDrugAsync(CreateDrugDto drugDto);
    Task<DrugDto> UpdateDrugAsync(int id, UpdateDrugDto drugDto);
    Task<bool> DeleteDrugAsync(int id);
}