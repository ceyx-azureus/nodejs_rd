import 'dotenv/config';

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const productId = process.env.PRODUCT_ID;
const userId = process.env.USER_ID;

if (!productId || !userId) {
  console.error('PRODUCT_ID and USER_ID must be set in env');
  process.exit(1);
}

const requests = Number(process.env.REQUESTS ?? 30);

async function run() {
  const body = {
    userId,
    items: [{ productId, quantity: 1 }],
  };

  const tasks = Array.from({ length: requests }, () =>
    fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    }).then(async (res) => ({
      status: res.status,
      body: await res.text(),
    })),
  );

  const results = await Promise.all(tasks);
  const ok = results.filter((r) => r.status === 201 || r.status === 200).length;
  const conflicts = results.filter((r) => r.status === 409).length;
  const errors = results.filter(
    (r) => r.status >= 400 && r.status !== 409,
  ).length;

  console.log({ requests, ok, conflicts, errors });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

// [
//   { id: '8bd2d704-24a3-423e-994f-2ae48855ccf3', stock: 2 },
//   { id: '0edc5db8-91aa-4400-85e0-d3428a08f576', stock: 20 },
//   { id: 'd1065915-3e3d-470b-969b-e451830de925', stock: 20 },
//   { id: '2414d7cf-e8f3-498e-82b7-70f3e6cfc4f5', stock: 20 },
//   { id: 'f0485464-7332-47da-9ea6-03ced2a68cae', stock: 20 },
//   { id: '87fb2987-c5a8-4f69-8c92-df8bdd767a3b', stock: 2 },
//   { id: '89a40d5b-d150-44be-befb-f9095961ce13', stock: 20 },
//   { id: '71cd6df1-2216-46f0-a804-54e02068337e', stock: 20 },
//   { id: 'ab29e865-51ca-42de-97c1-e7a209f13278', stock: 20 },
//   { id: '03537c6c-590d-42a1-a203-f1066b9d9728', stock: 20 },
//   { id: 'c61bab19-d8dc-4fe2-9a61-98fcd495a7cf', stock: 2 },
//   { id: 'bc933d58-e188-4e6a-98cd-7ffeb7d4f588', stock: 20 },
//   { id: '1f8a0908-b4b2-4303-9c8f-2e5aeb9ce626', stock: 20 },
//   { id: 'b1d68361-8683-4a78-b36f-621bd49c1cfc', stock: 20 },
//   { id: '34f5b056-a65c-492b-a8d4-328bb04cdb14', stock: 20 },
//   { id: '475b381a-2b98-48ef-8ba1-d9edc88e1d4d', stock: 2 },
//   { id: '0eb1505c-d5a7-4c0e-bfdc-764651010f63', stock: 20 },
//   { id: '0cc8ddb3-816b-4dd1-a09c-c8fcac20bd07', stock: 20 },
//   { id: '3adf56a5-1fd7-4e25-a088-68e80273196d', stock: 20 },
//   { id: 'b6999004-497e-455f-a0b7-42dc0b439cd2', stock: 20 },
//   { id: '04fb9d66-9a94-4fd0-be5f-2c0ad08ecf9b', stock: 2 },
//   { id: '8335c01f-7a14-4f61-9b1a-dfef89fdfb5f', stock: 20 },
//   { id: '91e45ea7-cbfd-4548-98a9-75903d764e71', stock: 20 }
// ]
// user - 2a415eb9-caaf-4004-a4b0-e0d152c22afc
