
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SPC.Core.DTOs.Supplier;
using SPC.Core.Entities;
using SPC.Core.Interfaces.Services;
using SPC.Infrastructure.Data;

namespace SPC.Infrastructure.Services;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SupplierService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<SupplierDto>> GetAllSuppliersAsync(int page = 1, int pageSize = 10)
    {
        var suppliers = await _context.Suppliers
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return _mapper.Map<List<SupplierDto>>(suppliers);
    }

    public async Task<SupplierDto> GetSupplierByIdAsync(int id)
    {
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.Id == id);

        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto supplierDto)
    {
        // Check if a supplier with the same license number or email already exists
        var existingSupplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => 
                s.LicenseNumber == supplierDto.LicenseNumber || 
                s.Email == supplierDto.Email);

        if (existingSupplier != null)
        {
            throw new InvalidOperationException("A supplier with this license number or email already exists.");
        }

        var supplier = _mapper.Map<Supplier>(supplierDto);
        supplier.CreatedAt = DateTime.UtcNow;

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        return _mapper.Map<SupplierDto>(supplier);
    }

#pragma warning disable CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    public async Task<SupplierDto?> UpdateSupplierAsync(int id, UpdateSupplierDto supplierDto)
#pragma warning restore CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    {
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
            return null;

        // Check if the new email or license number is already in use by another supplier
        if (supplierDto.Email != null || supplierDto.LicenseNumber != null)
        {
            var existingSupplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => 
                    s.Id != id && 
                    (s.Email == supplierDto.Email || 
                     s.LicenseNumber == supplierDto.LicenseNumber));

            if (existingSupplier != null)
            {
                throw new InvalidOperationException("Another supplier with this email or license number already exists.");
            }
        }

        _mapper.Map(supplierDto, supplier);
        supplier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task<bool> DeleteSupplierAsync(int id)
    {
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
            return false;

        // Check if the supplier has any associated drugs before deletion
        var hasDrugs = await _context.Drugs
            .AnyAsync(d => d.SupplierId == id);

        if (hasDrugs)
        {
            throw new InvalidOperationException("Cannot delete supplier with associated drugs.");
        }

        _context.Suppliers.Remove(supplier);
        await _context.SaveChangesAsync();

        return true;
    }
}