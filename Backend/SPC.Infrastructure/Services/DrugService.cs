using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SPC.Core.DTOs.Drug;
using SPC.Core.Entities;
using SPC.Core.Interfaces.Services;
using SPC.Infrastructure.Data;

namespace SPC.Infrastructure.Services;

public class DrugService : IDrugService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DrugService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<DrugDto>> GetAllDrugsAsync()
    {
        var drugs = await _context.Drugs
            .AsNoTracking()
            .ToListAsync();
        
        return _mapper.Map<List<DrugDto>>(drugs);
    }

    public async Task<DrugDto> GetDrugByIdAsync(int id)
    {
        var drug = await _context.Drugs
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);
        
        return _mapper.Map<DrugDto>(drug);
    }

    public async Task<DrugDto> CreateDrugAsync(CreateDrugDto drugDto)
    {
        var drug = _mapper.Map<Drug>(drugDto);
        drug.CreatedAt = DateTime.UtcNow;

        _context.Drugs.Add(drug);
        await _context.SaveChangesAsync();

        return _mapper.Map<DrugDto>(drug);
    }

#pragma warning disable CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    public async Task<DrugDto?> UpdateDrugAsync(int id, UpdateDrugDto drugDto)
#pragma warning restore CS8613 // Nullability of reference types in return type doesn't match implicitly implemented member.
    {
        var existingDrug = await _context.Drugs
            .FirstOrDefaultAsync(d => d.Id == id);

        if (existingDrug == null)
            return null;

        _mapper.Map(drugDto, existingDrug);
        existingDrug.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<DrugDto>(existingDrug);
    }

    public async Task<bool> DeleteDrugAsync(int id)
    {
        var drug = await _context.Drugs
            .FirstOrDefaultAsync(d => d.Id == id);

        if (drug == null)
            return false;

        _context.Drugs.Remove(drug);
        await _context.SaveChangesAsync();

        return true;
    }
}