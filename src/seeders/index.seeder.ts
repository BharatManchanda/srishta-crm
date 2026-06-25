import seedModules from './module.seeder';
import rolePermissions from './role-permissions.seeder';
async function main() {
    await seedModules();
    await rolePermissions();
}

main()
    .then(() => {
        console.log('Seeding completed');
    })
    .catch((e) => {
        console.error(e);
    });