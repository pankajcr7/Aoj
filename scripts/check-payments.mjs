// Isolated business and HTTP boundary tests: no network, database or notifications.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function load(path, imports = {}, globals = {}) {
  const compiled = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports: compiled.exports, require: name => name in imports ? imports[name] : name === "@/lib/payment-rules" ? rules : name === "server-only" ? {} : require(name),
    Buffer, File, FormData, Date, URL, Request, Response, AbortSignal, TextEncoder, ...globals }, { filename: path });
  return compiled.exports;
}
const disabledRules = load("src/lib/payment-rules.ts");
assert.equal(disabledRules.RAZORPAY_ENABLED, false, "Razorpay remains paused by default");
const rules = { ...disabledRules, RAZORPAY_ENABLED: true }; // Verify the retained integration too.
const signatures = load("src/lib/payment-signatures.ts");
const options = load("src/lib/form-options.ts");
const sign = (body, secret) => createHmac("sha256", secret).update(body).digest("hex");
const appId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const environment = { env: { RAZORPAY_KEY_ID: "rzp_test_mock", RAZORPAY_KEY_SECRET: "mock-checkout-secret", RAZORPAY_WEBHOOK_SECRET: "mock-webhook-secret" } };
const gateway = load("src/lib/razorpay.ts", {}, { process: environment, fetch: async () => { throw Error("Network forbidden"); } });
const http = load("src/lib/payment-http.ts", { "./razorpay": gateway });
const column = (table, name) => ({ table, name });
const tables = Object.fromEntries(["applications", "payments", "users", "applicationEdits"].map(table => [table,
  Object.fromEntries(["id", "applicationId", "purpose", "status", "razorpayOrderId", "razorpayPaymentId", "orderCreatingAt", "paidAt", "name", "email", "contact", "pvcCardRequested"].map(name => [name, column(table, name)]))]));
