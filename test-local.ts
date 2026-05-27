import { FormService } from './packages/services/form/index';
async function test() {
  const service = new FormService();
  const form = await service.getByIdWithFields("b84d7b1d-d151-47f8-bcdb-6f4ffc7bc992", "3fa85f64-5717-4562-b3fc-2c963f66afa6");
  console.log(form);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
