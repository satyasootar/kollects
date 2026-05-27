import { FormService } from "./packages/services/form/index";

async function run() {
  try {
    const formService = new FormService();
    const form = await formService.getPublicBySlug("untitled-form-1");
    console.log(JSON.stringify(form, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
