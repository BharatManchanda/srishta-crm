import seedModules from './module.seeder';

async function main() {
    await seedModules();
}

main()
    .then(() => {
        console.log('Seeding completed');
    })
    .catch((e) => {
        console.error(e);
    });