const orm = {
  eq: (col, value) => row => row[col.name] instanceof Date ? +row[col.name] === +value : row[col.name] === value,
  isNull: col => row => row[col.name] == null,
  lt: (col, value) => row => row[col.name] != null && row[col.name] < value,
  notInArray: (col, values) => row => !values.includes(row[col.name]),
  and: (...conditions) => row => conditions.filter(Boolean).every(fn => fn(row)),
  or: (...conditions) => row => conditions.filter(Boolean).some(fn => fn(row)),
  sql: (strings, ...values) => ({ strings, values }),
};
function harness(extra = {}) {
  const state = { applications: [{ id: appId, name: "Test Member", email: "test@example.com", contact: "9876543210", status: "pending", pvcCardRequested: true }],
    payments: [{ id: "charge-1", applicationId: appId, purpose: "registration", amount: 40000, membershipAmount: 20000, pvcAmount: 20000, status: "pending", razorpayOrderId: null, razorpayPaymentId: null, orderCreatingAt: null }], writes: 0, creates: 0, fetches: 0 };
  const tableName = table => table.id.table;
  const project = (row, fields) => fields ? Object.fromEntries(Object.entries(fields).map(([name, col]) => [name, row[col.name]])) : { ...row };
  const db = {
    select: fields => ({ from: table => ({ where: predicate => {
      const result = state[tableName(table)].filter(predicate).map(row => project(row, fields));
      result.limit = () => result; return result;
    } }) }),
    update: table => ({ set: values => ({ where: predicate => {
      const execute = fields => state[tableName(table)].filter(predicate).map(row => {
        for (const [key, value] of Object.entries(values)) row[key] = value?.strings ? row[key] || new Date() : value;
        state.writes++; return project(row, fields);
      });
      return { returning: async fields => execute(fields), then: resolve => resolve(execute()) };
    } }) }),
    insert: table => ({ values: values => ({ onConflictDoNothing: async () => {
      const rows = state[tableName(table)];
      if (!rows.some(row => row.applicationId === values.applicationId && row.purpose === values.purpose)) {
        rows.push({ id: "card-charge", status: "pending", razorpayOrderId: null, orderCreatingAt: null, ...values }); state.writes++;
      }
    } }) }),
  };
  const provider = {
    ...gateway,
    createRazorpayOrder: async () => { state.creates++; return { id: "order_Test" }; },
    fetchOrderPayments: async () => [],
    fetchRazorpayPayment: async id => { state.fetches++; return { id, order_id: "order_Test", amount: 40000, currency: "INR", status: "captured", amount_refunded: 0 }; },
    ...extra,
  };
  const service = load("src/lib/payments.ts", { "drizzle-orm": orm, "@/db": { db }, "@/db/schema": tables,
    "./payment-rules": rules, "./razorpay": provider, "./payment-signatures": signatures });
  return { state, db, provider, service };
}
async function main() {
  // Applicant capability cookies and member logins must both remain scoped to one application.
  const jose = await import("jose");
  let cookie, user;
  const access = load("src/lib/payment-access.ts", { jose, "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined, set: (_key, value) => { cookie = value; } }) },
    "./auth": { getUser: async () => user } }, { process: { env: { SESSION_SECRET: "isolated-test-session-secret" } } });
  await access.grantPaymentAccess(appId);
  assert.equal(await access.canPay(appId), true); assert.equal(await access.canPay(otherId), false);
  cookie += "tampered"; assert.equal(await access.canPay(appId), false);
  cookie = await new jose.SignJWT({ applicationId: appId }).setProtectedHeader({ alg: "HS256" }).setAudience("aoje-payments").setExpirationTime("0s").sign(new TextEncoder().encode("isolated-test-session-secret"));
  assert.equal(await access.canPay(appId), false);
  cookie = undefined; user = { role: "member", applicationId: appId };
  assert.equal(await access.canPay(appId), true); assert.equal(await access.canPay(otherId), false);
  user = { role: "admin", applicationId: appId }; assert.equal(await access.canPay(appId), false);

  for (const [type, fee] of [[options.MEMBERSHIP_TYPES[0], 20000], [options.MEMBERSHIP_TYPES[1], 200000]]) {
    for (const card of [null, "pay_later", "pay_now"]) assert.equal(rules.registrationCharge(type, card).amount, fee + (card === "pay_now" ? 20000 : 0));
  }
  assert.equal(rules.registrationCharge("Life", "pay_now"), null);
  const signature = sign("order_Test|pay_Test", environment.env.RAZORPAY_KEY_SECRET);
  assert.equal(signatures.validCheckoutSignature("order_Test", "pay_Test", signature, environment.env.RAZORPAY_KEY_SECRET), true);
  assert.equal(signatures.validCheckoutSignature("order_Other", "pay_Test", signature, environment.env.RAZORPAY_KEY_SECRET), false);
  assert.equal(signatures.validSignature("body", "bad", "secret"), false);
  assert.equal(signatures.validSignature("body ", sign("body", "secret"), "secret"), false);
  const missing = load("src/lib/razorpay.ts", {}, { process: { env: {} } });
  assert.throws(() => missing.razorpayKeys(), error => error.status === 503);

  // Captured payments only; incorrect amount/currency/order never touch the ledger.
  const h = harness(); const row = h.state.payments[0]; row.razorpayOrderId = "order_Test";
  const payment = await h.provider.fetchRazorpayPayment("pay_Test");
  for (const change of [{ amount: 1 }, { currency: "USD" }, { order_id: "order_Other" }, { amount_refunded: payment.amount + 1 }]) {
    await assert.rejects(h.service.recordPayment(row, { ...payment, ...change }), /does not match/);
  }
  assert.equal(h.state.writes, 0);
  assert.equal((await h.service.recordPayment(row, { ...payment, status: "authorized" })).status, "authorized");
  assert.equal((await h.service.recordPayment(row, payment)).status, "paid");
  await h.service.recordPayment(row, { ...payment, id: "pay_FailedRetry", status: "failed" });
  assert.equal(row.status, "paid"); assert.equal(row.razorpayPaymentId, "pay_Test");
  await h.service.recordPayment(row, { ...payment, amount_refunded: 1000 }); assert.equal(row.status, "partially_refunded");
  await h.service.recordPayment(row, payment); assert.equal(row.status, "partially_refunded");
  await h.service.recordPayment(row, { ...payment, amount_refunded: 40000 }); assert.equal(row.status, "refunded");
  await h.service.recordPayment(row, { ...payment, amount_refunded: 1000 }); assert.equal(row.status, "refunded");

  const declinedAuthorization = harness({ fetchOrderPayments: async () => [{ ...payment, status: "failed" }] });
  declinedAuthorization.state.payments[0].razorpayOrderId = "order_Test";
  declinedAuthorization.state.payments[0].razorpayPaymentId = "pay_Test";
  declinedAuthorization.state.payments[0].status = "authorized";
  assert.equal((await declinedAuthorization.service.reconcilePayment(declinedAuthorization.state.payments[0])).status, "failed");

  // Checkout signature must use the application's stored order, before any gateway read.
  const verification = harness(); verification.state.payments[0].razorpayOrderId = "order_Test";
  await assert.rejects(verification.service.verifyCheckout(appId, "registration", "order_Other", "pay_Test", signature), /order does not match/);
  await assert.rejects(verification.service.verifyCheckout(appId, "registration", "order_Test", "pay_Test", "0".repeat(64)), /signature/);
  assert.equal(verification.state.fetches, 0);
  assert.equal((await verification.service.verifyCheckout(appId, "registration", "order_Test", "pay_Test", signature)).status, "paid");

  // Repeated/cancelled checkout reuses its order; simultaneous requests cannot both create one.
  const retry = harness();
  const prepared = await retry.service.preparePayment(appId, "registration");
  assert.equal(prepared.amount, 40000); assert.equal(prepared.orderId, "order_Test");
  assert.equal((await retry.service.preparePayment(appId, "registration")).orderId, "order_Test");
  assert.equal(retry.state.creates, 1);
  let release;
  const concurrent = harness({ createRazorpayOrder: () => new Promise(resolve => { release = resolve; }) });
  const first = concurrent.service.preparePayment(appId, "registration");
  while (!release) await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(concurrent.service.preparePayment(appId, "registration"), error => error.status === 409);
  release({ id: "order_Test" }); await first;
  const unavailable = harness({ createRazorpayOrder: async () => { throw new gateway.PaymentError("Gateway unavailable", 502); } });
  await assert.rejects(unavailable.service.preparePayment(appId, "registration"));
  assert.equal(unavailable.state.payments[0].orderCreatingAt, null);
  assert.equal(unavailable.state.payments[0].status, "pending");

  // Physical pay-later charges are only available to approved, paid members, and never charged twice.
  const later = harness(); later.state.payments[0].pvcAmount = 0; later.state.payments[0].amount = 20000;
  await assert.rejects(later.service.preparePayment(appId, "pvc_card"), /after membership approval/);
  later.state.applications[0].status = "approved";
  await assert.rejects(later.service.preparePayment(appId, "pvc_card"), /membership payment/);
  later.state.payments[0].status = "paid";
  assert.equal((await later.service.preparePayment(appId, "pvc_card")).amount, 20000);
  await later.service.preparePayment(appId, "pvc_card"); assert.equal(later.state.payments.length, 2); assert.equal(later.state.creates, 1);
  const included = harness(); included.state.applications[0].status = "approved"; included.state.payments[0].status = "paid";
  assert.equal((await included.service.preparePayment(appId, "pvc_card")).status, "paid"); assert.equal(included.state.creates, 0);

  // Recover a remotely-created order before attempting another create request.
  let posts = 0;
  const recoveringGateway = load("src/lib/razorpay.ts", {}, { process: environment, fetch: async (_url, init) => {
    if (init.method === "POST") posts++;
    return Response.json({ items: [{ id: "order_Recovered", amount: 40000, currency: "INR", receipt: "charge-1" }] });
  } });
  assert.equal((await recoveringGateway.createRazorpayOrder("charge-1", appId, "registration", 40000)).id, "order_Recovered"); assert.equal(posts, 0);
  await assert.rejects(recoveringGateway.createRazorpayOrder("charge-1", appId, "registration", 1), /Unable to prepare/);

  // HTTP ownership and origin boundaries, with malicious client amounts ignored.
  for (const route of ["order", "verify", "status"]) {
    let accessed = 0;
    const mod = load(`src/app/api/payments/razorpay/${route}/route.ts`, { "@/lib/payment-access": { canPay: async () => false }, "@/lib/payment-http": http,
      "@/lib/payments": new Proxy({}, { get: () => async () => { accessed++; throw Error("Must not access another application's payment"); } }) });
    const body = { applicationId: otherId, purpose: "registration", razorpay_order_id: "order_Test", razorpay_payment_id: "pay_Test", razorpay_signature: signature };
    const url = `https://portal.example/api/payments/razorpay/${route}`;
    const request = route === "status" ? new Request(`${url}?applicationId=${otherId}&purpose=registration`) : new Request(url, { method: "POST", headers: { origin: "https://portal.example" }, body: JSON.stringify(body) });
    const response = await mod[route === "status" ? "GET" : "POST"](request);
    assert.equal(response.status, 403); assert.equal(accessed, 0);
  }
  const orderRoute = load("src/app/api/payments/razorpay/order/route.ts", { "@/lib/payment-access": { canPay: async () => true }, "@/lib/payment-http": http, "@/lib/payments": retry.service });
  const req = origin => new Request("https://portal.example/api/payments/razorpay/order", { method: "POST", headers: { origin }, body: JSON.stringify({ applicationId: appId, purpose: "registration", amount: 1 }) });
  assert.equal((await orderRoute.POST(req("https://evil.example"))).status, 403);
  assert.equal((await (await orderRoute.POST(req("https://portal.example"))).json()).amount, 40000);

  // Webhooks verify the exact raw body before a gateway read, and reconcile current state on replays.
  const wh = harness(); wh.state.payments[0].razorpayOrderId = "order_Test";
  const webhook = load("src/app/api/payments/razorpay/webhook/route.ts", { "drizzle-orm": orm, "@/db": { db: wh.db }, "@/db/schema": tables,
    "@/lib/payment-signatures": signatures, "@/lib/payment-http": http, "@/lib/payments": wh.service, "@/lib/razorpay": wh.provider }, { process: environment });
  const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_Test", order_id: "order_Test" } } } });
  const webhookRequest = (body = raw, signature = sign(body, environment.env.RAZORPAY_WEBHOOK_SECRET)) => new Request("https://portal.example/webhook", { method: "POST", headers: { "x-razorpay-signature": signature }, body });
  assert.equal((await webhook.POST(webhookRequest(raw + " ", sign(raw, environment.env.RAZORPAY_WEBHOOK_SECRET)))).status, 400); assert.equal(wh.state.fetches, 0);
  assert.equal((await webhook.POST(webhookRequest())).status, 200); assert.equal(wh.state.payments[0].status, "paid");
  assert.equal((await webhook.POST(webhookRequest())).status, 200); assert.equal(wh.state.payments[0].status, "paid");
  assert.equal((await webhook.POST(webhookRequest("{"))).status, 400);

  // Registration atomically writes the application + fixed charge; unpaid approval requires confirmation.
  const applicationSchema = load("src/lib/application-schema.ts", { "./form-options": options });
  let batch, grants = 0;
  const registrationDb = { insert: table => ({ values: values => ({ table, values }) }), batch: async queries => { batch = queries; } };
  const registrationImports = { "next/server": { after: () => {} }, "@/db": { db: registrationDb }, "@/db/schema": tables,
    "@/lib/application-schema": applicationSchema, "@/lib/form-options": options, "@/lib/payment-rules": rules, "@/lib/payment-access": { grantPaymentAccess: async () => grants++ },
    "@/lib/messages": { refFor: () => "TESTREF" }, "@/lib/notify": { notify: () => { throw Error("Notifications forbidden"); } } };
  const action = load("src/app/register/actions.ts", registrationImports);
  const base = { name: "Test Member", fatherName: "Test Father", designation: options.DESIGNATIONS[0], dob: "1990-01-01", bloodGroup: "O+", address: "Patiala", correspondingAddress: "  12 Model Town, Patiala  ", pinCode: "147001", company: "PSPCL", dojCompany: "2010-01-01", dojCompanyAs: options.DESIGNATIONS[0], dojCurrentPost: "2020-01-01", dojCurrentPostAs: options.DESIGNATIONS[0], employeeId: "TEST-ONLY", contact: "9876543210", email: "test@example.com", zone: "South", circle: "Patiala", division: "City", subDivision: "City", qualification: options.QUALIFICATIONS[0], discipline: options.DISCIPLINES[0], officeAddress: "Patiala", declarationAccepted: "on" };
  for (const type of options.MEMBERSHIP_TYPES) for (const email of [false, true]) for (const card of ["", "pay_now", "pay_later"]) {
    const fd = new FormData(); for (const [k, v] of Object.entries({ ...base, membershipType: type })) fd.set(k, v);
    if (email) fd.set("cardEmailRequested", "on"); if (card) fd.set("pvcCardPayment", card);
    fd.set("photo", new File([Buffer.from([1, 2, 3])], "photo.png", { type: "image/png" }));
    const result = await action.register({}, fd);
    assert.equal(result.ok, true); assert.equal(batch.length, 2);
    assert.equal(batch[0].values.correspondingAddress, base.correspondingAddress.trim());
    assert.equal(batch[0].values.cardEmailRequested, email); assert.equal(batch[0].values.pvcCardPayment, card || null);
    assert.equal(batch[1].values.applicationId, batch[0].values.id);
    assert.equal(batch[1].values.amount, rules.registrationCharge(type, card).amount);
    assert.equal(result.payment.amount, batch[1].values.amount);
  }
  assert.equal(grants, 12);
  const missingAddress = new FormData();
  for (const [key, value] of Object.entries({ ...base, membershipType: options.MEMBERSHIP_TYPES[0], correspondingAddress: "  " })) missingAddress.set(key, value);
  missingAddress.set("photo", new File([Buffer.from([1, 2, 3])], "photo.png", { type: "image/png" }));
  assert.ok((await action.register({}, missingAddress)).errors.correspondingAddress);
  assert.equal(grants, 12, "Invalid registration cannot write or grant payment access");
  assert.equal(applicationSchema.applicationSchema.parse({ ...base, correspondingAddress: undefined }).correspondingAddress, null, "Legacy corrections can leave the new field blank");

  function approvalHarness(paymentStatus, reviewed = false, paymentChanged = false, enabled = true) {
    const state = { sequenceCalls: 0, approvalCalls: 0, notifications: 0, paymentStatus, paymentReads: 0 };
    const db = {
      select: () => ({ from: table => ({ where: async () => {
        if (table === tables.payments) { state.paymentReads++; return paymentStatus == null ? [] : [{ status: paymentStatus }]; }
        return [{ id: appId, name: "Test Member", email: "test@example.com", contact: "9876543210", status: reviewed ? "approved" : "pending" }];
      } }) }),
      execute: async query => {
        if (query.strings.join("").includes("nextval")) { state.sequenceCalls++; return { rows: [{ n: 1001 }] }; }
        state.approvalCalls++;
        assert.ok(query.strings.join("").includes("status = 'pending'"), "Approval remains guarded against duplicate review");
        assert.ok(query.strings.join("").includes("not exists"), "Payment changes are checked atomically");
        return { rows: reviewed || paymentChanged ? [] : [{ id: "mock-user" }] };
      },
    };
    const actions = load("src/app/dashboard/actions.ts", { "drizzle-orm": orm, "@/db": { db }, "@/db/schema": tables,
      bcryptjs: { default: { hash: async () => "mock-hash" } }, "next/cache": { revalidatePath: () => {} }, "@/lib/application-schema": applicationSchema,
      "@/lib/auth": { requireRole: async () => ({ id: "admin" }), STAFF: ["admin", "operations"] }, "@/lib/form-options": options,
      "@/lib/payment-rules": enabled ? rules : disabledRules,
      "@/lib/credentials": load("src/lib/credentials.ts"), "@/lib/member-card": { memberCard: async () => null },
      "@/lib/notify": { notify: async () => { state.notifications++; return { email: "skipped", sms: "skipped" }; } } });
    return { state, actions };
  }
  for (const status of ["pending", "created", "authorized", "failed", "refunded", "partially_refunded"]) {
    const h = approvalHarness(status);
    const result = await h.actions.approveApplication(appId);
    assert.equal(result.paymentConfirmationRequired, true);
    assert.equal(result.error, "Payment is not received. Are you sure you want to accept the application?");
    assert.equal(h.state.sequenceCalls, 0); assert.equal(h.state.notifications, 0);
    assert.equal((await h.actions.approveApplication(appId, "yes")).paymentConfirmationRequired, true, "Only an explicit boolean confirmation permits unpaid approval");
    const confirmed = await h.actions.approveApplication(appId, true);
    assert.equal(confirmed.membershipNo, "AOJE-1001"); assert.ok(confirmed.password);
    assert.equal(h.state.approvalCalls, 1); assert.equal(h.state.notifications, 1);
    assert.equal(h.state.paymentStatus, status, "Approval leaves payment status unchanged");
  }
  for (const status of ["paid", null]) assert.ok((await approvalHarness(status).actions.approveApplication(appId)).password);
  const duplicate = approvalHarness("pending", true);
  assert.equal((await duplicate.actions.approveApplication(appId, true)).error, "This application was already reviewed.");
  assert.equal(duplicate.state.notifications, 0);
  const changed = approvalHarness("paid", false, true);
  assert.equal((await changed.actions.approveApplication(appId)).paymentConfirmationRequired, true);
  assert.equal(changed.state.notifications, 0);
  // Paused mode saves only the application and approves unpaid applications directly.
  const pausedAction = load("src/app/register/actions.ts", { ...registrationImports, "@/lib/payment-rules": disabledRules });
  const offline = new FormData();
  for (const [key, value] of Object.entries({ ...base, membershipType: options.MEMBERSHIP_TYPES[0], pvcCardRequested: "on", pvcCardPayment: "pay_now" })) offline.set(key, value);
  offline.set("photo", new File([Buffer.from([1, 2, 3])], "photo.png", { type: "image/png" }));
  const offlineResult = await pausedAction.register({}, offline);
  assert.equal(offlineResult.ok, true); assert.equal(offlineResult.payment, undefined);
  assert.equal(batch.length, 1); assert.equal(batch[0].values.pvcCardPayment, null);
  assert.equal(batch[0].values.pvcCardRequested, true); assert.equal(grants, 12);
  for (const status of ["pending", "authorized", "failed", "refunded", "paid", null]) {
    const h = approvalHarness(status, false, false, false);
    assert.ok((await h.actions.approveApplication(appId)).password);
    assert.equal(h.state.paymentReads, 0); assert.equal(h.state.paymentStatus, status);
  }
  for (const name of ["order", "status", "verify", "webhook"]) {
    const route = load(`src/app/api/payments/razorpay/${name}/route.ts`, {
      "@/db": { db: {} }, "@/db/schema": tables, "@/lib/payment-access": {}, "@/lib/payment-http": http,
      "@/lib/payments": {}, "@/lib/razorpay": {}, "@/lib/payment-signatures": {}, "@/lib/payment-rules": disabledRules,
    });
    const response = await (route.POST ?? route.GET)(new Request("https://portal.example/api/payments/razorpay/" + name));
    assert.equal(response.status, 503); assert.match((await response.json()).error, /disabled/);
  }
  console.log("Payment checks passed: paused registration and direct approval, disabled payment endpoints, retained checkout/signature/refund/retry/webhook behavior and corresponding address. No network, database writes or notifications.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
