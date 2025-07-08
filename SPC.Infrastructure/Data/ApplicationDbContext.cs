using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SPC.Core.Entities;

namespace SPC.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Your DbSets
        public DbSet<Drug> Drugs { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); // This is crucial for Identity tables

            // Fix MySQL key length limitations for Identity tables
            modelBuilder.Entity<IdentityUserLogin<int>>(entity =>
            {
                entity.Property(e => e.LoginProvider).HasMaxLength(128);
                entity.Property(e => e.ProviderKey).HasMaxLength(128);
            });

            modelBuilder.Entity<IdentityUserToken<int>>(entity =>
            {
                entity.Property(e => e.LoginProvider).HasMaxLength(128);
                entity.Property(e => e.Name).HasMaxLength(128);
            });

            // Configure Supplier
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.LicenseNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(500);
            });

            // Configure Drug
            modelBuilder.Entity<Drug>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.GenericName).HasMaxLength(200);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            });

            // Configure Stock
            modelBuilder.Entity<Stock>(entity =>
            {
                entity.Property(e => e.BatchNumber).IsRequired().HasMaxLength(50);
                entity.HasOne<Drug>()
                    .WithMany()
                    .HasForeignKey(s => s.DrugId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Order
            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(e => e.PharmacyId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            });

            // Configure OrderItem
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.UnitPrice)
                    .HasPrecision(18, 2);
                
                entity.Property(e => e.TotalPrice)
                    .HasPrecision(18, 2);

                entity.HasOne(d => d.Drug)
                    .WithMany()
                    .HasForeignKey(d => d.DrugId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Identity tables
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            });
        }
    }
}