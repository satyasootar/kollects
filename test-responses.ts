import { ResponseService } from "./packages/services/response/index";

async function run() {
  try {
    const responseService = new ResponseService();
    const res = await responseService.list("85226960-0aa0-4345-bee7-0f364e82eb54", "b84d7b1d-d151-47f8-bcdb-6f4ffc7bc992", 1, 10);
    console.log(JSON.stringify(res, null, 2));
  } catch(e) { console.error(e) }
}
run();
