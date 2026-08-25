import seedAdmin from './admin.seeder';
import seedModules from './module.seeder';
import seedPlans from './plan.seeder';
import rolePermissions from './role-permissions.seeder';

async function main() {
	await seedAdmin();
	await seedModules();
	await seedPlans();
	await rolePermissions();
}

main()
	.then(() => {
		console.log('Seeding completed');
	})
	.catch((e) => {
		console.error(e);
	});