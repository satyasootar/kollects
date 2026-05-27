async function run() {
  const res = await fetch('http://localhost:8000/trpc/publicForm.getBySlug?input={"slug":"untitled-form-1"}');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
