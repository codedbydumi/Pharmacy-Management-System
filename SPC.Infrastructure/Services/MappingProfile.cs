using AutoMapper;
using SPC.Core.DTOs.Order;
using SPC.Core.DTOs.Supplier;
using SPC.Core.Entities;
using SPC.Core.Enums;

namespace SPC.Infrastructure.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Order mappings
        CreateMap<Order, OrderDto>()
            .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.OrderItems));

        CreateMap<OrderItem, OrderItemDto>();

        CreateMap<CreateOrderDto, Order>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => OrderStatus.Pending))
            .ForMember(dest => dest.OrderItems, opt => opt.Ignore());

        CreateMap<CreateOrderItemDto, OrderItem>()
            .ForMember(dest => dest.TotalPrice, opt => opt.Ignore())
            .ForMember(dest => dest.UnitPrice, opt => opt.Ignore());

        // Supplier mappings
        CreateMap<Supplier, SupplierDto>();

        CreateMap<CreateSupplierDto, Supplier>()
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateSupplierDto, Supplier>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}