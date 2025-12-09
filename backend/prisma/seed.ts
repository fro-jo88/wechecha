import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Users first (without location assignment)
    const hashedPassword = await bcrypt.hash('password', 10);

    const superAdmin = await prisma.user.create({
        data: {
            email: 'superadmin@test.com',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    const storeManager1 = await prisma.user.create({
        data: {
            email: 'storemanager@test.com',
            name: 'John Store Manager',
            role: 'STORE_MANAGER',
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    const storeManager2 = await prisma.user.create({
        data: {
            email: 'storemanager2@test.com',
            name: 'Sarah Store Manager',
            role: 'STORE_MANAGER',
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    const siteEngineer1 = await prisma.user.create({
        data: {
            email: 'siteengineer@test.com',
            name: 'Jane Site Engineer',
            role: 'SITE_ENGINEER',
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    const siteEngineer2 = await prisma.user.create({
        data: {
            email: 'siteengineer2@test.com',
            name: 'Mike Site Engineer',
            role: 'SITE_ENGINEER',
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    console.log('✅ Users created');

    // Create Locations (Stores and Sites) with manager/engineer assignments
    const centralStore = await prisma.location.create({
        data: {
            name: 'Central Store',
            type: 'STORE',
            status: 'ACTIVE',
            address: '123 Main St, Downtown',
            region: 'North',
            description: 'Main warehouse for northern region operations',
            managerId: storeManager1.id,
        },
    });

    const northWarehouse = await prisma.location.create({
        data: {
            name: 'North Warehouse',
            type: 'STORE',
            status: 'ACTIVE',
            address: '456 Industrial Ave, North District',
            region: 'North',
            description: 'Secondary storage facility',
            managerId: storeManager2.id,
        },
    });

    const downtownPlaza = await prisma.location.create({
        data: {
            name: 'Downtown Plaza',
            type: 'SITE',
            status: 'ACTIVE',
            address: '789 Plaza Blvd, City Center',
            region: 'Central',
            description: 'Commercial plaza construction project',
            engineerId: siteEngineer1.id,
        },
    });

    const westsideMall = await prisma.location.create({
        data: {
            name: 'Westside Mall',
            type: 'SITE',
            status: 'ACTIVE',
            address: '321 West Ave, Westside',
            region: 'West',
            description: 'Shopping mall construction',
            engineerId: siteEngineer2.id,
        },
    });

    const harborBridge = await prisma.location.create({
        data: {
            name: 'Harbor Bridge',
            type: 'SITE',
            status: 'ACTIVE',
            address: '654 Harbor Rd, Waterfront',
            region: 'South',
            description: 'Bridge infrastructure project',
            engineerId: siteEngineer1.id,
        },
    });

    console.log('✅ Locations created');

    // Update users with location assignments
    await prisma.user.update({
        where: { id: storeManager1.id },
        data: { locationId: centralStore.id },
    });

    await prisma.user.update({
        where: { id: storeManager2.id },
        data: { locationId: northWarehouse.id },
    });

    await prisma.user.update({
        where: { id: siteEngineer1.id },
        data: { locationId: downtownPlaza.id },
    });

    await prisma.user.update({
        where: { id: siteEngineer2.id },
        data: { locationId: westsideMall.id },
    });

    console.log('✅ User locations assigned');

    // Create Products (renamed from Items)
    const bricks = await prisma.product.create({
        data: {
            name: 'Red Bricks',
            sku: 'PRD-BLD-001',
            category: 'Building Materials',
            unit: 'pieces',
            description: 'Standard red clay bricks for construction',
            price: 0.5,
            defaultMinStock: 1000,
            status: 'ACTIVE',
        },
    });

    const cement = await prisma.product.create({
        data: {
            name: 'Portland Cement',
            sku: 'PRD-BLD-002',
            category: 'Building Materials',
            unit: 'bags',
            description: 'Portland cement bags (50kg each)',
            price: 12.0,
            defaultMinStock: 100,
            status: 'ACTIVE',
        },
    });

    const generators = await prisma.product.create({
        data: {
            name: 'Portable Generator',
            sku: 'PRD-EQP-001',
            category: 'Equipment',
            unit: 'units',
            description: '5KW portable diesel generators',
            price: 500.0,
            defaultMinStock: 5,
            status: 'ACTIVE',
        },
    });

    const steelRods = await prisma.product.create({
        data: {
            name: 'Steel Reinforcement Rods',
            sku: 'PRD-BLD-003',
            category: 'Building Materials',
            unit: 'kg',
            description: 'Steel rods for concrete reinforcement',
            price: 2.5,
            defaultMinStock: 500,
            status: 'ACTIVE',
        },
    });

    const paint = await prisma.product.create({
        data: {
            name: 'Exterior Paint',
            sku: 'PRD-FIN-001',
            category: 'Finishing',
            unit: 'liters',
            description: 'Weather-resistant exterior paint',
            price: 15.0,
            defaultMinStock: 200,
            status: 'ACTIVE',
        },
    });

    console.log('✅ Products created');

    // Create Inventory
    await prisma.inventory.createMany({
        data: [
            // Central Store inventory
            { locationId: centralStore.id, productId: bricks.id, quantity: 10000 },
            { locationId: centralStore.id, productId: cement.id, quantity: 500 },
            { locationId: centralStore.id, productId: generators.id, quantity: 10 },
            { locationId: centralStore.id, productId: steelRods.id, quantity: 2000 },
            { locationId: centralStore.id, productId: paint.id, quantity: 300 },

            // North Warehouse inventory
            { locationId: northWarehouse.id, productId: bricks.id, quantity: 5000 },
            { locationId: northWarehouse.id, productId: cement.id, quantity: 300 },
            { locationId: northWarehouse.id, productId: steelRods.id, quantity: 1000 },

            // Downtown Plaza site inventory
            { locationId: downtownPlaza.id, productId: bricks.id, quantity: 500 },
            { locationId: downtownPlaza.id, productId: cement.id, quantity: 100 },
            { locationId: downtownPlaza.id, productId: generators.id, quantity: 2 },

            // Westside Mall site inventory
            { locationId: westsideMall.id, productId: cement.id, quantity: 100 },
            { locationId: westsideMall.id, productId: steelRods.id, quantity: 200 },

            // Harbor Bridge site inventory
            { locationId: harborBridge.id, productId: bricks.id, quantity: 300 },
            { locationId: harborBridge.id, productId: steelRods.id, quantity: 150 },
        ],
    });

    console.log('✅ Inventory created');

    // Create sample Inventory Requests
    const request1 = await prisma.inventoryRequest.create({
        data: {
            productId: paint.id,
            locationId: downtownPlaza.id,
            quantity: 50,
            requestedById: superAdmin.id,
            status: 'PENDING',
        },
    });

    const request2 = await prisma.inventoryRequest.create({
        data: {
            productId: generators.id,
            locationId: westsideMall.id,
            quantity: 3,
            requestedById: superAdmin.id,
            status: 'PENDING',
        },
    });

    const request3 = await prisma.inventoryRequest.create({
        data: {
            productId: cement.id,
            locationId: harborBridge.id,
            quantity: 150,
            requestedById: superAdmin.id,
            status: 'APPROVED',
            approvedById: siteEngineer1.id,
        },
    });

    console.log('✅ Inventory requests created');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📧 Login credentials (all use password: "password"):');
    console.log('   Super Admin: superadmin@test.com');
    console.log('   Store Manager 1: storemanager@test.com (Central Store)');
    console.log('   Store Manager 2: storemanager2@test.com (North Warehouse)');
    console.log('   Site Engineer 1: siteengineer@test.com (Downtown Plaza)');
    console.log('   Site Engineer 2: siteengineer2@test.com (Westside Mall)');
    console.log('\n📊 Database Contents:');
    console.log(`   - ${await prisma.location.count()} Locations (2 Stores, 3 Sites)`);
    console.log(`   - ${await prisma.product.count()} Products`);
    console.log(`   - ${await prisma.user.count()} Users`);
    console.log(`   - ${await prisma.inventory.count()} Inventory records`);
    console.log(`   - ${await prisma.inventoryRequest.count()} Inventory requests (2 pending, 1 approved)`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
