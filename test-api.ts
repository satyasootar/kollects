import { trpc } from '../apps/web/trpc/client';
import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:8000/trpc/form.getByIdWithFields?input={"formId":"b84d7b1d-d151-47f8-bcdb-6f4ffc7bc992"}');
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

test();
