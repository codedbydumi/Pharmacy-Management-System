using SPC.Core.DTOs.Supplier;

namespace SPC.Core.Interfaces.Services;

public interface ISupplierService
{
    Task<List<SupplierDto>> GetAllSuppliersAsync(int page = 1, int pageSize = 10);
    Task<SupplierDto> GetSupplierByIdAsync(int id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto supplierDto);
    Task<SupplierDto> UpdateSupplierAsync(int id, UpdateSupplierDto supplierDto);
    Task<bool> DeleteSupplierAsync(int id);
}