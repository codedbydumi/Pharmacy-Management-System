using AutoMapper;
using SPC.Core.DTOs.Drug;
using SPC.Core.Entities;

namespace SPC.Infrastructure.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Drug, DrugDto>();
        CreateMap<CreateDrugDto, Drug>();
        CreateMap<UpdateDrugDto, Drug>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}