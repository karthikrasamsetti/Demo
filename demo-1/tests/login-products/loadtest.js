// Exported by PerfAgent for CI/CD. Regenerate from PerfAgent rather than
// editing by hand, so the script stays in step with its approved plan.
// Auto-generated k6 script. Do not edit by hand - regenerate from the LoadModel.
//
// Target: http://127.0.0.1:8000
// Profile: ramp | peak VUs: 3 | duration: 15s
//
// Run with:
//   k6 run loadtest.js
// Override the target at runtime:
//   k6 run -e BASE_URL=http://127.0.0.1:8000 loadtest.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const errorRate = new Rate('errors');
function DYN_HEADERS(vars, row) {
  return { "Authorization": `Bearer ${vars.token}` };
}

export const options = {
  scenarios: {
    browse_products: {
      executor: 'ramping-vus',
      exec: 'browseProducts',
      startVUs: 0,
      stages: [
        { duration: '3s', target: 2 },
        { duration: '9s', target: 2 },
        { duration: '3s', target: 0 },
      ],
    },
    login_and_browse_products: {
      executor: 'ramping-vus',
      exec: 'loginAndBrowseProducts',
      startVUs: 0,
      stages: [
        { duration: '3s', target: 1 },
        { duration: '9s', target: 1 },
        { duration: '3s', target: 0 },
      ],
    },
  },
  thresholds: {
    'errors': ['rate<0.05'],
    'http_req_duration': ['p(95)<=500'],
  },
};

export function browseProducts() {
  let vars = {};
  group("Browse Products", function () {
    {
      const res = http.get(`${BASE_URL}/products`, { headers: DYN_HEADERS(vars, typeof row !== 'undefined' ? row : {}), tags: { name: "View Products" } });
      const ok = check(res, { "View Products status ok": (r) => r.status >= 200 && r.status < 400 });
      errorRate.add(res.status >= 400 || !ok);
      if (res.status >= 400 || !ok) {
        console.error(`[FAIL][VU ${__VU}] View Products — status ${res.status}` + (res.body ? ` — body: ${String(res.body).replace(/\s+/g,' ').slice(0,180)}` : ''));
      }
    }
    sleep(Math.random() * 2.0 + 2.0);
  });
}

export function loginAndBrowseProducts() {
  let vars = {};
  group("Login and Browse Products", function () {
    {
      const payload = JSON.stringify({"user": "demo", "password": "x"});
      const params = { headers: Object.assign({ 'Content-Type': 'application/json' }, DYN_HEADERS(vars, typeof row !== 'undefined' ? row : {})), tags: { name: "Login" } };
      const res = http.post(`${BASE_URL}/login`, payload, params);
      const ok = check(res, { "Login status ok": (r) => r.status >= 200 && r.status < 400 });
      errorRate.add(res.status >= 400 || !ok);
      if (res.status >= 400 || !ok) {
        console.error(`[FAIL][VU ${__VU}] Login — status ${res.status}` + (res.body ? ` — body: ${String(res.body).replace(/\s+/g,' ').slice(0,180)}` : ''));
      }
      try { vars.token = res.json("token"); } catch (e) { vars.token = ''; }
    }
    sleep(Math.random() * 2.0 + 3.0);
    {
      const res = http.get(`${BASE_URL}/products`, { headers: DYN_HEADERS(vars, typeof row !== 'undefined' ? row : {}), tags: { name: "View Products after Login" } });
      const ok = check(res, { "View Products after Login status ok": (r) => r.status >= 200 && r.status < 400 });
      errorRate.add(res.status >= 400 || !ok);
      if (res.status >= 400 || !ok) {
        console.error(`[FAIL][VU ${__VU}] View Products after Login — status ${res.status}` + (res.body ? ` — body: ${String(res.body).replace(/\s+/g,' ').slice(0,180)}` : ''));
      }
    }
    sleep(Math.random() * 2.0 + 3.0);
  });
}
